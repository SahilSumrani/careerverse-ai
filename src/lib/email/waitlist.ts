let warnedMissingKey = false;

async function sendEmail({
  to,
  subject,
  text,
  kind,
}: {
  to: string;
  subject: string;
  text: string;
  kind: "waitlist" | "approval";
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.error("RESEND_API_KEY is missing; transactional emails are disabled.");
    }
    return false;
  }

  try {
    // ponytail: five seconds keeps email observable without blocking successful signup indefinitely.
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "CareerVerse <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.error(`Resend ${kind} email failed`, {
        status: response.status,
        body: await response.text(),
        to,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Resend ${kind} email request failed`, { error, to });
    return false;
  }
}

export async function sendWaitlistEmail({ to, name }: { to: string; name: string }) {
  return sendEmail({
    to,
    subject: "You're on the CareerVerse waitlist",
    text: `Hi ${name},\n\nYou've been added to the CareerVerse waitlist. We'll let you know as soon as your registration is approved.\n\nBest,\nThe CareerVerse Team`,
    kind: "waitlist",
  });
}

export async function sendApprovalEmail({
  to,
  name,
  role,
}: {
  to: string;
  name: string;
  role: "mentor" | "recruiter";
}) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "https://careerverse-ai-gold.vercel.app";
  const approval = role === "mentor" ? "Your mentor profile has been approved." : "Your recruiter account has been approved.";

  return sendEmail({
    to,
    subject: "Your CareerVerse account is approved",
    text: `Hi ${name},\n\n${approval} You can now sign in to CareerVerse at ${appUrl}.\n\nBest,\nThe CareerVerse Team`,
    kind: "approval",
  });
}
