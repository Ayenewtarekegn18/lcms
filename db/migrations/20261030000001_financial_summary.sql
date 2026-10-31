-- migrate:up
-- Ledger totals and report figures computed in the database (remediation steps 2.2.3 and 2.5.2,
-- findings F-18, F-28, F-30). The pages used to add up the latest 50 rows in the browser, and the
-- reports page showed invented numbers.
--   financial_summary  totals per month, kind (income/expense) and category. Runs as the caller
--                      (security_invoker), so the ledger's row-level security applies, and returns
--                      rows only to the roles that read the ledger (FINANCE_READ in lib/auth/roles.ts).
--                      A member therefore sees no totals, not even of their own giving.
--   report_summary()   counts for the reports page (PAGE_ACCESS.reports): people on record, active
--                      members, ministries, upcoming events, attendance records. SECURITY DEFINER so
--                      finance users get the attendance count without reading attendance rows; it
--                      returns numbers only, never personal data, and refuses every other role.

CREATE VIEW public.financial_summary WITH (security_invoker = on) AS
SELECT date_trunc('month', t.transaction_date::timestamp)::date AS month,
       t.transaction_type,
       t.category,
       sum(t.amount) AS total,
       count(*) AS transaction_count
  FROM public.financial_transactions t
 WHERE (SELECT public.has_role('admin', 'elder', 'finance'))
 GROUP BY 1, 2, 3;
REVOKE ALL ON public.financial_summary FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.financial_summary TO authenticated;

-- Active member: the profile is active and, if the person is in the registry, the registry says so too.
-- Upcoming event: not finished yet (multi-day events count until their end) and not cancelled.
CREATE FUNCTION public.report_summary()
RETURNS TABLE (
  members_total bigint,
  members_active bigint,
  ministries_active bigint,
  events_upcoming bigint,
  attendance_total bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- keep in step with PAGE_ACCESS.reports in lib/auth/roles.ts
  IF NOT public.has_role('admin', 'elder', 'ministry_leader', 'finance') THEN
    RAISE EXCEPTION 'only staff and finance can read the reports' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT
    (SELECT count(*) FROM public.profiles p),
    (SELECT count(*) FROM public.profiles p
      WHERE p.is_active IS NOT FALSE
        AND NOT EXISTS (SELECT 1 FROM public.member_details d
                         WHERE d.member_id = p.id AND d.membership_status <> 'active')),
    (SELECT count(*) FROM public.ministries m WHERE m.is_active IS NOT FALSE),
    (SELECT count(*) FROM public.events e
      WHERE e.is_active IS NOT FALSE AND coalesce(e.end_date, e.start_date) >= now()),
    (SELECT count(*) FROM public.attendance_records a);
END
$$;
REVOKE ALL ON FUNCTION public.report_summary() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.report_summary() TO authenticated;

-- migrate:down
DROP FUNCTION IF EXISTS public.report_summary();
DROP VIEW IF EXISTS public.financial_summary;
