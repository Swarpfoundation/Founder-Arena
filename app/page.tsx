import { ScrollProgress } from "@/components/fa/primitives";
import { SiteHeader } from "@/components/fa/site-header";
import { Hero } from "@/components/fa/hero";
import { Premise } from "@/components/fa/premise";
import { FounderJourney } from "@/components/fa/founder-journey";
import { Lifecycle } from "@/components/fa/lifecycle";
import { Gameplay } from "@/components/fa/gameplay";
import { InvestorEcosystem } from "@/components/fa/investor-ecosystem";
import { CommandCenter } from "@/components/fa/command-center";
import { Ecosystem } from "@/components/fa/ecosystem";
import { Faq } from "@/components/fa/faq";
import { FinalCta } from "@/components/fa/final-cta";
import { SiteFooter } from "@/components/fa/site-footer";

export default function HomePage() {
  return (
    <div className="marketing-page relative flex min-h-screen flex-col bg-[#05070b]">
      <ScrollProgress />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Premise />
        <FounderJourney />
        <Lifecycle />
        <Gameplay />
        <InvestorEcosystem />
        <CommandCenter />
        <Ecosystem />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
