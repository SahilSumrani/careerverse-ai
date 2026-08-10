import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/landing/home-hero";
import { HomeTools } from "@/components/landing/home-tools";
import { HomeFeatureStrip } from "@/components/landing/home-feature-strip";
import { HomeAiSearch } from "@/components/landing/home-ai-search";
import { HomePerks } from "@/components/landing/home-perks";
import { HomePipeline } from "@/components/landing/home-pipeline";
import { HomeFinalCta } from "@/components/landing/home-final-cta";
import "@/components/landing/home-shared.css";

export default function LandingPage() {
  return (
    <div className="cv-home min-h-screen">
      <SiteHeader />
      <main>
        <HomeHero />
        <HomeTools />
        <HomeFeatureStrip />
        <HomeAiSearch />
        <HomePerks />
        <HomePipeline />
        <HomeFinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
