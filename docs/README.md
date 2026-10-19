# Documentation

| Document | Read it when you want to… |
|---|---|
| [SETUP.md](SETUP.md) | run the app, configure `.env.local`, build a Supabase project, run the tests, set up CI/CD and the keep-warm ping, deploy |
| [STATUS.md](STATUS.md) | know what actually works today |
| [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md) | fix the project, step by step, with the code and SQL included |
| [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md) | understand the risks, root causes and target design (findings F-01…F-41) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | learn how the system is built (structure, data flow, auth, storage) |
| [ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md) | see who can see and do what, and grant a role |
| [DEMO_SETUP.md](DEMO_SETUP.md) | create demo accounts on a dev/staging project |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | fix a specific error message |
| [PRD.md](PRD.md) | read the original product requirements |
| [MEMBER_REGISTRATION_FORM_STRUCTURE.md](MEMBER_REGISTRATION_FORM_STRUCTURE.md) | see the registration form (the lebu-form register), where its data goes, and import existing records |
| [../db/](../db/) | find the migrations (`db/migrations`, dbmate up/down), one-off scripts (`db/scripts`) and database tests (`db/tests`) |
| [../e2e/](../e2e/), [../tests/](../tests/) | find the Playwright tests with their Docker test stack, and the unit tests |

`GET_SUPABASE_CREDENTIALS.md`, if present, is a local-only file (git-ignored); SETUP.md §2 covers the same ground.
