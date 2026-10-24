# Reviewer evidence ledger

This ledger separates reproducible local/CI evidence from external evidence that still requires an authorized funded wallet, source-matched StudioNet deployment and Vercel project. Never claim a deployment or transfer that is not backed by a hash, receipt and balance proof.

## Verified locally in this working tree

- [x] Contract offline harness: `py -3.12 -m pytest -q tests/test_contract_offline.py` — 20 passed.
- [x] Actual pinned Direct Mode: `py -3.12 -m pytest -q tests/direct/` — 15 passed. Coverage includes escrow creation, identity enforcement, deadline transitions, fallback, refunds, immutable revision/UTF-8 limits, digest tampering, malformed/adversarial decisions, independent validator disagreement, payment-field forgery, replay prevention and cross-project escrow isolation.
- [x] AST + semantic GenVM lint: `GENVM_VERSION=v0.2.16 genvm-lint check contracts/Creditsplit.py --json` — passed, 15 methods (5 views, 10 writes). The contract remains pinned to and tested with the repository's `py-genlayer` hash.
- [x] Repository-local CLI: `npm run genlayer:version` — `0.39.1`.
- [x] Frontend lockfile install, strict typecheck, 11 Vitest tests and Next production build. Transaction recovery records now scope chain, wallet, contract and method; a finalized failed execution clears the duplicate-write lock after the receipt is inspected.
- [x] CI workflow now uses `npm ci`, pinned action SHAs, the explicit supported linter bundle, Playwright desktop/mobile smoke projects, audit and tracked-source secret scanning.
- [x] Code/CI commit: [`d948e788c82a822b02d394062b644ff8b0db25e9`](https://github.com/ometere123/creditsplit/commit/d948e788c82a822b02d394062b644ff8b0db25e9); contract source SHA-256: `CD4AA250388CE3478B674E8D3049439B231489E37745BE0396295199F2B220EA`.
- [x] GitHub Actions run [40034433525](https://github.com/ometere123/creditsplit/actions/runs/40034433525) — contract and frontend jobs successful, including Direct Mode, semantic lint, audits, desktop/mobile Playwright, typecheck and production build.

## External evidence still required

- [x] Evidence ledger commit: [`7cec66ae6d1ab755e65aacebd0ca76c69d3f9cae`](https://github.com/ometere123/creditsplit/commit/7cec66ae6d1ab755e65aacebd0ca76c69d3f9cae); the final repository commit is reported in the completion handoff.
- [ ] StudioNet 61999 deployment address, deployment transaction hash, source hash and explorer links.
- [x] Deployment attempt A recorded: [`0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86`](https://explorer-studio.genlayer.com/tx/0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86) — official explorer `FINALIZED · Send`, zero GEN, no initial validators or consensus result; RPC `NO_MAJORITY`, `UNKNOWN`, no rounds/votes, no address.
- [x] Deployment attempt B recorded: [`0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd`](https://explorer-studio.genlayer.com/tx/0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd) — same protocol destination and no validator/consensus data; no address.
- [x] Deployment attempt C recorded: [`0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769`](https://explorer-studio.genlayer.com/tx/0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769) — same protocol destination and no validator/consensus data; no address. The Consensus tab shows the submitted signed rollup payload, so the source was embedded in the protocol request.
- [x] StudioNet readiness observation: the official dashboard reports active validators and recent successful deployment records. This rules out the earlier unqualified statement that shared consensus was unavailable, but does not identify why these three submissions received no validator assignment.
- [ ] Minimal no-LLM diagnostic deployment. Source lint passed; submission is blocked by the authorized CLI keystore being locked, and no credential was guessed.
- [ ] Real funded sponsor create/fund transaction and readback.
- [ ] Three independent contributor wallet joins and attributable submissions.
- [ ] Assembler artifact, review responses, frozen digest and state readback.
- [ ] Evaluation transaction with successful `txExecutionResultName`, validator agreement evidence and deterministic amount ledger.
- [ ] Every finalization-triggered external message's execution outcome and beneficiary balance delta.
- [ ] Recruitment refund and incomplete-deliverable refund transaction receipts and balance deltas.
- [x] CI Playwright desktop/mobile smoke tests — successful in run [40034433525](https://github.com/ometere123/creditsplit/actions/runs/40034433525).
- [ ] Live desktop/mobile wallet verification against the deployed URL.
- [ ] Vercel public URL with the verified current contract address. No Creditsplit project currently exists in the connected Vercel team.
- [ ] Any demo video or public submission link, if required by the portal.

## Transaction ledger template

| Scenario | Contract tx | Execution result | Triggered child tx / outcome | State readback | Balance proof |
| --- | --- | --- | --- | --- | --- |
| Contract deployment attempt A | `0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86` | `FINALIZED · Send`; `NO_MAJORITY`; `UNKNOWN` | none; no address created | no IC readback | `value_credited=false` |
| Contract deployment attempt B | `0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd` | `FINALIZED · Send`; `NO_MAJORITY`; `UNKNOWN` | none; no address created | no IC readback | `value_credited=false` |
| Contract deployment attempt C | `0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769` | `FINALIZED · Send`; `NO_MAJORITY`; `UNKNOWN` | none; no address created | no IC readback | `value_credited=false` |
| Sponsor create + fund | pending | pending | pending | pending | pending |
| Contributor A/B/C join | pending | pending | n/a | pending | n/a |
| Contributions + final artifact | pending | pending | n/a | pending | n/a |
| Attribution freeze | pending | pending | n/a | digest pending | n/a |
| Successful evaluation | pending | pending | pending | allocations pending | pending |
| Recruitment refund | pending | pending | pending | refund pending | pending |
| Incomplete-deliverable refund | pending | pending | pending | refund pending | pending |

**Review objective** is 5/5/5/5; a score cannot be self-certified by the engineering team.
