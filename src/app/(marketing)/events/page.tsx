import type { Metadata } from "next";
import { EventsDiscover } from "@/components/landing/events-discover";

export const metadata: Metadata = {
  title: "Events | CareerVerse AI",
  description: "Discover CareerVerse demos, workshops, and recruiter office hours.",
};

export default function EventsMarketingPage() {
  return <EventsDiscover />;
}
