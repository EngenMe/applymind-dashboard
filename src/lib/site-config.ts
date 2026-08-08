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
   * The multi-user deployment, once it exists. Null until then; the button
   * says so rather than pretending.
   */
  liveAppUrl: null as string | null,

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
