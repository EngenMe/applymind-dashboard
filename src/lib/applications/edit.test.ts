import { describe, expect, it } from "vitest";
import type { Application } from "@/lib/api/types";
import { toUpdateBody } from "./edit";

const application: Application = {
  id: "app-1",
  company_name: "Acme",
  job_title: "Backend Engineer",
  job_description: "Go, Postgres, AWS.",
  job_url: "https://careers.acme.com/1",
  site_id: "site-1",
  cv_version_id: "cv-version-1",
  status: "Applied",
  ai_score: 7.5,
  ai_score_explanation: "Strong Go match.",
  applied_at: "2026-07-01T09:00:00Z",
  created_at: "2026-07-01T09:00:00Z",
  updated_at: "2026-07-02T09:00:00Z",
};

describe("toUpdateBody", () => {
  it("sends the whole captured block when nothing is patched", () => {
    expect(toUpdateBody(application)).toEqual({
      company_name: "Acme",
      job_title: "Backend Engineer",
      job_description: "Go, Postgres, AWS.",
      job_url: "https://careers.acme.com/1",
      site_id: "site-1",
      cv_version_id: "cv-version-1",
    });
  });

  it("carries every other field through when one is patched", () => {
    const body = toUpdateBody(application, { job_description: "Rewritten." });

    expect(body.job_description).toBe("Rewritten.");
    expect(body.company_name).toBe("Acme");
    expect(body.job_title).toBe("Backend Engineer");
    expect(body.job_url).toBe("https://careers.acme.com/1");
    expect(body.site_id).toBe("site-1");
    expect(body.cv_version_id).toBe("cv-version-1");
  });

  it("applies several patched fields at once", () => {
    const body = toUpdateBody(application, {
      company_name: "Acme Ltd",
      site_id: "site-2",
    });

    expect(body.company_name).toBe("Acme Ltd");
    expect(body.site_id).toBe("site-2");
    expect(body.job_title).toBe("Backend Engineer");
  });

  it("keeps an explicit null, so a CV can be detached", () => {
    expect(toUpdateBody(application, { cv_version_id: null }).cv_version_id).toBeNull();
  });

  it("carries a null cv_version_id through untouched", () => {
    const withoutCV = { ...application, cv_version_id: null };
    expect(toUpdateBody(withoutCV).cv_version_id).toBeNull();
  });

  it("never sends applied_at — the endpoint does not accept it", () => {
    expect(toUpdateBody(application)).not.toHaveProperty("applied_at");
  });

  it("never sends status, which moves through its own endpoint", () => {
    expect(toUpdateBody(application)).not.toHaveProperty("status");
  });

  it("never sends the ai score, which the backend owns", () => {
    const body = toUpdateBody(application);
    expect(body).not.toHaveProperty("ai_score");
    expect(body).not.toHaveProperty("ai_score_explanation");
  });

  it("does not mutate the application it was given", () => {
    toUpdateBody(application, { company_name: "Changed" });
    expect(application.company_name).toBe("Acme");
  });
});
