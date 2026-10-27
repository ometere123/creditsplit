# Creditsplit

**Fair credit for collaborative work, enforced by independent GenLayer judgment.**

Creditsplit is a single-scope Social / Creator Rewards / Contributor Reputation application: a sponsor funds a public, invitation-only, three-contributor writing commission; authors commit limited wallet-attributed revisions; the final document and responses are frozen; GenLayer validators independently assess the deliverable and each participant's material contribution; deterministic contract logic calculates reward shares and emits native GEN transfers on finalization.

## Status and honesty

**Source-matched StudioNet deployment and a Vercel production application are verified.** The current contract is [`0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB`](https://explorer-studio.genlayer.com/address/0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB) on chain 61999. Deployment [`0xd361045f3b3b0162e1a5109bf37c266feb4ad2fe306ad4f1f8471413e8f76b28`](https://explorer-studio.genlayer.com/tx/0xd361045f3b3b0162e1a5109bf37c266feb4ad2fe306ad4f1f8471413e8f76b28) finalized `MAJORITY_AGREE` with successful leader execution; registered source bytes (45,057 bytes) match `contracts/Creditsplit.py` SHA-256 `73fd5a760a2ce3c70af3d03802fd2439f2da29c671000a817fdbfab3f5d5ffa3`. Its current project 1 registered an immutable commit-pinned GenLayer protocol reference, completed the three-wallet lifecycle, and reached an accepted `met/met/met`, `[5,3,1]` assessment. The finalization-triggered child records were `FINALIZED / NO_MAJORITY / value_credited=true`; direct balance readback confirmed exact deltas of `555555555555556`, `333333333333333` and `111111111111111` wei, while no child execution success is claimed. The earlier successful native payout remains explicitly historical on `0x03EEC...` and older deployments. The optional verified-source mode strengthens factual checking against a hash-bound public reference; it does not prove human authorship, originality or non-collusion. This is not a 5/5/5/5 self-certification.

## Locked environment

- StudioNet **61999** only — `https://studio.genlayer.com/api`. Do not use 61997, Studio-dev or Studio-next.
- Repository-local **`genlayer@0.39.1`**, **`genlayer-js@1.1.8`**, GenLayer test **0.29.2**, GenVM linter **0.11.0**.
- Next.js 16.4.2 / React 19.2 / TypeScript 5.9 / Tailwind 4, Node 22, Python 3.12.
- MetaMask injected EIP-1193, native GEN only. No database, API server, Workers, R2, wallet private keys or off-chain oracle.

## Product workflow

1. Sponsor signs payable `create_project_with_criteria()` with GEN, a capped brief, exactly three immutable acceptance criteria, three distinct invited wallet addresses and an assembler slot. For bounded factual work, the sponsor may instead use `create_project_with_verified_source()` with a raw GitHub URL pinned to a 40-character commit and its SHA-256 digest. Sponsor cannot be invited.
2. Three contributors independently `join_project()` within **48 hours**. Otherwise any caller can invoke `refund_unstarted_project()` after expiry.
3. Each wallet submits up to **two immutable revisions**, signs `finish_contributing()` and can inspect others' versions. Contribution window: **72 hours** from full recruitment, or closes early when all finish.
4. The assigned assembler submits a final text document and references authentic packet IDs within **24 hours**. If absent by deadline, a permissionless `advance_project()` creates a deterministic, explicitly flagged fallback compilation.
5. Each contributor has **24 hours** to submit one optional attribution response and acknowledgment. `freeze_project()` computes a SHA-256 digest over a canonical evidence snapshot.
6. `evaluate_contributions()` asks the leader to judge the actual passages against the three criteria. Each contributor receives bounded classifications for relevance, distinctness, correctness, material effect and attribution consistency. In verified-source mode, leader and validators independently retrieve the commit-pinned bytes through GenLayer nondeterministic web access, check the digest and classify factual claims as supported, contradicted or unverifiable; source failure is fail-closed. Each validator independently re-runs the task over the same frozen evidence, checks authentic packet/source references, and compares **all payment-controlling classifications**. Explanations and equivalent supporting references may differ; an undecided or failed assessment does not settle funds.
7. For passing deliverables, exact wei shares follow verified bands with the integer remainder assigned to the top band (lowest slot on ties). For incomplete work the full pool is refunded. EOA **external GEN messages** are emitted only for finalization; receipt/external-message/balance verification is required. No arbitrary claim path, no commission.
8. Finalized on-chain classifications are incorporated into a wallet's reputation ledger; prior reputation never influences current payout.

All evidence is **public** and qualifying work is submitted under **CC BY 4.0** terms; this is not a private authoring system and does not establish identity or authorship outside the registered wallet evidence.

## Structure

- `contracts/Creditsplit.py` — one authoritative Intelligent Contract with custom EP and evidence-based attribution engine.
- `frontend/` — full responsive application; live reads and wallet writes (no fixtures masquerading as on-chain data).
- `tests/test_contract_offline.py` — offline adversarial logic harness (not Direct Mode).
- `tests/direct/` — actual pinned GenLayer Testing Suite Direct Mode coverage.
- `frontend/tests/` — deterministic form/wei input tests; `frontend/tests/e2e/` — Playwright responsive smoke coverage.
- `docs/` — architecture, economics, security and reviewer evidence gates.
- `.github/workflows/ci.yml` — test/build verification scaffold.

## Local use

```sh
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/
# GenVM SDK semantic validation and Direct Mode are separate mandatory steps:
$env:GENVM_VERSION='v0.2.16'
genvm-lint check contracts/Creditsplit.py --json

cd frontend
npm ci
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
cp .env.example .env.local
npm run dev
```

The repository and frontend each have a committed npm lockfile. Direct Mode pins the compatible `v0.2.16` GenVM universal bundle because `genlayer-test==0.29.2` downloads the legacy `genvm-universal.tar.xz` asset. The linter uses the same explicit version and validates the pinned `py-genlayer` hash.

Set `NEXT_PUBLIC_CONTRACT_ADDRESS=0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB` for the current verified StudioNet build. Deployment environment variables must contain **no private keys** in the frontend or Vercel configuration.

## Essential deployment/verification gates

1. Confirm actual CLI 0.39.1 + SDK 1.1.8 compatibility and Python SDK pinned `Depends` against StudioNet.
2. Run AST and GenVM semantic lint; GenLayer Test Direct Mode leader/validator fault injection; real network deploy and source comparison.
3. Demonstrate the create/fund/join/submit/assemble/respond/freeze/evaluate flow with **three actual wallet actors**, confirmed `FINALIZED` and successful parent execution for every write. The current verified-source ledger does this with authored test passages and a hash-bound reference; it does not prove external authorship.
4. Inspect finalization-triggered EOA transfer messages **and recipient balance deltas**; verify recipient totals equal escrow input. Emission alone is not proof of payment.
5. Test recruitment refund, incomplete work refund, invalid leader outcome, forged evidence ID, consensus disagreement, timeout/unavailable provider, duplicate transaction avoidance and mixed-project accounting. The current verified-source evaluation accepted the criteria and classifications; its child records finalized `NO_MAJORITY`, while direct balance readback confirmed the exact recipient deltas and no child execution success is claimed. The successful payout, incomplete-deliverable refund and safe retry are also preserved on historical deployments and in offline/Direct Mode; current recruitment refund remains wall-clock dependent.
6. Confirm contract ABI/public method names, fee estimation and StudioNet browser wallet paths from actual signed transactions; repair genuine incompatibilities, rerun tests and redeploy source-matched if changes occur.

See `docs/REVIEW_EVIDENCE.md` for the exact reviewer-facing evidence ledger. The final Codex handoff prompt is intentionally provided **in chat only**, not in this repository.

## Reviewer-facing references

- [Architecture and trust boundaries](docs/ARCHITECTURE.md)
- [Consensus and Equivalence Principle](docs/CONSENSUS.md)
- [Contract method reference](docs/CONTRACT_REFERENCE.md)
- [GEN accounting and refunds](docs/ECONOMICS.md)
- [Threat model and limitations](docs/THREAT_MODEL.md)
- [Test matrix and commands](docs/TEST_MATRIX.md)
- [Deployment and provenance procedure](docs/DEPLOYMENT.md)
- [Evidence ledger](docs/REVIEW_EVIDENCE.md)
