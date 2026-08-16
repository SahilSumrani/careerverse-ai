import { jsonOk } from "@/lib/api";

export async function GET() {
  return jsonOk({ items: [], demo: false, source: "private" });
}
