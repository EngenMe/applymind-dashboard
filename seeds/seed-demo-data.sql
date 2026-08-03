-- ============================================================================
-- ApplyMind — demo data reset (v2: 100 applications, every real site used)
--
-- Clears every application, CV, and cover letter, then generates 100 realistic
-- applications rotating through all 11 pre-configured sites. settings.profile
-- _summary is left untouched — that's your real elevator pitch, not fake data.
--
-- This is generative (a DO block + generate_series), not 100 hand-typed rows —
-- at this size that's the only sane way to keep it both correct and reviewable.
-- Re-running it gives identical output every time; nothing here is random.
--
-- Run via the Neon SQL editor (paste, run), or:
--   psql "$NEON_DATABASE_URL" -f seed-demo-data.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Clear existing application data, children first.
-- ----------------------------------------------------------------------------
DELETE FROM follow_up_reminders;
DELETE FROM recruiter_contacts;
DELETE FROM application_status_history;
DELETE FROM cover_letters;
DELETE FROM applications;
DELETE FROM cv_versions;
DELETE FROM cvs;

-- Remove any custom sites from previous runs — this script uses only the
-- pre-configured ones already in your database, all 11 of them.
DELETE FROM sites WHERE is_preconfigured = false;

-- ----------------------------------------------------------------------------
-- 2. CVs and CV versions — four CVs, ten versions total, so "which CV went
--    where" has real variety across 100 applications.
-- ----------------------------------------------------------------------------
INSERT INTO cvs (id, name, tag, created_at, updated_at) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Backend CV',    'backend',   now() - interval '120 days', now() - interval '10 days'),
  ('a1000000-0000-4000-8000-000000000002', 'Full Stack CV', 'fullstack', now() - interval '100 days', now() - interval '20 days'),
  ('a1000000-0000-4000-8000-000000000003', 'Platform CV',   'platform',  now() - interval '80 days',  now() - interval '15 days'),
  ('a1000000-0000-4000-8000-000000000004', 'Staff CV',      'staff',     now() - interval '30 days',  now() - interval '5 days');

INSERT INTO cv_versions (id, cv_id, sha256_hash, file_size_bytes, original_filename, s3_key, uploaded_at) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', repeat('a1', 32), 241664, 'Backend_CV_v1.pdf',   'cvs/demo/backend-cv-v1.pdf',   now() - interval '120 days'),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', repeat('a2', 32), 244992, 'Backend_CV_v2.pdf',   'cvs/demo/backend-cv-v2.pdf',   now() - interval '80 days'),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', repeat('a3', 32), 247808, 'Backend_CV_v3.pdf',   'cvs/demo/backend-cv-v3.pdf',   now() - interval '40 days'),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', repeat('a4', 32), 249856, 'Backend_CV_v4.pdf',   'cvs/demo/backend-cv-v4.pdf',   now() - interval '10 days'),
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', repeat('b1', 32), 255488, 'FullStack_CV_v1.pdf', 'cvs/demo/fullstack-cv-v1.pdf', now() - interval '100 days'),
  ('b2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', repeat('b2', 32), 258048, 'FullStack_CV_v2.pdf', 'cvs/demo/fullstack-cv-v2.pdf', now() - interval '20 days'),
  ('b3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', repeat('c1', 32), 252416, 'Platform_CV_v1.pdf',  'cvs/demo/platform-cv-v1.pdf',  now() - interval '80 days'),
  ('b3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', repeat('c2', 32), 253952, 'Platform_CV_v2.pdf',  'cvs/demo/platform-cv-v2.pdf',  now() - interval '15 days'),
  ('b4000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004', repeat('d1', 32), 260096, 'Staff_CV_v1.pdf',     'cvs/demo/staff-cv-v1.pdf',     now() - interval '30 days'),
  ('b4000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000004', repeat('d2', 32), 261632, 'Staff_CV_v2.pdf',     'cvs/demo/staff-cv-v2.pdf',     now() - interval '5 days');

