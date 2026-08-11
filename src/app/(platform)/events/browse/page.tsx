import { PageHeader, EmptyState } from "@/components/ui/states";

export const metadata = {
  title: "Browse events",
  description: "Career events, workshops, and meetups on CareerVerse.",
};

export default async function EventsPage() {
  return (
    <div>
      <PageHeader
        title="Browse events"
        description="Workshops, career panels, and community meetups."
      />
      <EmptyState
        title="Events coming soon"
        description="Event listings will move to Firestore next. Auth, onboarding, and dashboard already use Firestore."
      />
    </div>
  );
}
