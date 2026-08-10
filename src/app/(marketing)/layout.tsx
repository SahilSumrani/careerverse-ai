import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "@/components/landing/home-shared.css";
import "@/components/landing/marketing-page.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cv-home min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
