import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Password reset</CardTitle>
          <CardDescription>
            Email password reset is not enabled yet. If you signed in with Google, use Google sign-in. For email
            accounts, contact support or a platform admin to reset access.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5 text-sm">
          <Link href="/auth/signin" className="text-primary">
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
