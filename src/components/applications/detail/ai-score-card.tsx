import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/card";
import type { Application } from "@/lib/api/types";

/**
 * The GPT-4o-mini match score. Scoring is best-effort backend-side — it is
 * skipped or nulled whenever the model call fails — so an absent score is a
 * normal state, not an error, and the panel says so plainly.
 */
export function AIScoreCard({ application }: { application: Application }) {
  const score = application.ai_score;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Match score</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {score == null ? (
          <p className="text-sm text-ink-faint">
            Not scored. Scoring is skipped when it is switched off, when no profile summary is
            set, or when the model call failed at save time.
          </p>
        ) : (
          <div className="flex items-start gap-4">
            <p className="tabular shrink-0 font-mono text-2xl leading-none font-medium">
              {score.toFixed(1)}
              <span className="text-sm text-ink-faint">/10</span>
            </p>
            <p className="text-sm leading-relaxed text-ink-muted">
              {application.ai_score_explanation ?? "No explanation was returned."}
            </p>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
