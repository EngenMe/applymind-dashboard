"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/applications", label: "Applications" },
  { href: "/cvs", label: "CVs" },
  { href: "/cover-letters", label: "Cover letters" },
  { href: "/settings", label: "Settings" },
];

/**
 * The three things the ledger holds, plus what configures them. No account or
 * sign-out link — the MVP has one user and no login.
 *
 * Four links do not fit on a narrow phone, and wrapping them into two ragged
 * rows reads worse than letting them scroll. The negative margin lets that
 * scroll run to the true edge of the viewport rather than stopping short at the
 * container's padding, which is what makes it look deliberate rather than
 * clipped.
 */
export function MainNav() {
  const pathname = usePathname() ?? "";

  return (
      <nav
          aria-label="Sections"
          className="no-scrollbar -mx-4 flex items-center gap-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0"
      >
        {SECTIONS.map((section) => {
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
              <Link
                  key={section.href}
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                      "shrink-0 py-0.5 text-sm whitespace-nowrap text-ink-muted hover:text-ink",
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