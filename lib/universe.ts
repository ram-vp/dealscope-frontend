// The bundled dataset. Server components, route handlers and tests only: a
// client component importing this would ship every company to every visitor.
// The browser gets the same data through lib/use-universe.ts.

import companiesData from "@/data/companies.json"
import dealsData from "@/data/deals.json"
import {
  type Company,
  type CompanyRecord,
  type DealRow,
  type IndustryGroup,
  type IndustryOption,
  type Sector,
  getIndustriesForSectors,
  getIndustryGroups,
  getSectors,
  mapCompanyRecord,
} from "@/lib/dealscope-data"

export const COMPANY_RECORDS = companiesData as CompanyRecord[]

const ALL_COMPANIES: Company[] = COMPANY_RECORDS.map(mapCompanyRecord)
const ALL_DEALS = dealsData as DealRow[]
const ALL_SECTORS = getSectors(ALL_COMPANIES)
const ALL_INDUSTRIES = getIndustriesForSectors(ALL_COMPANIES, [])
const ALL_INDUSTRY_GROUPS = getIndustryGroups(ALL_COMPANIES)
const DATA_AS_OF = COMPANY_RECORDS[0]?.as_of_date ?? ""

export function getCompanies(): {
  companies: Company[]
  sectors: Sector[]
  industries: IndustryOption[]
  industryGroups: IndustryGroup[]
  dataAsOf: string
} {
  return {
    companies: ALL_COMPANIES,
    sectors: ALL_SECTORS,
    industries: ALL_INDUSTRIES,
    industryGroups: ALL_INDUSTRY_GROUPS,
    dataAsOf: DATA_AS_OF,
  }
}

export function getDeals(): DealRow[] {
  return ALL_DEALS
}
