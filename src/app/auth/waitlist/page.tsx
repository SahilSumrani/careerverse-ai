import Link from "next/link";
import "@/components/auth/auth-shell.css";

export default function WaitlistPage() {
  return (
    <main className="cv-auth-shell" style={{ gridTemplateColumns: "1fr" }}>
      <section className="cv-auth-form-pane">
        <div className="cv-auth-form-inner">
          <Link href="/" className="cv-auth-brand">
            <span className="cv-auth-brand-mark">CV</span>
            CareerVerse AI
          </Link>
          <h1>You&apos;re on the waitlist</h1>
          <p className="cv-auth-lead">
            Thanks for registering. We&apos;ll notify you when your account is approved.
          </p>
          <p className="cv-auth-foot">
            <Link href="/">Back to home</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
