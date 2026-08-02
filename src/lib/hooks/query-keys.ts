import type { ListApplicationsParams } from "@/lib/api/types";

/** One place to look when invalidating. */
export const queryKeys = {
  applications: ["applications"] as const,
  applicationList: (params: ListApplicationsParams) =>
    ["applications", "list", params] as const,
  application: (id: string) => ["applications", "detail", id] as const,
  cvs: ["cvs"] as const,
  sites: ["sites"] as const,
  coverLetter: (applicationId: string) => ["cover-letter", applicationId] as const,
};
