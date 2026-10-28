# Verification matrix

Results are evidence records, not self-assigned portal scores. Current-contract live transactions and historical-contract transactions are intentionally separated.

## Local and CI verification

| Area | Command or evidence | Result |
| --- | --- | --- |
| Python compilation | py -3.12 -m compileall -q contracts | Passed |
| Offline contract harness | py -3.12 -m pytest -q tests/test_contract_offline.py | 50 passed; includes verified-source retrieval/digest checks, assembler omission, incomplete completion, packet-specific exact-copy ordering, clean-reference concealment, informative anchors, forged decisions, validator-cache isolation, refunds, replay and escrow isolation |
| GenLayer Direct Mode | py -3.12 -m pytest -q tests/direct/ | 31 passed against genlayer-test 0.29.2 and pinned GenVM v0.2.16 |
| Combined Python suite | py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/ | 81 passed in the current source verification |
| AST and semantic GenVM lint | GENVM_VERSION=v0.2.16; genvm-lint check contracts/Creditsplit.py --json | Passed with Creditsplit, 19 methods, 5 views and 14 writes; local executable is genvm-linter 0.11.0 |
| Frontend install | npm ci in root and frontend | Both clean installs passed; lockfiles are committed |
| Strict TypeScript | npm run typecheck in frontend | Passed in the last green source verification |
| Frontend unit tests | npm test in frontend | 32 passed, including conservative settlement-presentation states for payouts and refunds |
| Production build | npm run build in frontend | Passed after the receipt-verification correction |
| Browser smoke | npm run test:e2e in frontend | 2 Playwright projects passed: desktop and mobile navigation/form smoke |
| Connected-wallet fixture | npm run test:e2e:connected in frontend | 4 executions passed across connected-desktop/mobile: injected EIP-1193 chain switching, account invalidation, one payable intent, confirmed-success persistence after forced read failure, read-only retry and duplicate-write prevention; deterministic fixtures, not live settlement evidence |
| Delivery verifier adversarial suite | `npm run test:delivery` in frontend | 16 executable Node tests passed: authoritative triggered-child linkage, wrong parent/sender/recipient/value/project/network, missing/duplicate/malformed child provenance, EOA `NO_MAJORITY` with `value_credited`, uncredited child, sponsor refund, historical-delta attribution and contradictory RPC fixtures |
| Read-only delivery verifier | `npm run verify:delivery` from `frontend/` against current project 2 | Passed against StudioNet readbacks: official `getTriggeredTransactionIds()` exactly matched the three supplied children, exact `2,000,000,000,000,000` wei conservation, recipient/child matching and parent `FINALIZED / MAJORITY_AGREE / leader SUCCESS`; correctly reports `EMITTED_UNVERIFIED` delivery as unconfirmed without authoritative historical balance attribution |
| Runtime dependency audit | root npm audit --omit=dev --audit-level=high and frontend npm audit --audit-level=high | No high-severity runtime/frontend findings; root CLI development-tree advisories are tracked separately |
| Secret scan | CI tracked-source scan excluding lockfiles | Clean |

