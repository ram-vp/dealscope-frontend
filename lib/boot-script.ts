import { UNIVERSE_PATH } from "@/lib/data-paths"

// Runs before first paint, so it must stay tiny, dependency-free and ES5-safe.
//
//  1. Theme: apply the saved choice so light-mode users don't get a dark flash.
//  2. Deep links: `/` is prerendered as the landing page. For ?view=results or
//     ?ticker=... hide that markup (see globals.css) and start the universe
//     download now, instead of waiting for the JS bundle to ask for it.
export const BOOT_SCRIPT = `(function(){var d=document.documentElement,p=new URLSearchParams(location.search),t=p.get("theme");
try{if(t!=="light"&&t!=="dark")t=localStorage.getItem("dealscope-theme")}catch(e){}
if(t==="light"){d.classList.remove("dark");d.classList.add("light")}
if(location.pathname!=="/")return;
var v=p.get("view"),deep=(p.get("ticker")||"").trim()||v==="results"||v==="detail";
if(deep)d.setAttribute("data-deeplink","");
if(deep||p.get("q")||p.get("sectors")||p.get("ind")||p.get("num")||p.get("bands")){
var l=document.createElement("link");l.rel="preload";l.as="fetch";l.crossOrigin="anonymous";l.href="${UNIVERSE_PATH}";document.head.appendChild(l)}})();`
