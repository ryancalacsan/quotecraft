-- Security: Enable RLS on all public tables
-- App uses a direct Postgres connection (Drizzle/postgres-js) which bypasses RLS,
-- so no policies are needed. Enabling RLS with no policies locks down PostgREST
-- (deny-all by default) while leaving application queries unaffected.
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

-- Security: Fix mutable search_path on trigger function
-- Prevents search_path injection attacks where an attacker-controlled schema
-- could shadow built-in functions called within the trigger.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
