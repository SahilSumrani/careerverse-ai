import { jsonOk } from "@/lib/api";
import { DUMMY_JOBS } from "@/data/jobs";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export type LiveActivityItem = {
  id: string;
  name: string;
  role: string;
  stage: string;
  company?: string | null;
  at: string;
  source: "firestore" | "demo";
};

const DEMO_NAMES = [
  "Aisha",
  "Rohan",
  "Meera",
  "Kabir",
  "Ananya",
  "Dev",
  "Priya",
  "Arjun",
  "Sara",
  "Ishaan",
  "Nisha",
  "Vikram",
];

const STAGES = ["Applied", "Screening", "Interview", "Offer"] as const;

function demoFeed(limit = 12): LiveActivityItem[] {
  const now = Date.now();
  return Array.from({ length: limit }, (_, i) => {
    const job = DUMMY_JOBS[i % DUMMY_JOBS.length];
    return {
      id: `demo-live-${i}`,
      name: DEMO_NAMES[i % DEMO_NAMES.length],
      role: job.title,
      stage: STAGES[i % STAGES.length],
      company: job.company,
      at: new Date(now - i * 47_000).toISOString(),
      source: "demo" as const,
    };
  });
}

async function fromFirestore(limit: number): Promise<LiveActivityItem[] | null> {
  if (!hasFirebaseAdminCredentials()) return null;
  try {
    const snap = await getAdminDb().collection("applications").orderBy("updatedAt", "desc").limit(limit).get();
    if (snap.empty) return [];
    return snap.docs.map((d) => {
      const data = d.data();
      const opp = (data.opportunity || {}) as {
        title?: string;
        organizationName?: string | null;
      };
      const status = String(data.status || "APPLIED").toUpperCase();
      const stageMap: Record<string, string> = {
        SAVED: "Applied",
        PREPARING: "Applied",
        APPLIED: "Applied",
        ASSESSMENT: "Screening",
        INTERVIEW: "Interview",
        OFFER: "Offer",
        REJECTED: "Screening",
        WITHDRAWN: "Applied",
      };
      const rawName =
        (data.candidateName as string) ||
        (data.userName as string) ||
        (data.displayName as string) ||
        "Candidate";
      return {
        id: d.id,
        name: String(rawName).split(" ")[0] || "Candidate",
        role: opp.title || (data.title as string) || "Open role",
        stage: stageMap[status] || "Applied",
        company: opp.organizationName || null,
        at: (data.updatedAt as string) || new Date().toISOString(),
        source: "firestore" as const,
      };
    });
  } catch {
    return null;
  }
}

export async function GET() {
  const fromFs = await fromFirestore(16);
  if (fromFs && fromFs.length > 0) {
    return jsonOk({ items: fromFs, demo: false, source: "firestore" });
  }
  return jsonOk({ items: demoFeed(12), demo: true, source: "demo" });
}