The contract source hash was verified locally as `309998D18CE351F45AF55C34DCAB3481C8BB923F74B9D2DA5249E0039C3F6977`, and the current frontend receipt verifier was tested in commit `825ed8d4743337fbc93ca6e317c27cb240b1700d`. The prior exact-source verification passed [GitHub Actions run 40670532365](https://github.com/ometere123/creditsplit/actions/runs/40670532365). This branch adds read-only verification and deterministic test infrastructure only; it does not change contract or production frontend behavior.

## Current live contract evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Source-matched deployment | [Deployment transaction](https://explorer-studio.genlayer.com/tx/0xa21f4e7ce67d438583a1bbdef1a7282db6888feb9a9edcd31eec9fefc1219114) | Current address 0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D; FINALIZED, MAJORITY_AGREE, leader SUCCESS; registered source SHA matches `309998...f6977` |
| Initial readback | Current contract views | Project count 0 and zero accounting immediately after deployment; schema 19 methods, 5 views, 14 writes |
| Current browser lifecycle | Project 1 current ledger in DEPLOYMENT.md | Three joins, four authored packets including a correction, completion, final artifact, responses, freeze, two failed consensus attempts and unanimous unresolved refund |
| Current CLI/SDK accepted lifecycle | Project 2 current ledger in DEPLOYMENT.md | One `0.002 GEN` payable source-backed project; three CLI-authorized contributors, correction reference, frozen digest, first evaluation `FINALIZED / MAJORITY_AGREE / SUCCESS`, criteria met/met/met, weights [5,3,3] |
| Current child settlement | Evaluation [`0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972`](https://explorer-studio.genlayer.com/tx/0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972) | Child A/B/C transactions each `FINALIZED / NO_MAJORITY / value_credited=true`; no child execution success claim; exact allocations sum to the pool |
| Historical native delivery | Historical 0x03EEC project 2 ledger in DEPLOYMENT.md | Three child sends and recipient balance evidence are preserved, but are not current-contract evidence |
| Current evaluation attempts | [First](https://explorer-studio.genlayer.com/tx/0x21573da22ec0642d1e66e8e4a1be1b42ef1424236b73992085322ee52b5ad63c) / [retry](https://explorer-studio.genlayer.com/tx/0xf305258f91e5c0454b76ad3290be9fdda472931ebb659a23b89567c37e6d2471) | Both FINALIZED, MAJORITY_DISAGREE; no decision, no payout, frozen digest and escrow unchanged |
| Current refund path | [Parent](https://explorer-studio.genlayer.com/tx/0x166db01ed7a20af34051e9bc8cc021f7ff6d4e595eab5737b5a7010bfaff87cf) / [child](https://explorer-studio.genlayer.com/tx/0x5902080a9d06cd5076646fc4dfa92d042138e24d78a07ac76623a259deedab0e) | Four-party unanimous approval; parent FINALIZED/MAJORITY_AGREE/SUCCESS; child FINALIZED/NO_MAJORITY/value_credited=true; current state REFUND_EMITTED/EMITTED_UNVERIFIED |
| Current accounting | get_accounting after current project 2 settlement | project_count=2, active_escrow_wei=0, total_dispatched_wei=3000000000000000 wei |

## Refund and disagreement evidence

| Scenario | Status | Evidence |
| --- | --- | --- |
| Current recruitment-expiry refund | Not executed | The current browser project recruited all three wallets; no current-contract recruitment-refund receipt exists |
| Current incomplete-deliverable refund | Implemented/tested, no current live receipt | Offline and Direct Mode cases cover informational merit plus zero settlement weights and sponsor refund |
| Historical incomplete-deliverable refund | Verified on historical 0x49... | Failed evaluation, unchanged-evidence retry and refund child are recorded in DEPLOYMENT.md |
| Historical consensus disagreement | Verified fail-closed | No payout or state mutation on the first failed evaluation; later retry used the same frozen digest |
| Current-contract retry after disagreement | Executed; disagreement persisted | The same frozen digest was evaluated twice; both attempts disagreed and left escrow/evidence unchanged before the unanimous participant-approved exit |
| Current-contract accepted source-backed assessment | Verified | Project 2 evaluation finalized `MAJORITY_AGREE` with leader `SUCCESS`, stored `[5,3,3]`, and settled the exact `2000000000000000` wei pool; child delivery remains conservatively labeled |

Direct Mode exercises contract transitions with the pinned GenLayer Testing Suite; its model callbacks are controlled fixtures and are not production validator-consensus proof. The current live ledger now contains browser-signed project 1 disagreement/refund evidence and CLI/SDK project 2 accepted source-backed adjudication evidence. The successful historical `[5,3,1]` assessment and older beneficiary payout evidence remain historical. The three current funded evaluation attempts comprise one accepted outcome and two disagreements; that small sample is not a statistical convergence claim. Playwright covers deterministic desktop/mobile smoke and receipt-handling paths; it is not a substitute for the Convert Chrome/Rabby record.
