# UX & Performance Findings
Date: 2026-04-05

## UX Findings
| Area | Finding | Impact | Priority | Recommendation |
|---|---|---|---|---|
| Report access | Report entry points are split between report hub and module registers | Navigation confusion, extra clicks | P1 | Promote hub as canonical index + add deep links from modules |
| Admin dependency | Several report paths are admin-context only (permission-heavy) | Role access friction | P1 | Add role-appropriate report navigation and permission bundles |
| Filter consistency | Filter UX is being standardized but report pages still mixed in behavior across modules | Usability inconsistency | P2 | Enforce one `FilterToolbar` contract with Apply/Reset on all report pages |
| Heading clutter | Some pages retain redundant section titles/wrappers | Reduced data density | P2 | Continue minimalist cleanup (single shell + compact filters + data-first tables) |
| Drilldown clarity | Some report families do not have clear summary -> detail -> source drill chain | Auditability friction | P1 | Add explicit action column/link chips for source tracing |

## Performance Findings
| Check | Result | Status | Note |
|---|---|---|---|
| Ledger volume baseline | 131,582 journal entries / 263,164 journal lines | ⚠️ | Moderate-high data size |
| First-load/report SLA benchmark | Not fully executed | ⚠️ | Need scripted browser/API timings |
| Export SLA benchmark | Not fully executed | ⚠️ | Need timed export batch on seeded high-volume data |
| Pagination support | Present in key accounting views | ✅ | Helps large data handling |

## Constraints Observed
- Staging transactional depth for procurement/inventory is too low for meaningful performance stress on those report families.
- Accurate timing audit requires repeatable harness (e.g., scripted API timing with fixed filters and dataset).

## Suggested Performance Test Harness (next pass)
1. Define SLA targets: first load <= 2.5s, filtered <= 2s, CSV <= 5s, PDF <= 8s.
2. Seed 12-month volume for AP/AR/procurement/inventory.
3. Measure p50/p95 on top 15 CFO reports.
4. Add slow-query log and index recommendations per failing report.
