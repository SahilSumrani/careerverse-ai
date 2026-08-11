import Link from "next/link";
import { EmptyState } from "@/components/ui/states";

export default async function EventDetailPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/events/browse" className="text-sm text-muted-foreground hover:text-foreground">
        ← Events
      </Link>
      <div className="mt-6">
        <EmptyState
          title="Event not available"
          description="Individual events will be stored in Firestore in a follow-up migration."
        />
      </div>
    </div>
  );
}
