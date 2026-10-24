# Verification matrix

Commands below are the source-matched checks used for this tree. The StudioNet rows link to live external evidence; synthetic packet content is explicitly not external authorship proof.

| Area | Command | Current evidence |
| --- | --- | --- |
| Offline state/adversarial harness | `py -3.12 -m pytest -q tests/test_contract_offline.py` | 20 passed locally |
| Actual GenLayer Direct Mode | `py -3.12 -m pytest -q tests/direct/` | 15 passed locally against `genlayer-test==0.29.2` and the pinned runner |
| AST + semantic GenVM lint | `$env:GENVM_VERSION='v0.2.16'; genvm-lint check contracts/Creditsplit.py --json` | Passed: 15 methods, 5 views, 10 writes |
| Python syntax | `py -3.12 -m compileall -q contracts` | Passed locally |
| Frontend install | `npm ci` in root and `frontend/` | Passed locally; lockfiles are committed |
| Strict TypeScript | `npm run typecheck` in `frontend/` | Passed locally |
| Frontend unit tests | `npm test` in `frontend/` | 11 passed locally |
| Production build | `npm run build` in `frontend/` | Passed locally |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=high` at repository root and `npm audit --audit-level=high` in `frontend/` | 0 vulnerabilities in runtime/frontend dependency sets |
| Browser smoke | `npm run test:e2e` in `frontend/` | 2 passed in the prior verified CI run; the exact run for the final pushed commit is linked from the completion report |
| StudioNet deployment | Pinned CLI 0.39.1 + StudioNet RPC | Diagnostic and Creditsplit deployments finalized with `MAJORITY_AGREE`; Creditsplit address `0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3`, source byte match and initial readback are recorded in `docs/REVIEW_EVIDENCE.md`. |
| StudioNet lifecycle | SDK writes + RPC readback + official Explorer | One funded synthetic lifecycle completed: three joins, packets, assembly, attribution, freeze, evaluation, deterministic `[3,3,3]` allocation and three child transfer messages. Recipient balances moved `0.1 → 0.11 GEN` each. Recruitment/incomplete-refund live deadlines remain unexercised. |
| Vercel production | Actual public deployment URL | Pending; no URL is claimed until a production deployment is created and browser-tested with the verified contract address. |

Direct Mode captures the validator callback and exercises contract state transitions, but it cannot prove production consensus or real EOA balance changes. The live evidence ledger does prove those specific synthetic lifecycle observations, while remaining explicit that no external contribution source was fetched.

The full root development-tree audit still reports transitive advisories bundled by the required `genlayer@0.39.1` CLI (including its old test dependency). The CI gate intentionally audits the root runtime set with `--omit=dev`; replacing or overriding that CLI's dependency graph would violate the locked CLI requirement. The frontend dependency audit is clean without an exception.
