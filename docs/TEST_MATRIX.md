# Verification matrix

The following results were run from the source tree. Live rows are evidence records, not self-assigned portal scores.

| Area | Command or evidence | Result |
| --- | --- | --- |
| Offline contract harness | `py -3.12 -m pytest -q tests/test_contract_offline.py` | 29 passed locally, including criteria, authored passages, references, duplicate work, forged decisions, refunds, replay and escrow isolation |
| Actual GenLayer Direct Mode | `py -3.12 -m pytest -q tests/direct/` | 15 passed locally against `genlayer-test==0.29.2` and the pinned runner |
| Combined Python suite | `py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/` | 44 passed |
| AST + semantic GenVM lint | `$env:GENVM_VERSION='v0.2.16'; genvm-lint check contracts/Creditsplit.py --json` | Passed: 17 methods, 5 views, 12 writes |
| Python syntax | `py -3.12 -m compileall -q contracts` | Passed |
| Frontend install | `npm ci` in root and `frontend/` | Passed; lockfiles committed |
| Strict TypeScript | `npm run typecheck` in `frontend/` | Passed |
| Frontend unit tests | `npm test -- --run` in `frontend/` | 12 passed |
| Production build | `npm run build` in `frontend/` | Passed |
| Browser smoke | `npm run test:e2e` in `frontend/` | 2 passed: desktop and mobile navigation/create-criteria smoke |
| Runtime dependency audit | root `npm audit --omit=dev --audit-level=high`; frontend `npm audit --audit-level=high` | Runtime/frontend sets clean; development-tree advisories bundled by required CLI remain documented |
| Source-matched deployment | Deployment tx [`0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe`](https://explorer-studio.genlayer.com/tx/0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe) | `FINALIZED`, `MAJORITY_AGREE`, source hash match, address `0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD` |
| Initial readback | `get_project_count()`, `get_accounting()` | `0`; `{active_escrow_wei:"0", project_count:0, total_dispatched_wei:"0"}` |
| Completed live lifecycle | StudioNet SDK writes + RPC reads | Project 1: three joins, three authored packets, references, assembly, three responses, freeze, evaluation `MAJORITY_AGREE`, weights `[5,3,1]`, amounts `0.05/0.03/0.01 GEN`; child transfers credited all recipients |
| Live adversarial case | Separate StudioNet project 2 | Forged final source reference `0:999` finalized with execution `ERROR`; valid incomplete artifact froze; evaluation reached `MAJORITY_DISAGREE / ERROR` without settlement or child transfers; escrow remained reserved |
| Vercel production | Actual public URL | Not verified. Existing team/GitHub integration remains blocked by HTTP 403; no URL is claimed |

Direct Mode exercises validator callbacks and contract transitions, but cannot prove production consensus or beneficiary balances. The live ledger proves those observations for the new source-matched deployment. The live packets are authored test passages submitted directly by disposable wallets; no external documents or contribution sources were fetched.

The root development-tree audit retains advisories bundled by the required `genlayer@0.39.1` CLI. The runtime/frontend audit result is reported separately rather than incorrectly claiming the entire dependency graph is vulnerability-free.
