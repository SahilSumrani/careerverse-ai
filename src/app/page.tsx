import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/landing/home-hero";
import { HomeTools } from "@/components/landing/home-tools";
import { HomeLookingFor } from "@/components/landing/home-looking-for";
import { HomeResumeCta } from "@/components/landing/home-resume-cta";
import { HomeFeatureStrip } from "@/components/landing/home-feature-strip";
import { HomeAiSearch } from "@/components/landing/home-ai-search";
import { HomePerks } from "@/components/landing/home-perks";
import { HomePipeline } from "@/components/landing/home-pipeline";
import { HomeEmpowerCta } from "@/components/landing/home-empower-cta";
import { HomeFinalCta } from "@/components/landing/home-final-cta";
import "@/components/landing/home-shared.css";

export default function LandingPage() {
  return (
    <div className="cv-home min-h-screen">
      <SiteHeader />
      <main>
        <HomeHero />
        <HomeTools />
        <HomeLookingFor />
        <HomeResumeCta />
        <HomeFeatureStrip />
        <HomeAiSearch />
        <HomePerks />
        <HomePipeline />
        <HomeEmpowerCta />
        <HomeFinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
