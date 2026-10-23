# Reviewer evidence checklist (not yet completed)

All boxes below are **unverified** until concrete evidence links and command logs are added. Never claim a passing test, deployment or transfer that did not happen.

- [ ] Source commit SHA, final tree and clean npm/Python dependency lockfiles.
- [ ] Version checks: StudioNet=61999, local CLI=0.39.1, GenLayerJS=1.1.8, Python SDK target pinned.
- [ ] Contract AST, GenVM semantic lint, no prohibited imports or storage types.
- [ ] Offline harness green (`pytest -q tests/test_contract_offline.py`) — source authoring session recorded 17 passed; re-run at final HEAD.
- [ ] `genlayer-test` Direct Mode with independent leader/validator mock and malicious-input regression.
- [ ] Source-matched StudioNet deployed contract and its explorer URL.
- [ ] Real signed sponsor funding transaction with nonzero native GEN and successful state readback.
- [ ] Three different contributor wallet joins and authorized versioned submissions.
- [ ] Assembler final artifact, contributor attribution response and frozen SHA-256 readback.
- [ ] Finalized evaluation transaction with `isSuccessful` + accepted band ledger and distinct independent validator checks.
- [ ] Finalization-triggered external GEN messages individually reconciled with recipient EVM balances.
- [ ] Recruitment-expiry refund and incomplete-deliverable refund finalization + balance reconciliation.
- [ ] Browser Playwright E2E for actual injected EIP-1193 wallet with exact chain 61999, correct address and rendered frontend.
- [ ] CI install, Next build, strict typecheck, Vitest, security review and Vercel release URL.
- [ ] Demo video + full transaction provenance + public post, if submitted as separately verifiable extras.

**Review objective** is 5/5/5/5; a score cannot be self-certified by the engineering team.
