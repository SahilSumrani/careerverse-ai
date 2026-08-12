import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/landing/home-hero";
import { HomeTools } from "@/components/landing/home-tools";
import { HomeLane } from "@/components/landing/home-lane";
import { HomeLookingFor } from "@/components/landing/home-looking-for";
import { HomeResumeCta } from "@/components/landing/home-resume-cta";
import { HomeFeatureStrip } from "@/components/landing/home-feature-strip";
import { HomeAiSearch } from "@/components/landing/home-ai-search";
import { HomePerks } from "@/components/landing/home-perks";
import { HomePipeline } from "@/components/landing/home-pipeline";
import { HomeEmpowerCta } from "@/components/landing/home-empower-cta";
import { HomeFinalCta } from "@/components/landing/home-final-cta";
import "@/components/landing/home-shared.css";

/**
 * Recruiter-first IA (no audience ping-pong):
 * Hero → Products → Magic AI Search → Live funnel → Talent/Hiring → Perks
 * then Candidate lane: Looking-for → Resume → Empower → close CTAs
 */
export default function LandingPage() {
  return (
    <div className="cv-home min-h-screen">
      <SiteHeader />
      <main>
        <HomeHero />

        <HomeLane
          audience="recruiters"
          id="for-recruiters"
          title="Hiring tools that show signal before the interview"
          lead="Score, search, and track candidates with explainable AI—built for recruiting teams."
        />
        <HomeTools />
        <HomeAiSearch />
        <HomePipeline />
        <HomeFeatureStrip />
        <HomePerks />

        <HomeLane
          audience="candidates"
          id="for-candidates"
          title="Looking for your next role?"
          lead="Browse fresher jobs and internships, build your resume, and apply with clear match scores."
        />
        <HomeLookingFor />
        <HomeResumeCta />
        <HomeEmpowerCta />
        <HomeFinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
