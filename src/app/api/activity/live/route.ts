import { jsonOk } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export type LiveActivityItem = {
  id: string;
  name: string;
  role: string;
  stage: string;
  company?: string | null;
  at: string;
  source: "firestore";
};

async function fromFirestore(limit: number): Promise<LiveActivityItem[]> {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    const snap = await getAdminDb().collection("applications").orderBy("updatedAt", "desc").limit(limit).get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => {
        const data = d.data();
        if (data.isDemo || d.id.startsWith("demo-app-")) return null;
        const opp = (data.opportunity || {}) as {
          title?: string;
          organizationName?: string | null;
          isDemo?: boolean;
        };
        if (opp.isDemo) return null;
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
      })
      .filter(Boolean) as LiveActivityItem[];
  } catch {
    return [];
  }
}

export async function GET() {
  const items = await fromFirestore(16);
  return jsonOk({ items, demo: false, source: "firestore" });
}
