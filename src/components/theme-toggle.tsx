"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * A two-state switch, not a light/dark/system menu. System preference still
 * drives the initial choice (see defaultTheme="system" in providers.tsx) — this
 * is only for the moment someone wants to override it for this session.
 *
 * The theme is unknown on the server and on the very first client render
 * (next-themes needs a mount to read localStorage/the media query), so this
 * renders a disabled placeholder until then rather than guessing — guessing
 * risks a flash of the wrong icon, which is exactly what suppressHydrationWarning
 * on <html> does not paper over for content inside the page.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled aria-label="Toggle theme">
        <Sun className="size-4" aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </Button>
  );
}
