# Verification matrix

Commands below are the source-matched checks used for this tree. They are evidence of local execution only; they do not prove a StudioNet deployment or external GEN payment.

| Area | Command | Current evidence |
| --- | --- | --- |
| Offline state/adversarial harness | `py -3.12 -m pytest -q tests/test_contract_offline.py` | 20 passed locally |
| Actual GenLayer Direct Mode | `py -3.12 -m pytest -q tests/direct/` | 10 passed locally against `genlayer-test==0.29.2` and the pinned runner |
| AST + semantic GenVM lint | `$env:GENVM_VERSION='v0.2.16'; genvm-lint check contracts/Creditsplit.py --json` | Passed: 15 methods, 5 views, 10 writes |
| Python syntax | `py -3.12 -m compileall -q contracts` | Passed locally |
| Frontend install | `npm ci` in root and `frontend/` | Passed locally; lockfiles are committed |
| Strict TypeScript | `npm run typecheck` in `frontend/` | Passed locally |
| Frontend unit tests | `npm test` in `frontend/` | 8 passed locally |
| Production build | `npm run build` in `frontend/` | Passed locally |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=high` at repository root and `npm audit --audit-level=high` in `frontend/` | 0 vulnerabilities in runtime/frontend dependency sets |
| Browser smoke | `npm run test:e2e` in `frontend/` | 2 passed in CI run [40034433525](https://github.com/ometere123/creditsplit/actions/runs/40034433525): Chromium desktop and Pixel 7 |
| StudioNet lifecycle | Signed writes against chain 61999 | Not run: no funded wallet/deployment credentials were available in this environment |
| Vercel production | Actual public deployment URL | Not run: no Creditsplit project exists in the connected Vercel team, and deployment requires the verified contract address |

Direct Mode captures the validator callback and exercises contract state transitions, but it cannot prove that production consensus validators agree or that an external GEN message changed a real EOA balance. Those claims require the signed StudioNet evidence ledger described in `docs/REVIEW_EVIDENCE.md`.

The full root development-tree audit still reports transitive advisories bundled by the required `genlayer@0.39.1` CLI (including its old test dependency). The CI gate intentionally audits the root runtime set with `--omit=dev`; replacing or overriding that CLI's dependency graph would violate the locked CLI requirement. The frontend dependency audit is clean without an exception.
