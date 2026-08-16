/**
 * Everything the landing page links out to.
 *
 * Kept in one place so adding the demo video or the authenticated deployment
 * later is a one-line edit here, not a hunt through JSX. Anything left null
 * renders as a disabled "coming soon" control rather than a dead link.
 */
export const siteConfig = {
  /** The read-only demo — this same app, pointed at real data. */
  demoUrl: "/applications",

  /**
   * The multi-user deployment. Was null while phase 16 was unbuilt — the
   * button on the landing page said so rather than pretending it existed.
   * Points at /register specifically, not the bare domain: someone clicking
   * this from the showcase wants to actually get an account, not land on
   * whatever `/` resolves to for them.
   */
  liveAppUrl: "https://applymind.dev/register" as string | null,

  /**
   * An *embeddable* video URL, not a watch page:
   *   YouTube → https://www.youtube.com/embed/VIDEO_ID
   *   Loom    → https://www.loom.com/embed/VIDEO_ID
   * A normal youtube.com/watch?v=… link will be refused by the iframe.
   */
  demoVideoUrl: null as string | null,

  extensionUrl: "",

  repos: {
    dashboard: "https://github.com/EngenMe/applymind-dashboard",
    backend: "https://github.com/EngenMe/applymind-backend",
    extension: "https://github.com/EngenMe/applymind-extension",
  },
} as const;