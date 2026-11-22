"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanyBrief } from "@/components/dealscope/tear-sheet/brief"
import { ComparableDeals } from "@/components/dealscope/tear-sheet/deals"
import { FactorBreakdown } from "@/components/dealscope/tear-sheet/factors"
import { KeyFinancials } from "@/components/dealscope/tear-sheet/financials"
import { TearSheetHeader } from "@/components/dealscope/tear-sheet/header"
import { FilingsAndNews } from "@/components/dealscope/tear-sheet/news"
import { OwnershipStructure } from "@/components/dealscope/tear-sheet/ownership"
import { SectorPeers } from "@/components/dealscope/tear-sheet/peers"
import { ValuationRange } from "@/components/dealscope/tear-sheet/valuation"
import {
  type Company,
  type DealRow,
  type Weights,
  computeScore,
  sectorAverage,
  computeSectorRank,
  findClosestPeers,
} from "@/lib/dealscope-data"
import { useCompanyDetails } from "@/lib/company-details"

interface TearSheetViewProps {
  company: Company
  weights: Weights
  onBack: () => void
  companies: Company[]
  deals: DealRow[]
  onSelectCompany?: (company: Company) => void
}

/** Composition only. Each numbered section lives in ./tear-sheet/. */
export function TearSheetView({ company, weights, onBack, companies, deals, onSelectCompany }: TearSheetViewProps) {
  const score = computeScore(company.factors, weights)
  const avg = sectorAverage(companies, company.sector, weights)
  const sectorRank = computeSectorRank(company, companies, weights)
  const peers = findClosestPeers(company, companies, 5)
  const { status, retry, narrative, news } = useCompanyDetails(company.ticker)

  return (
    <section className="relative mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 md:px-12 md:py-16">
      <Button variant="ghost" onClick={onBack} className="px-0">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to Screener
      </Button>

      <TearSheetHeader company={company} score={score} avg={avg} sectorRank={sectorRank} />
      <KeyFinancials company={company} />
      <FactorBreakdown company={company} weights={weights} />
      <SectorPeers company={company} score={score} peers={peers} weights={weights} onSelectCompany={onSelectCompany} />
      <CompanyBrief company={company} weights={weights} score={score} narrative={narrative} detailsStatus={status} retry={retry} />
      <ValuationRange company={company} />
      <OwnershipStructure company={company} />
      <ComparableDeals company={company} deals={deals} />
      <FilingsAndNews companyNews={news} detailsStatus={status} retry={retry} />

      <div className="mt-16 border-t border-border pt-8 md:mt-24">
        <Button onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Return to Screener
        </Button>
      </div>
    </section>
  )
}
