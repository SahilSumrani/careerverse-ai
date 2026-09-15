"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { getResumeStorageKey } from "@/app/(app)/create-resume/lib/resume-utils";

export function useResumeStorageKey(): string {
  const { data: session } = useSession();
  return useMemo(() => getResumeStorageKey(session?.user?.id), [session?.user?.id]);
}
