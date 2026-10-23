# Reviewer evidence ledger

This ledger separates reproducible local/CI evidence from external evidence that still requires an authorized funded wallet, source-matched StudioNet deployment and Vercel project. Never claim a deployment or transfer that is not backed by a hash, receipt and balance proof.

## Verified locally in this working tree

- [x] Contract offline harness: `py -3.12 -m pytest -q tests/test_contract_offline.py` — 20 passed.
- [x] Actual pinned Direct Mode: `py -3.12 -m pytest -q tests/direct/` — 10 passed. Coverage includes escrow creation, identity enforcement, deadlines, fallback, refunds, mocked malformed/adversarial decisions and replay prevention.
- [x] AST + semantic GenVM lint: `GENVM_VERSION=v0.2.16 genvm-lint check contracts/Creditsplit.py --json` — passed, 15 methods (5 views, 10 writes). The contract remains pinned to and tested with the repository's `py-genlayer` hash.
- [x] Repository-local CLI: `npm run genlayer:version` — `0.39.1`.
- [x] Frontend lockfile install, strict typecheck, 8 Vitest tests and Next production build.
- [x] CI workflow now uses `npm ci`, pinned action SHAs, the explicit supported linter bundle, Playwright desktop/mobile smoke projects, audit and tracked-source secret scanning.
- [x] Code/CI commit: [`d948e788c82a822b02d394062b644ff8b0db25e9`](https://github.com/ometere123/creditsplit/commit/d948e788c82a822b02d394062b644ff8b0db25e9); contract source SHA-256: `CD4AA250388CE3478B674E8D3049439B231489E37745BE0396295199F2B220EA`.
- [x] GitHub Actions run [40034433525](https://github.com/ometere123/creditsplit/actions/runs/40034433525) — contract and frontend jobs successful, including Direct Mode, semantic lint, audits, desktop/mobile Playwright, typecheck and production build.

## External evidence still required

- [x] Evidence ledger commit: [`7cec66ae6d1ab755e65aacebd0ca76c69d3f9cae`](https://github.com/ometere123/creditsplit/commit/7cec66ae6d1ab755e65aacebd0ca76c69d3f9cae); the final repository commit is reported in the completion handoff.
- [ ] StudioNet 61999 deployment address, deployment transaction hash, source hash and explorer links.
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
| Sponsor create + fund | pending | pending | pending | pending | pending |
| Contributor A/B/C join | pending | pending | n/a | pending | n/a |
| Contributions + final artifact | pending | pending | n/a | pending | n/a |
| Attribution freeze | pending | pending | n/a | digest pending | n/a |
| Successful evaluation | pending | pending | pending | allocations pending | pending |
| Recruitment refund | pending | pending | pending | refund pending | pending |
| Incomplete-deliverable refund | pending | pending | pending | refund pending | pending |

**Review objective** is 5/5/5/5; a score cannot be self-certified by the engineering team.