-- ----------------------------------------------------------------------------
-- 3. Generate 100 applications, cycling through every site, ~50 companies,
--    12 role titles, and all 11 statuses evenly.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  companies text[] := ARRAY[
    'Stripe','Datadog','Monzo','Cloudflare','Vercel','Notion','Linear','Figma','GitHub','Shopify',
    'Airbnb','Revolut','Spotify','Duolingo','Netflix','Discord','Slack','Atlassian','GitLab','HashiCorp',
    'Snowflake','MongoDB','Elastic','Confluent','PagerDuty','Twilio','Segment','Amplitude','Plaid','Brex',
    'Ramp','Deel','Remote','Canva','Miro','Asana','Airtable','Retool','Supabase','PlanetScale',
    'Neon','Render','Railway','Fly.io','Clerk','Auth0','Okta','CrowdStrike','Snyk','Sentry','LaunchDarkly'
  ];
  titles text[] := ARRAY[
    'Backend Engineer','Platform Engineer','Software Engineer','Full Stack Engineer',
    'Infrastructure Engineer','Site Reliability Engineer','Systems Engineer','Go Engineer',
    'Senior Backend Engineer','Staff Engineer','Founding Engineer','DevOps Engineer'
  ];
  site_domains text[] := ARRAY[
    'linkedin.com','indeed.com','glassdoor.com','greenhouse.io','lever.co','wellfound.com',
    'hired.com','monster.com','myworkdayjobs.com','irishjobs.ie','jobs.ie'
  ];
  statuses text[] := ARRAY[
    'Saved','Applied','Acknowledged','In Review','Interview Scheduled',
    'Interviewing','Offer Received','Accepted','Rejected','Withdrawn','Ghost'
  ];
  description_templates text[] := ARRAY[
    '%s is hiring a %s to help build and scale core product infrastructure. Strong communication and collaboration skills expected.',
    'Join %s as a %s working across backend services that support a large and growing user base.',
    '%s is looking for an experienced %s to take ownership of key systems and mentor engineers on the team.',
    '%s''s engineering team is expanding and looking for a %s to help ship reliable, well-tested software at scale.'
  ];
  explanation_templates text[] := ARRAY[
    'Strong overall match against the stored profile summary.',
    'Good technical overlap; some domain-specific experience is limited.',
    'Solid general backend fit with the responsibilities described.',
    'Close match on the core technical requirements listed.',
    'Reasonable fit; the role leans slightly outside the primary area of experience.'
  ];
  terminal_notes text[] := ARRAY[
    'Went with a candidate with more directly relevant experience.',
    'Position was put on hold by the team.',
    'Accepted an offer elsewhere before this process finished.',
    'No response after the most recent interview.',
    'Verbal offer received, paperwork in progress.',
    'Signed. Starting next month.',
    'Great first conversation, moving to the next round.'
  ];

  version_ids uuid[];
  version_count int;

  company text;
  title text;
  site_domain text;
  site_id_var uuid;
  status_var text;
  path text[];
  path_len int;

  created_at_var timestamptz;
  applied_at_var timestamptz;
  updated_at_var timestamptz;
  step_interval interval;

  score numeric;
  explanation text;
  cv_version_id_var uuid;

  app_id uuid;
  job_url_var text;
  description_var text;

  j int;
  changed_at_var timestamptz;
  changed_by_var text;
  note_var text;
