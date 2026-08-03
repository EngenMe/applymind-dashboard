"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

/**
 * Opens the walkthrough in a modal rather than sending someone off to YouTube:
 * the point of the landing page is that they carry on reading it afterwards.
 *
 * With no video configured yet, this renders as a plainly disabled control
 * rather than a link to nowhere.
 */
export function DemoVideoButton() {
  const [open, setOpen] = useState(false);
  const videoUrl = siteConfig.demoVideoUrl;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    // Stop the page behind the overlay from scrolling with it.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!videoUrl) {
    return (
      <Button variant="outline" disabled title="A recorded walkthrough is coming soon">
        <Play aria-hidden />
        Walkthrough coming soon
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Play aria-hidden />
        Watch the walkthrough
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product walkthrough"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            /* The backdrop closes on click; the video itself must not. */
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close walkthrough"
              className="absolute -top-10 right-0 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
            >
              Close
              <X className="size-4" aria-hidden />
            </button>

            <div className="aspect-video w-full overflow-hidden rounded-card bg-black">
              <iframe
                src={videoUrl}
                title="ApplyMind walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
