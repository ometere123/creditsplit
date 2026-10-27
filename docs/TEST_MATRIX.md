# Verification matrix

Results are evidence records, not self-assigned portal scores. Current-contract live transactions and historical-contract transactions are intentionally separated.

## Local and CI verification

| Area | Command or evidence | Result |
| --- | --- | --- |
| Python compilation | py -3.12 -m compileall -q contracts | Passed |
| Offline contract harness | py -3.12 -m pytest -q tests/test_contract_offline.py | 48 passed; includes verified-source retrieval/digest checks, assembler omission, incomplete completion, packet-specific exact-copy ordering, clean-reference concealment, informative anchors, forged decisions, validator-cache isolation, refunds, replay and escrow isolation |
| GenLayer Direct Mode | py -3.12 -m pytest -q tests/direct/ | 30 passed against genlayer-test 0.29.2 and pinned GenVM v0.2.16 |
| Combined Python suite | py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/ | 78 passed in the corrected-source verification |
| AST and semantic GenVM lint | GENVM_VERSION=v0.2.16; genvm-lint check contracts/Creditsplit.py --json | Passed with Creditsplit, 18 methods, 5 views and 13 writes; local executable is genvm-linter 0.11.0 |
| Frontend install | npm ci in root and frontend | Both clean installs passed; lockfiles are committed |
| Strict TypeScript | npm run typecheck in frontend | Passed in the last green source verification |
| Frontend unit tests | npm test in frontend | 16 passed in the source-release verification |
| Production build | npm run build in frontend | Passed in the last green source verification |
| Browser smoke | npm run test:e2e in frontend | 2 Playwright projects passed: desktop and mobile navigation/form smoke |
| Runtime dependency audit | root npm audit --omit=dev --audit-level=high and frontend npm audit --audit-level=high | No high-severity runtime/frontend findings; root CLI development-tree advisories are tracked separately |
| Secret scan | CI tracked-source scan excluding lockfiles | Clean |

The corrected contract verification passed locally on source commit `852a6257838e36c9fa75f5c290d8c3157c59a66f`; the post-closeout exact-SHA CI run is reported with the final `main` commit in the release handoff. The historical run `40574626765` is not reused as proof for this corrected source.

## Current live contract evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Source-matched deployment | [Deployment transaction](https://explorer-studio.genlayer.com/tx/0xd361045f3b3b0162e1a5109bf37c266feb4ad2fe306ad4f1f8471413e8f76b28) | Current address 0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB; FINALIZED, MAJORITY_AGREE, leader SUCCESS; registered source SHA matches `73fd5a...5ffa3` |
| Initial readback | Current contract views | Project count 0 and zero accounting immediately after deployment |
| Current verified-source lifecycle | Project 1 current ledger in DEPLOYMENT.md | Three joins, three authored packets, correction references, completion, final artifact, responses, freeze and source-verified assessment |
| Historical native delivery | Historical 0x03EEC project 2 ledger in DEPLOYMENT.md | Three child sends and recipient balance evidence are preserved, but are not current-contract evidence |
| Current evaluation | [Evaluation](https://explorer-studio.genlayer.com/tx/0xf13ff7565c483b16a05c8ad892277d30ca660997aa9d534a9e8c8cb2809db27a) | FINALIZED, MAJORITY_AGREE, leader SUCCESS, criteria met/met/met, weights [5,3,1] |
| Current child execution | Three child records in DEPLOYMENT.md | All three finalized `NO_MAJORITY`, `value_credited=true`, no child execution hash; direct balance deltas equal allocations, and the contract remains `EMITTED_UNVERIFIED` |
| Current negative path | Duplicate C response [transaction](https://explorer-studio.genlayer.com/tx/0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221) | Finalized execution ERROR after response sealing; no duplicate state write |
| Current accounting | get_accounting after project 1 | project_count=1, active_escrow_wei=0, total_dispatched_wei=1000000000000000 |

## Refund and disagreement evidence

| Scenario | Status | Evidence |
| --- | --- | --- |
| Current recruitment-expiry refund | Not executed | The current source-mode project recruited all three wallets; no current-contract recruitment-refund receipt exists |
| Current incomplete-deliverable refund | Implemented/tested, no current live receipt | Offline and Direct Mode cases cover informational merit plus zero settlement weights and sponsor refund |
| Historical incomplete-deliverable refund | Verified on historical 0x49... | Failed evaluation, unchanged-evidence retry and refund child are recorded in DEPLOYMENT.md |
| Historical consensus disagreement | Verified fail-closed | No payout or state mutation on the first failed evaluation; later retry used the same frozen digest |
| Current-contract retry after disagreement | Not executed | Current source-mode project 1 reached an accepted outcome on its first evaluation; retry remains covered by offline/Direct Mode and historical live evidence |

Direct Mode exercises contract transitions and mocked leader/validator callbacks; it is not production validator-consensus proof. The current live ledger is evidence for source retrieval, parent consensus, child records and direct balance deltas. Convert Chrome inspection verified the current UI/read path; Playwright smoke and this closeout do not claim a new browser-signed current-contract write.
