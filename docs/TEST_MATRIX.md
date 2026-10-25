# Verification matrix

Results are evidence records, not self-assigned portal scores. Current-contract live transactions and historical-contract transactions are intentionally separated.

## Local and CI verification

| Area | Command or evidence | Result |
| --- | --- | --- |
| Python compilation | py -3.12 -m compileall -q contracts | Passed |
| Offline contract harness | py -3.12 -m pytest -q tests/test_contract_offline.py | 42 passed; includes assembler omission, incomplete completion, packet-specific exact-copy ordering, clean-reference concealment, informative anchors, forged decisions, refunds, replay and escrow isolation |
| GenLayer Direct Mode | py -3.12 -m pytest -q tests/direct/ | 18 passed against genlayer-test 0.29.2 and pinned GenVM v0.2.16 |
| Combined Python suite | py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/ | 60 passed in the current verification |
| AST and semantic GenVM lint | GENVM_VERSION=v0.2.16; genvm-lint check contracts/Creditsplit.py --json | Passed with Creditsplit, 17 methods, 5 views and 12 writes; local executable is genvm-linter 0.11.0 |
| Frontend install | npm ci in root and frontend | Both clean installs passed; lockfiles are committed |
| Strict TypeScript | npm run typecheck in frontend | Passed in the last green source verification |
| Frontend unit tests | npm test in frontend | 15 passed in the last green source verification |
| Production build | npm run build in frontend | Passed in the last green source verification |
| Browser smoke | npm run test:e2e in frontend | 2 Playwright projects passed: desktop and mobile navigation/form smoke |
| Runtime dependency audit | root npm audit --omit=dev --audit-level=high and frontend npm audit --audit-level=high | No high-severity runtime/frontend findings; root CLI development-tree advisories are tracked separately |
| Secret scan | CI tracked-source scan excluding lockfiles | Clean |

The source-release verification is [run 40213726715](https://github.com/ometere123/creditsplit/actions/runs/40213726715) on commit e6e435b. The final closeout commit is documentation-only; its exact workflow result is reported with the final main SHA.

## Current live contract evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Source-matched deployment | [Deployment transaction](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f) | Current address 0x03EEC54406D220ce484002A1A493d73D09b7F57C; FINALIZED, MAJORITY_AGREE, leader SUCCESS; registered source SHA matches |
| Initial readback | Current contract views | Project count 0 and zero accounting immediately after deployment |
| Browser sponsor write | [Project 1 create/fund](https://explorer-studio.genlayer.com/tx/0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474) | Convert Chrome/Rabby signed the production form on chain 61999; finalized with value credited; refresh/reconnect readback passed |
| Current successful lifecycle | Project 2 current ledger in DEPLOYMENT.md | Three joins, three actual packets, cross-packet references, completion, final artifact, responses, freeze, accepted evaluation and exact child/balance evidence |
| Current evaluation | [Evaluation](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde) | FINALIZED, MAJORITY_AGREE, successful leader execution, criteria met/met/met, weights [5,3,3] |
| Current native delivery | Three Explorer Send children in DEPLOYMENT.md | Each finalized incoming at the beneficiary; final RPC balances equal the deterministic allocations |
| Current negative path | Duplicate C response [transaction](https://explorer-studio.genlayer.com/tx/0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221) | Finalized execution ERROR after response sealing; no duplicate state write |
| Current active escrow | get_accounting after project 2 | project_count=2, active_escrow_wei=10000000000000000 for still-recruiting project 1, total_dispatched_wei=10000000000000000 for project 2 |

## Refund and disagreement evidence

| Scenario | Status | Evidence |
| --- | --- | --- |
| Current recruitment-expiry refund | Not executed | Project 1 maturity is 2026-10-27T14:11:29Z; it was not eligible during verification |
| Current incomplete-deliverable refund | Implemented/tested, no current live receipt | Offline and Direct Mode cases cover informational merit plus zero settlement weights and sponsor refund |
| Historical incomplete-deliverable refund | Verified on historical 0x49... | Failed evaluation, unchanged-evidence retry and refund child are recorded in DEPLOYMENT.md |
| Historical consensus disagreement | Verified fail-closed | No payout or state mutation on the first failed evaluation; later retry used the same frozen digest |
| Current-contract retry after disagreement | Not executed | Current project 2 reached an accepted outcome on its first evaluation |

Direct Mode exercises contract transitions and mocked leader/validator callbacks; it is not production validator-consensus proof. The live ledger is the evidence for current production consensus, native child sends and beneficiary balances. Playwright smoke is not connected-wallet proof.
