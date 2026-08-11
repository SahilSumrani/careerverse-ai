import { jsonOk } from "@/lib/api";

/** TODO: migrate mentors to Firestore. */
export async function GET() {
  return jsonOk({ mentors: [] });
}
