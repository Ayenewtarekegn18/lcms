# Member Registration

The registration form at `/dashboard/members/register` follows the **lebu-form register** (the Google-Sheet site the church already uses for member records and ID cards): the same fields, Amharic/English labels, options, rules and member numbering. That way staff see the form they know, and lebu-form records import 1:1 with their existing numbers.

The definition lives in one place, [`lib/members/registration.ts`](../lib/members/registration.ts). It holds the sections, fields, options and validation schema, and the form, the API and the importer all use it.

## Sections and fields

`*` = required. "If …" fields appear only when the condition holds; hidden fields are cleared before saving.

| Section | Fields |
|---|---|
| **የግል መረጃ · Personal details** | ስም first name\*, የአባት ስም father's name\*, የአያት ስም grandfather's name, ጾታ sex\* (male/female), date of birth, marital status (single, married, widowed, divorced). *If married:* spouse's name (suggests existing members), spouse's age, spouse's phone. Number of children, and one row per child (name, sex, education, age; tally under 18 / 18 and over). Church members living with the family (name, relationship, age; up to 10). Blood group. |
| **አድራሻና ስልክ · Address & contact** | Mobile phone\*, alternate phone, email, sub-city (the 11 Addis Ababa sub-cities or "Other"), woreda, house no., area or landmark |
| **መንፈሳዊ መረጃ · Church & spiritual life** | Member since, baptized (yes/no). *If yes:* baptism date. Previous church, standing (member, deacon, elder, teacher, evangelist, pastor, board member), ministry departments (12, or "not currently serving", which excludes the others). *If not serving:* department they would like to join. Membership status (active/inactive, default active). |
| **ትምህርትና ሥራ · Education & work** | Education level, occupation, workplace |
| **የአደጋ ጊዜ ተጠሪ · Emergency contact** | Contact name, phone, relationship, notes |

Side panel: **photo** (choose a file or use the camera; cropped to a 4:5 portrait, as on the ID card) and the **member number** the next registration will get.

**Validation** (messages as in lebu-form): required fields must be filled ("This one is required."); phone numbers need at least 7 digits; email must look valid; birth and baptism dates can't be in the future ("Member since" may be). Dates also show the Ethiopian-calendar equivalent, for example `መስከረም 1, 2019 ዓ.ም.`.

## Where the data goes

| Data | Stored in |
|---|---|
| First name, father's name, sex, date of birth, phone, email | `profiles` (the identity the rest of the app uses) |
| Everything else, member number, photo path | `member_details` (one row per person, staff-only) |
| Member-number prefix (`LKH`), church name and address for cards | `church_settings` |
| Photo | private storage bucket `member-photos`, `<member_id>.jpg` |

`register_member()` (migration [`20261019000006_member_registry`](../db/migrations/20261019000006_member_registry.sql)) writes both rows in one transaction. Member numbers come from a database sequence (`LKH-0001`, `LKH-0002`, …), so two people registering at the same moment can never get the same number.

## Who can do what

| Action | Roles |
|---|---|
| Register a member, upload a photo | admin (`REGISTRARS` in `lib/auth/roles.ts`; widen it together with the `member_details` / `profiles` insert policies) |
| Read the registry | admin, elder, ministry_leader; members can read their own record |
| Audit | every change is logged with the fields that changed, not their values |

## Importing from lebu-form

[`scripts/import-lebu-form.mjs`](../scripts/import-lebu-form.mjs) copies the Google-Sheet register into Supabase, **keeping each member's number** so printed ID cards stay valid. It validates with the same schema as the form and is safe to re-run (it skips existing numbers).

```bash
# dry run first: validates every record and reports problems, writes nothing
node --env-file=.env.local scripts/import-lebu-form.mjs --endpoint --dry-run
# then for real (set ALLOW_MEMBER_IMPORT=true, LEBU_FORM_ENDPOINT, LEBU_FORM_PASSCODE in .env.local)
node --env-file=.env.local scripts/import-lebu-form.mjs --endpoint --photos
```

Instead of `--endpoint`, `--file members.json` reads a saved copy of the Apps Script `list` response. Records without a first name, father's name, sex or phone are reported and skipped. Optional values the form would never produce (for example "type O" typed into the blood-group column) are dropped from that record and reported.

## Not yet done (see the remediation plan)

- Editing an existing member's registry record (the members page edits profile fields only).
- Member self-registration and "My ID" card, and printable ID-card sheets (10 per A4), as lebu-form offers.
- Splitting people from login accounts (`members` vs `profiles`, remediation step 3.1).
