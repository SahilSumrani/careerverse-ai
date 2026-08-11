"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  chips: readonly string[];
  basePath: "/jobs" | "/internships";
  ariaLabel: string;
};

export function LookFilterChips({ chips, basePath, ariaLabel }: Props) {
  const [active, setActive] = useState(chips[0] ?? "");

  return (
    <div className="cv-look-filters" aria-label={ariaLabel} role="list">
      {chips.map((chip) => {
        const selected = chip === active;
        return (
          <Link
            key={chip}
            href={`${basePath}?q=${encodeURIComponent(chip)}`}
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
