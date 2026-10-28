-- Demo isolation: scope templates per demo session, matching quotes.demo_session_id.
-- Previously every demo visitor (and CI E2E runs) shared one demo user's templates.
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS demo_session_id text;
CREATE INDEX IF NOT EXISTS templates_demo_session_idx ON public.templates (demo_session_id);