BEGIN
  SELECT array_agg(id ORDER BY uploaded_at), count(*) INTO version_ids, version_count FROM cv_versions;

  FOR i IN 1..100 LOOP
    company     := companies[1 + ((i - 1) % array_length(companies, 1))];
    title       := titles[1 + ((i - 1) % array_length(titles, 1))];
    site_domain := site_domains[1 + ((i - 1) % array_length(site_domains, 1))];
    status_var  := statuses[1 + ((i - 1) % array_length(statuses, 1))];

    SELECT id INTO site_id_var FROM sites WHERE domain = site_domain;

    path := CASE status_var
      WHEN 'Saved'                THEN ARRAY['Saved']
      WHEN 'Applied'               THEN ARRAY['Applied']
      WHEN 'Acknowledged'          THEN ARRAY['Applied','Acknowledged']
      WHEN 'In Review'             THEN ARRAY['Applied','Acknowledged','In Review']
      WHEN 'Interview Scheduled'   THEN ARRAY['Applied','Acknowledged','In Review','Interview Scheduled']
      WHEN 'Interviewing'          THEN ARRAY['Applied','Acknowledged','In Review','Interview Scheduled','Interviewing']
      WHEN 'Offer Received'        THEN ARRAY['Applied','Acknowledged','In Review','Interview Scheduled','Interviewing','Offer Received']
      WHEN 'Accepted'              THEN ARRAY['Applied','Acknowledged','In Review','Interview Scheduled','Interviewing','Offer Received','Accepted']
      WHEN 'Rejected'              THEN ARRAY['Applied','In Review','Rejected']
      WHEN 'Withdrawn'             THEN ARRAY['Applied','In Review','Interview Scheduled','Withdrawn']
      WHEN 'Ghost'                 THEN ARRAY['Applied','Interview Scheduled','Interviewing','Ghost']
    END;
    path_len := array_length(path, 1);

    IF status_var = 'Saved' THEN
      applied_at_var := NULL;
      created_at_var := now() - (interval '1 day' * ((i % 5) + 1));
      updated_at_var := created_at_var;
      cv_version_id_var := NULL;
      score := NULL;
      explanation := NULL;
    ELSE
      applied_at_var := now() - (interval '1 day' * (((i * 3) % 90) + 5));
      created_at_var := applied_at_var;
      updated_at_var := applied_at_var + (interval '1 day' * (path_len * 3));
      cv_version_id_var := version_ids[1 + ((i - 1) % version_count)];
      score := round((6.0 + (((i * 7) % 40) / 10.0))::numeric, 1);
      explanation := explanation_templates[1 + ((i - 1) % array_length(explanation_templates, 1))];
    END IF;

    app_id := gen_random_uuid();
    job_url_var := format('https://%s/jobs/%s', site_domain, 480000 + i);
    description_var := format(
      description_templates[1 + ((i - 1) % array_length(description_templates, 1))],
      company, title
    );

    INSERT INTO applications (
      id, company_name, job_title, job_description, job_url, site_id, cv_version_id,
      status, ai_score, ai_score_explanation, applied_at, created_at, updated_at
    ) VALUES (
      app_id, company, title, description_var, job_url_var, site_id_var, cv_version_id_var,
      status_var::application_status, score, explanation, applied_at_var, created_at_var, updated_at_var
    );

    step_interval := CASE WHEN path_len > 1 THEN (updated_at_var - created_at_var) / (path_len - 1) ELSE interval '0' END;

    FOR j IN 1..path_len LOOP
      changed_at_var := created_at_var + (step_interval * (j - 1));
      changed_by_var := CASE WHEN j = path_len AND path_len > 1 THEN 'user' ELSE 'system' END;
      note_var := CASE
        WHEN j = path_len AND path_len > 1
             AND status_var IN ('Interview Scheduled','Interviewing','Offer Received','Accepted','Rejected','Withdrawn','Ghost')
        THEN terminal_notes[1 + ((i - 1) % array_length(terminal_notes, 1))]
        ELSE NULL
      END;

      INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note, changed_at)
      VALUES (
        app_id,
        CASE WHEN j = 1 THEN NULL ELSE path[j - 1]::application_status END,
        path[j]::application_status,
        changed_by_var::status_change_source,
        note_var,
        changed_at_var
      );
    END LOOP;

    IF i % 3 = 0 AND status_var != 'Saved' THEN
      INSERT INTO cover_letters (id, application_id, kind, body_text, created_at, updated_at)
      VALUES (
        gen_random_uuid(), app_id, 'text',
        format('I''m excited about the %s role at %s and would welcome the chance to talk through my background in more detail.', title, company),
        created_at_var, created_at_var
      );
    END IF;

    IF i % 4 = 0 AND status_var IN ('Applied','Acknowledged','In Review','Interview Scheduled','Interviewing') THEN
      INSERT INTO follow_up_reminders (application_id, due_at, sent_at, dismissed_at, created_at, updated_at)
      VALUES (
        app_id, now() + (interval '1 day' * ((i % 12) + 1)), NULL, NULL, created_at_var, created_at_var
      );
    END IF;

    IF i % 10 = 0 AND status_var IN ('Rejected','Withdrawn') THEN
      INSERT INTO follow_up_reminders (application_id, due_at, sent_at, dismissed_at, created_at, updated_at)
      VALUES (
        app_id, updated_at_var, updated_at_var, NULL, created_at_var, updated_at_var
      );
    END IF;

  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Verify
-- ============================================================================
-- SELECT status, count(*) FROM applications GROUP BY status ORDER BY status;
-- SELECT s.name, count(*) FROM applications a JOIN sites s ON s.id = a.site_id GROUP BY s.name ORDER BY count(*) DESC;
-- SELECT count(*) FROM cover_letters;
-- SELECT count(*) FROM follow_up_reminders;
