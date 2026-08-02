"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/applications", label: "Applications" },
  { href: "/cvs", label: "CVs" },
  { href: "/cover-letters", label: "Cover letters" },
];

/** The three things the ledger holds. Added here so the new pages are reachable. */
export function MainNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Sections" className="flex items-center gap-4">
      {SECTIONS.map((section) => {
        const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm text-ink-muted hover:text-ink",
              active && "text-ink underline decoration-rule-strong underline-offset-[0.4rem]",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
