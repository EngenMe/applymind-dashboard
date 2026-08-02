import type { Application, UpdateApplicationBody } from "@/lib/api/types";

/**
 * PUT /applications/{id} replaces the whole captured-data block — there is no
 * PATCH for it — so every partial edit has to be merged onto what is currently
 * on screen before it is sent. Doing that in one place is what stops the job
 * description card from blanking the company name.
 *
 * applied_at is absent on purpose: applications.UpdateInput does not accept it,
 * so the date cannot be corrected from here.
 */
export function toUpdateBody(
  application: Application,
  patch: Partial<UpdateApplicationBody> = {},
): UpdateApplicationBody {
  return {
    company_name: application.company_name,
    job_title: application.job_title,
    job_description: application.job_description,
    job_url: application.job_url,
    site_id: application.site_id,
    cv_version_id: application.cv_version_id,
    ...patch,
  };
}
