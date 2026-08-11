import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** Public platform pages (careers, etc.) — app shell routes live under (app). */
export const dynamic = "force-dynamic";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
