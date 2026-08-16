import Link from "next/link";
import { Briefcase, GraduationCap, Users } from "lucide-react";
import "@/components/auth/auth-shell.css";

const tracks = [
  {
    href: "/auth/register/student",
    title: "Student / Job seeker",
    desc: "Build your profile, upload a resume, explore roles, and track applications.",
    icon: GraduationCap,
    cta: "Register as student",
  },
  {
    href: "/auth/register/mentor",
    title: "Mentor",
    desc: "Share expertise and guide early-career talent. Admin reviews every mentor signup.",
    icon: Users,
    cta: "Register as mentor",
  },
  {
    href: "/auth/register/hr",
    title: "Company / HR",
    desc: "Register your company first. Post jobs only after CareerVerse approves your recruiter account.",
    icon: Briefcase,
    cta: "Register as company HR",
  },
] as const;

export default function RegisterHubPage() {
  return (
    <div className="cv-auth-shell cv-auth-shell--hub">
      <div className="cv-auth-form-pane">
        <div className="cv-auth-form-inner cv-auth-form-inner--wide">
          <Link href="/" className="cv-auth-brand">
            <span className="cv-auth-brand-mark">CV</span>
            CareerVerse AI
          </Link>
          <h1>Choose how you join</h1>
          <p className="cv-auth-lead">
            Separate registration for students, mentors, and companies — so each path stays honest and
            production-safe.
          </p>

          <ul className="cv-reg-tracks">
            {tracks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="cv-reg-track">
                  <span className="cv-reg-track-icon" aria-hidden>
                    <t.icon size={22} />
                  </span>
                  <span className="cv-reg-track-body">
                    <strong>{t.title}</strong>
                    <span>{t.desc}</span>
                    <em>{t.cta}</em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="cv-auth-foot">
            Already have an Account? <Link href="/auth/signin">Sign In</Link>
          </p>
        </div>
      </div>

      <aside className="cv-auth-panel" aria-label="Why separate forms">
        <h2>Registration before access</h2>
        <p className="cv-auth-panel-copy">
          Students get career onboarding. Mentors and company HR submit a real profile — posting and
          mentoring unlock only after admin approval.
        </p>
      </aside>
    </div>
  );
}
