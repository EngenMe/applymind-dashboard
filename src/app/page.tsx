import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Chrome,
  FileText,
  Github,
  History,
  Lock,
  Search,
  Sparkles,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoVideoButton } from "@/components/landing/demo-video-button";
import { LedgerPreview } from "@/components/landing/ledger-preview";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "ApplyMind — every application, and exactly what was sent",
  description:
      "A job application tracker that records which CV version and cover letter went to every company, and where each application stands.",
};

const FEATURES = [
  {
    icon: Table2,
    title: "One ledger for everything",
    body: "Every application in a single filterable list — by status, site, CV version or date. No spreadsheet that goes stale by week three.",
  },
  {
    icon: FileText,
    title: "Know what you actually sent",
    body: "Each application keeps the exact CV version and cover letter that went with it, so a callback six weeks later is never a guess.",
  },
  {
    icon: History,
    title: "An audit trail you get for free",
    body: "Every status change is timestamped and annotated as you make it, building a history of each application without extra work.",
  },
  {
    icon: Search,
    title: "Never apply twice",
    body: "A unique constraint on site and job URL means the same posting cannot quietly enter the ledger a second time.",
  },
  {
    icon: Sparkles,
    title: "AI match scoring",
    body: "Each job is scored against your profile summary at save time. Best-effort by design — a failed model call never blocks the save.",
  },
  {
    icon: Lock,
    title: "The API key never reaches the browser",
    body: "All requests route through a server-side proxy that attaches credentials, so nothing sensitive ships to the client.",
  },
];

const STACK = [
  "Next.js 15",
  "TypeScript",
  "Tailwind v4",
  "TanStack Query",
  "Go",
  "AWS Lambda",
  "API Gateway",
  "PostgreSQL",
  "S3",
  "CDK",
  "WXT",
  "Vitest",
];

