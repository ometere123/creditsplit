# Verification matrix

Results are evidence records, not self-assigned portal scores.

| Area | Command or evidence | Result |
| --- | --- | --- |
| Offline contract harness | `py -3.12 -m pytest -q tests/test_contract_offline.py` | `42` passed locally, including omitted assembler refs, incomplete completion, packet-specific exact-copy ordering, clean-reference concealment, informative anchors, forged decisions, refunds, replay and escrow isolation |
| Actual GenLayer Direct Mode | `py -3.12 -m pytest -q tests/direct/` | `18` passed locally against `genlayer-test==0.29.2` and pinned `v0.2.16` |
| Combined Python suite | `py -3.12 -m pytest -q tests/test_contract_offline.py tests/direct/` | `60 passed` |
| AST + semantic GenVM lint | `$env:GENVM_VERSION='v0.2.16'; genvm-lint check contracts/Creditsplit.py --json` | Passed: `17 methods`, `5 views`, `12 writes` |
| Python syntax | `py -3.12 -m compileall -q contracts` | Passed |
| Frontend install | `npm ci` in root and `frontend/` | Passed; lockfiles committed |
| Strict TypeScript | `npm run typecheck` in `frontend/` | Passed |
| Frontend unit tests | `npm test` in `frontend/` | `15 passed`, including finalized simplified success and disagreement receipt cases |
| Production build | `npm run build` in `frontend/` | Passed |
| Browser smoke | `npm run test:e2e` in `frontend/` | `2 passed`: desktop and mobile navigation/form smoke |
| Runtime dependency audit | root `npm audit --omit=dev --audit-level=high`; frontend `npm audit --audit-level=high` | Passed with no high-severity runtime/frontend findings; required root CLI dev tree retains separately reported advisories |
| Secret scan | CI tracked-source grep excluding lockfiles | Clean |
| Source-matched deployment | Deployment tx [`0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b`](https://explorer-studio.genlayer.com/tx/0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b) | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`, registered source SHA match, address `0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f` |
| Initial readback | `get_project_count()`, `get_accounting()` | `0`; zero active escrow and zero dispatched |
| Current live successful lifecycle | StudioNet SDK writes + RPC reads | Project 2: three joins, three authored packets, cross-packet references, assembler omission, freeze, `MAJORITY_AGREE` evaluation, weights `[5,3,3]`, exact child/balance evidence |
| Current live incomplete/refund | StudioNet SDK writes + RPC reads | Project 1: incomplete criteria, first disagreement fail-closed, retry with unchanged digest, zero settlement weights, full sponsor refund child credited |
| Current live negative paths | StudioNet writes | Invalid unregistered packet references rolled back; no malformed packet entered state |
| Vercel production | Authorized direct-source deployment from repo root | Ready current alias [`creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app); HTTP `200`; Root Directory remains `frontend` |
| Connected wallet QA | Convert Chrome profile + injected Rabby EIP-1193 wallet | Wallet connected on StudioNet `61999`; live project list/detail, evidence, consensus, rewards, profile and creation-form state inspected; no redundant financial signature broadcast |

Direct Mode exercises validator callbacks and contract transitions but cannot prove production consensus or beneficiary balances. The live ledger proves those observations for the current source-matched deployment. Automated browser tests do not claim connected MetaMask QA; wallet QA remains a manual reviewer gate.
