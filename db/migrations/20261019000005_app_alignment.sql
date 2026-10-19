-- migrate:up
-- Schema the Phase-2 app fixes rely on (remediation steps 2.2-2.5, findings F-18..F-21).

-- F-18: normalise transactions to kind + category. The old label becomes the category.
-- (category was only added by 016, which the live project never ran.)
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category text;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.financial_transactions WHERE amount = 0) THEN
    RAISE EXCEPTION 'financial_transactions has zero-amount rows: fix or delete them first (see the report at the end of 04_schema_hardening.sql)';
  END IF;
END
$$;
-- One UPDATE so every touched row already satisfies financial_amount_positive (from 04).
-- The sign now lives in transaction_type, so amounts become positive.
UPDATE public.financial_transactions
   SET category = COALESCE(NULLIF(category, ''), transaction_type),
       transaction_type = CASE WHEN lower(transaction_type) IN ('expense', 'expenses') OR amount < 0
                               THEN 'expense' ELSE 'income' END,
       amount = abs(amount)
 WHERE transaction_type NOT IN ('income', 'expense') OR amount < 0;
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_transaction_type_check;
ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transaction_type_check CHECK (transaction_type IN ('income', 'expense'));
ALTER TABLE public.financial_transactions VALIDATE CONSTRAINT financial_amount_positive;

-- F-19: events belong to a ministry through a real foreign key.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_ministry_id ON public.events (ministry_id);

-- F-20 (interim): registered members who have no login still need an id, and must not
-- be forced to exist in auth.users (legacy 010 dropped this FK on the live project;
-- fresh projects skip 010). Long-term fix is the people/users split in guide Step 3.1,
-- which restores the FK for login accounts only.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- F-21: per-event attendance on the table that actually exists.
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON public.attendance_records (event_id);

-- migrate:down
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_transaction_type_check;
-- this migration validated financial_amount_positive (added NOT VALID by 20261019000004); put it back as it was
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_amount_positive;
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_amount_positive CHECK (amount > 0) NOT VALID;
DROP INDEX IF EXISTS public.idx_attendance_records_event_id;
ALTER TABLE public.attendance_records DROP COLUMN IF EXISTS event_id;
DROP INDEX IF EXISTS public.idx_events_ministry_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS ministry_id;
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- Restore profiles.id -> auth.users. Added NOT VALID first so members registered without a login
-- don't block the rollback; validated when every profile has a matching auth user.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
    BEGIN
      ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_id_fkey;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE NOTICE 'profiles_id_fkey left NOT VALID: some profiles have no auth user';
    END;
  END IF;
END
$$;

-- Not reversed (data, not schema): transaction_type normalisation, positive amounts, category backfill.
