let warnedMissingKey = false;

export async function sendWaitlistEmail({ to, name }: { to: string; name: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.error("RESEND_API_KEY is missing; waitlist emails are disabled.");
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
        subject: "You're on the CareerVerse waitlist",
        text: `Hi ${name},\n\nYou've been added to the CareerVerse waitlist. We'll let you know as soon as your registration is approved.\n\nBest,\nThe CareerVerse Team`,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.error("Resend waitlist email failed", {
        status: response.status,
        body: await response.text(),
        to,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend waitlist email request failed", { error, to });
    return false;
  }
}
