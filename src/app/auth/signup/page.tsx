import { redirect } from "next/navigation";

/** Legacy URL — role-specific forms live under /auth/register. */
export default function SignUpRedirectPage() {
  redirect("/auth/register");
}
