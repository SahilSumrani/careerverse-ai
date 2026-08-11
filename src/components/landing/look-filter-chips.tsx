"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EMPTY_FILTERS,
  listingFilterHref,
  type ListingKind,
} from "@/data/listing-filters";

type Props = {
  chips: readonly string[];
  basePath: "/jobs" | "/internships";
  ariaLabel: string;
};

function chipHref(basePath: Props["basePath"], chip: string) {
  const kind: ListingKind = basePath === "/internships" ? "internships" : "jobs";
  if (chip === "Work from home") {
    return listingFilterHref(kind, { ...EMPTY_FILTERS, wfh: true });
  }
  if (chip === "Part-time") {
    return listingFilterHref(kind, { ...EMPTY_FILTERS, partTime: true });
  }
  if (chip === "Big brands") {
    return listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Engineering" });
  }
  return listingFilterHref(kind, { ...EMPTY_FILTERS, category: chip });
}

export function LookFilterChips({ chips, basePath, ariaLabel }: Props) {
  const [active, setActive] = useState(chips[0] ?? "");

  return (
    <div className="cv-look-filters" aria-label={ariaLabel} role="list">
      {chips.map((chip) => {
        const selected = chip === active;
        return (
          <Link
            key={chip}
            href={chipHref(basePath, chip)}
            role="listitem"
            className={`cv-look-filter${selected ? " is-active" : ""}`}
            aria-current={selected ? "true" : undefined}
            onClick={() => setActive(chip)}
          >
            {chip}
          </Link>
        );
      })}
    </div>
  );
}
