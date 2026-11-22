import { expect, test } from "vitest"
import narratives from "@/data/narratives.json"
import { DETAIL_FILES } from "../company-detail-files"
import { detailShard } from "../data-paths"
import { getIndustryGroups, getSectors, mapCompanyRecord } from "../dealscope-data"
import { COMPANY_RECORDS, getCompanies, getDeals } from "../universe"
import { decodeUniverse, encodeUniverse } from "../universe-payload"

const decoded = decodeUniverse(JSON.parse(JSON.stringify(encodeUniverse(COMPANY_RECORDS, getDeals()))))

test("the browser sees exactly the companies the server does", () => {
  const { companies, sectors, industryGroups } = getCompanies()
  const inBrowser = decoded.companies.map(mapCompanyRecord)
  // Through JSON on both sides: the source has a literal -0.0, which the wire can't carry.
  expect(JSON.parse(JSON.stringify(inBrowser))).toEqual(JSON.parse(JSON.stringify(companies)))
  expect(getSectors(inBrowser)).toEqual(sectors)
  expect(getIndustryGroups(inBrowser)).toEqual(industryGroups)
})

test("deals survive the wire format", () => {
  expect(decoded.deals).toHaveLength(getDeals().length)
  getDeals().forEach((deal, i) => expect(decoded.deals[i]).toMatchObject(deal))
})

test("every narrative is in the shard the browser will ask for", () => {
  const lost = Object.keys(narratives).filter((ticker) => !DETAIL_FILES[detailShard(ticker)][ticker])
  expect(lost).toEqual([])
})
