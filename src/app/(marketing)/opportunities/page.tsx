import { redirect } from "next/navigation";

/** Marketing opportunities page removed — Jobs + Internships cover discovery. */
export default function OpportunitiesMarketingRedirect() {
  redirect("/jobs");
}
