/**
 * Wire types. These mirror the JSON tags on the Go handlers exactly — if a field
 * name here does not appear in a `json:"..."` tag over in the backend, it is a
 * bug here, not a gap there.
 */

// --- applications ----------------------------------------------------------

/** applications.Status — the application_status enum, in dashboard order. */
export const APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Acknowledged",
  "In Review",
  "Interview Scheduled",
  "Interviewing",
  "Offer Received",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "Ghost",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** applications.ChangeSource — who moved the application. */
export type ChangeSource = "user" | "system";

export interface StatusHistoryEntry {
  id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: ChangeSource;
  note: string | null;
  changed_at: string;
}

export interface Application {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  job_url: string;
  site_id: string;
  cv_version_id: string | null;
  status: ApplicationStatus;
  ai_score: number | null;
  ai_score_explanation: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  /** Present on GET /applications/{id}; omitted by the list endpoint. */
  status_history?: StatusHistoryEntry[];
}

export interface ListApplicationsResponse {
  applications: Application[];
}

/**
 * Query parameters accepted by GET /applications. All optional and combinable.
 * `q` searches company name or job title; `company` is an exact-ish company
 * filter; `from`/`to` bound the effective date (applied_at, else created_at).
 */
export interface ListApplicationsParams {
  status?: ApplicationStatus;
  site_id?: string;
  cv_version_id?: string;
  company?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/** Body of PUT /applications/{id}. Captured job data only — status is separate. */
export interface UpdateApplicationBody {
  company_name: string;
  job_title: string;
  job_description: string;
  job_url: string;
  site_id?: string | null;
  cv_version_id?: string | null;
}

/** Body of PATCH /applications/{id}/status. */
export interface UpdateStatusBody {
  status: ApplicationStatus;
  note?: string | null;
  changed_by?: ChangeSource;
}

// --- cvs -------------------------------------------------------------------

export interface CVVersion {
  id: string;
  cv_id: string;
  sha256_hash: string;
  file_size_bytes: number;
  original_filename: string;
  uploaded_at: string;
}

export interface CV {
  id: string;
  name: string;
  tag: string | null;
  created_at: string;
  updated_at: string;
  versions?: CVVersion[];
}

export interface ListCVsResponse {
  cvs: CV[];
}

/**
 * POST /cvs. `already_existed` is true when these exact bytes were already
 * stored under this CV, in which case nothing new was written and the version
 * returned is the one that was already there — the handler answers 200 rather
 * than 201 for that case.
 */
export interface UploadCVResponse {
  cv: CV;
  version: CVVersion;
  already_existed: boolean;
}

export interface DownloadLink {
  url: string;
  filename: string;
  expires_at: string;
}

// --- cover letters ---------------------------------------------------------

export type CoverLetterKind = "text" | "file";

export interface CoverLetter {
  id: string;
  application_id: string;
  kind: CoverLetterKind;
  body_text: string | null;
  original_filename: string | null;
  /** Only set for kind = "file". */
  download_path?: string;
  created_at: string;
  updated_at: string;
}

// --- sites -----------------------------------------------------------------

export interface Site {
  id: string;
  name: string;
  domain: string;
  is_preconfigured?: boolean;
  is_active?: boolean;
}

export interface ListSitesResponse {
  sites: Site[];
}

// --- errors ----------------------------------------------------------------

/** The `{"error": {"code", "message"}}` envelope every module returns. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
