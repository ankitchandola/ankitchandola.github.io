# Purifier Rental Manager: portfolio evidence review

Reviewed 6 November 2026 against source revision `fa65282`. This record contains
sanitised implementation findings, not customer records or business outcomes.
Project copy lives in `src/content/projects.json`.

## Owner-provided context

Built for a friend’s water-purifier rental business. About one week of
implementation, with additional time spent gathering requirements. The app is
deployed on Render with Neon PostgreSQL; AWS setup is in progress. The friend
has not started using it for the business. Team size and sole ownership have
not been confirmed, so neither is claimed. Existing customer numbers are not
application adoption and are omitted.

## Verified implementation

The paths below refer to the inspected Purifier source checkout. They are
implementation references, not links to a public source repository.

| Portfolio claim                                                              | Source evidence                                                                                                   | Boundary                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| React/TypeScript frontend, Express API, separate worker and shared packages  | `apps/web/package.json`, `apps/api/src/app.ts`, `apps/worker/src/run-once.ts`, root `package.json`                | Implemented architecture; separate live worker scheduling is not established by Render web deployment.                  |
| Recurring billing fills missing periods without duplicate instalments        | `packages/billing/src/run.ts`, `packages/db/migrations/1762200000000_billing.sql`                                 | Customer transactions and installation/period uniqueness; no live billing-cycle result claimed.                         |
| A payment retry returns the original payment and receipt                     | `packages/billing/src/payments.ts`, `packages/billing/src/ledger.ts`                                              | Same request key required; this records received payments, not gateway processing.                                      |
| Integer-paise calculations and month-end dates that retain their nominal day | `packages/core/src/money.ts`, `packages/core/src/calendar.ts`                                                     | INR business rules; no general multi-currency claim.                                                                    |
| Financial corrections preserve posted history                                | Billing migrations and `packages/billing/src/ledger.ts`                                                           | Immutable rows with reversals/adjustments; do not describe every application table as immutable.                        |
| Reviewed entry of paper-book opening balances                                | `packages/billing/src/cutover.ts`, `packages/core/src/cutover.ts`, `docs/m5-reporting.md`                         | Manual drafts, printable reference, atomic customer sign-off; owner acceptance and actual cutover pending.              |
| Job deduplication, retry backoff and recovery of stale claims                | `packages/db/src/jobs.ts`, `apps/worker/src/runner.ts`                                                            | Application jobs need deployed scheduling; no uptime or exactly-once infrastructure guarantee.                          |
| Uncertain reminders checked before resending                                 | `packages/reminders/src/providers.ts`, `packages/reminders/src/delivery.ts`, `packages/reminders/src/dispatch.ts` | Only a simulated outbox is connected. WhatsApp/SMS/email delivery is pending.                                           |
| Service due, scheduled and completed dates kept separate                     | `packages/operations/src/services.ts`, `docs/m4-operations.md`                                                    | App capability, not evidence of field service adoption.                                                                 |
| English, Hindi and Telugu interface/document support                         | `apps/web/src/i18n/`, `packages/billing/src/i18n.ts`, `packages/billing/src/pdf.ts`                               | Hindi/Telugu wording awaits native-speaker review; report headings are English.                                         |
| Documents retain issue-time snapshots                                        | `packages/billing/src/run.ts`, `packages/billing/src/payments.ts`, `packages/billing/src/pdf.ts`                  | Do not equate stored documents with completed production storage/restore setup.                                         |
| Screen/Excel/PDF reports share server calculations                           | `packages/reports/src/`, `apps/api/src/routes/reports.ts`, `docs/m5-reporting.md`                                 | Exports rerun queries and carry generation times; figures can change after the screen loads.                            |
| Owner/admin/staff access checked by API                                      | `apps/api/src/auth/session.ts`, API routes                                                                        | No independent security-audit claim.                                                                                    |
| Current hosting on Render with Neon                                          | Owner clarification, `render.yaml`, `docs/deployment.md` progress                                                 | Deployment reported by owner and repo records; AWS remains planned. No application credentials used during this review. |

## Existing test evidence

Inspected tests cover repeated payments, immutable financial entries, rate
changes, clamped month ends, retained document snapshots, partial payments,
reminder timeout reconciliation, stale printed check sheets, cutover catch-up,
report export totals and worker retries. Relevant files include
`apps/api/src/routes/{billing,cutover,reminders,reports}.test.ts`,
`apps/worker/src/runner.test.ts` and `packages/core/src/calendar.test.ts`.

These tests were read, not rerun as part of the portfolio change. Database tests
require a dedicated test database; their fixtures reset it. No production
records were accessed or changed. Test presence does not establish pilot acceptance.

## Public presentation

- Add the independent beta after the existing professional projects in the
  shared collection. Main, lite, local search, city Studio and previous/next
  navigation all read the same project data.
- Lead engineering challenges with payment retries, then billing dates/catch-up,
  paper-book sign-off and uncertain reminder delivery.
- Use original vector cover artwork. It explains rental dues, deposits,
  payments and service; it does not represent the shipped interface.
- Use a labelled browser-only payment-retry explanation with synthetic amounts.
  The original database implementation is described beside it, not executed.
- Omit the gallery until approved sanitised captures exist. Do not substitute
  mock screens and call them production evidence.
- Omit a public application link: this is an authenticated staff tool without
  a supplied public demo account. Do not expose staff credentials.
- State deployment as the current result. No adoption, saved time, revenue,
  collection improvement, production customer count or completed AWS claim.

## Next evidence to collect

Approved synthetic-data screenshots: Dues, a customer’s Billing view, payment
allocation, a receipt, service visits and paper-book check-sheet review. After
business use starts, record the owner’s actual feedback, changes made and the
first completed billing workflow. Confirm team/ownership wording before adding
“sole developer”. No missing item is replaced with an inferred result.

## Portfolio verification

The production build, generated-site checks, formatting, TypeScript and lint
checks passed. All 53 model tests and 18 targeted Chromium browser checks passed,
including payment retry/reset, shared navigation, search, non-WebGL fallback and
script-free reading. The new detail page passed automated WCAG A/AA scans at
320, 375, 768, 1024 and 1440 pixels in light and dark themes. Main/detail layouts
had no horizontal overflow at those sizes; desktop and phone captures were
visually inspected. These checks cover the portfolio, not the source app’s
production readiness. Safari, Firefox, physical-device and screen-reader
checks were not performed. This change has not been published.