export default function LandingPage() {
  return (
      <div className="flex flex-col gap-16 py-8 sm:gap-24 sm:py-12">
        {/* ------------------------------------------------------------------ */}
        {/* Hero                                                                */}
        {/* ------------------------------------------------------------------ */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <span className="eyebrow">Job application tracker</span>

            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Every application, and exactly what was sent.
            </h1>

            <p className="max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
              A recruiter calls about a role you applied to seven weeks ago. Which CV did they
              get? Was there a cover letter? Did you already interview somewhere else in the
              same company? ApplyMind answers all three in one screen — a browser extension
              captures each application as you submit it, and this dashboard is where it all
              lands.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild>
                <Link href={siteConfig.demoUrl} rel="noopener noreferrer">
                  Open the live demo
                  <ArrowRight aria-hidden />
                </Link>
              </Button>

              <DemoVideoButton />

              {siteConfig.extensionUrl ? (
                  <Button variant="outline" asChild>
                    <a href={siteConfig.extensionUrl} target="_blank" rel="noopener noreferrer">
                      <Chrome aria-hidden />
                      Get the extension
                    </a>
                  </Button>
              ) : (
                  <Button variant="outline" disabled title="In review on the Chrome Web Store">
                    <Chrome aria-hidden />
                    Extension — in review
                  </Button>
              )}

              {siteConfig.liveAppUrl ? (
                  <Button variant="outline" asChild>
                    <a href={siteConfig.liveAppUrl} target="_blank" rel="noopener noreferrer">
                      Sign up
                    </a>
                  </Button>
              ) : (
                  <Button variant="outline" disabled title="Waiting on multi-user authentication">
                    Sign-up — coming soon
                  </Button>
              )}
            </div>

            <p className="text-xs text-ink-faint">
              The demo is the real application, running on real data, with no login — a
              multi-user version lands once authentication does.
            </p>
          </div>

          <LedgerPreview />
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Source — deliberately high on the page. Anyone evaluating this is    */}
        {/* here to read code, and making them scroll past six feature cards to  */}
        {/* find it serves nobody.                                               */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Source</span>
              <h2 className="text-xl font-semibold tracking-tight">
                All three repositories are public
              </h2>
            </div>

            <a
                href={siteConfig.repos.dashboard.replace(/\/[^/]+$/, "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <Github className="size-4" aria-hidden />
              View on GitHub
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RepoCard
                href={siteConfig.repos.extension}
                name="applymind-extension"
                description="The browser extension. WXT, React 19, TypeScript — captures the application on LinkedIn and follows it to the employer's own site."
            />
            <RepoCard
                href={siteConfig.repos.dashboard}
                name="applymind-dashboard"
                description="This app. Next.js 15, TypeScript, Tailwind v4, TanStack Query, tested with Vitest."
            />
            <RepoCard
                href={siteConfig.repos.backend}
                name="applymind-backend"
                description="Go on AWS Lambda. Chi, sqlc, PostgreSQL, S3, and the CDK stack that deploys it."
            />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Features                                                            */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">What it does</span>
            <h2 className="text-xl font-semibold tracking-tight">
              Built for the question you actually ask
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-2">
                  <feature.icon className="size-4 text-ink-faint" aria-hidden />
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{feature.body}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* The extension                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">The capture side</span>
            <h2 className="text-xl font-semibold tracking-tight">
              The dashboard is half of it. The extension is the other half.
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-muted">
              <p>
                Nothing here has to be typed in. Click Apply on LinkedIn and a sidebar opens
                with the company, title, description and URL already filled in, then records
                the CV file you actually attach and the cover letter you actually write.
              </p>
              <p>
                Many postings hand you off to the employer&apos;s own form — Greenhouse, Lever,
                Workday, an in-house careers page. The extension follows across the redirect
                via a tab-scoped handoff record, keeps capturing on the new domain, and
                finishes the application there.
              </p>
              <p>
                The sidebar runs inside an iframe rather than injected into the page, because
                LinkedIn&apos;s apply modal implements a focus trap that steals focus from
                anything rendered alongside it. Its own browsing context is the only place
                typing works reliably.
              </p>
              <p>
                Install it and it runs in demo mode with sample data, entirely in the browser
                and with no account — which is also how it stays honest about a single-user
                backend.
              </p>
            </div>

            <div className="overflow-x-auto rounded-card border border-rule bg-surface p-5">
            <pre className="font-mono text-[0.75rem] leading-relaxed text-ink-muted">
{`  LinkedIn ──► sidebar (iframe)
      │              │
      │         postMessage
      │              │
      └──► background worker ──► API
                     │
              chrome.storage
              carries the handoff
                     │
                     ▼
        greenhouse.io / lever.co
        workday / careers page
              same sidebar,
              "Mark as complete"`}
            </pre>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Architecture                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">How it is built</span>
            <h2 className="text-xl font-semibold tracking-tight">
              A Go API on Lambda, a Next.js dashboard on Vercel
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <div className="overflow-x-auto rounded-card border border-rule bg-surface p-5">
            <pre className="font-mono text-[0.75rem] leading-relaxed text-ink-muted">
{`  extension ─┐
             ├─► API Gateway ──► Lambda (Go) ──► PostgreSQL
  dashboard ─┘                        │
   (Next.js)                          └────────► S3
       │
       └─ /api/backend/* proxy
          attaches the API key
          server-side, never
          in the browser`}
            </pre>
            </div>

            <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-muted">
              <p>
                Two Lambda functions share one Go codebase: a REST API behind API Gateway, and
                a scheduler that EventBridge invokes daily to send follow-up reminders. Both
                detect whether they are running under Lambda or locally, so the same binary
                serves both.
              </p>
              <p>
                Files live in S3 and are reached through presigned URLs. CVs are deduplicated
                by SHA-256, so re-uploading identical bytes records a reference rather than a
                second copy — which is what makes version history meaningful rather than noisy.
              </p>
              <p>
                Infrastructure is defined in CDK, including the ACM certificate and Route 53
                records for the API&apos;s custom domain, so the whole backend is one
                <code className="mx-1 font-mono text-[0.8125rem] text-ink">cdk deploy</code>
                from nothing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STACK.map((item) => (
                <span
                    key={item}
                    className="rounded-full border border-rule px-2.5 py-1 font-mono text-[0.6875rem] text-ink-muted"
                >
              {item}
            </span>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Footer                                                              */}
        {/* ------------------------------------------------------------------ */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
          <p className="text-sm text-ink-muted">
            Built by{" "}
            <a
                href="https://faroukhasnaoui.tech"
                className="text-ink hover:underline"
                target="_blank"
                rel="noopener noreferrer"
            >
              Farouk Hasnaoui
            </a>
          </p>
          <p className="eyebrow">MIT licensed</p>
        </footer>
      </div>
  );
}

function RepoCard({
                    href,
                    name,
                    description,
                  }: {
  href: string;
  name: string;
  description: string;
}) {
  return (
      <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-2 rounded-card border border-rule bg-surface p-5 transition-colors hover:bg-highlight"
      >
        <div className="flex items-center gap-2">
          <Github className="size-4 text-ink-faint" aria-hidden />
          <span className="font-mono text-sm">{name}</span>
          <ArrowRight
              className="size-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5"
              aria-hidden
          />
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
      </a>
  );
}