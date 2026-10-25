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
| Source-matched deployment | Deployment tx [`0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f`](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f) | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`, registered source SHA match, address `0x03EEC54406D220ce484002A1A493d73D09b7F57C` |
| Initial readback | `get_project_count()`, `get_accounting()` | `0`; zero active escrow and zero dispatched |
| Current live successful lifecycle | StudioNet SDK writes + RPC reads | Project 2: three joins, three authored packets, cross-packet references, assembler omission, freeze, `MAJORITY_AGREE` evaluation, weights `[5,3,3]`, exact child/balance evidence |
| Current live incomplete/refund | StudioNet SDK writes + RPC reads | Project 1: incomplete criteria, first disagreement fail-closed, retry with unchanged digest, zero settlement weights, full sponsor refund child credited |
| Current live negative paths | StudioNet writes | Invalid unregistered packet references rolled back; no malformed packet entered state |
| Vercel production | Authorized direct-source deployment `dpl_3f8JPTkTEj96Mtd41kM2bhQhgzk9` | Ready current alias [`creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app); Root Directory `frontend`, Node `22.x`, new contract address visible in the detail view |
| Connected wallet QA | Convert Chrome profile + injected Rabby EIP-1193 wallet | Sponsor connected on StudioNet `61999`; real create-and-fund form signed `0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474`; finalized readback showed project `1`, `0.01 GEN`, correct invitees/criteria; refresh, reconnect, discovery and detail readback passed. Contributor wallet switching and signing were not available in this profile and are not claimed. |

Direct Mode exercises validator callbacks and contract transitions but cannot prove production consensus or beneficiary balances. The historical live ledger proves those observations for the prior source-matched deployment. Convert Chrome/Rabby QA proves one real sponsor browser write and refresh/readback on the hardened deployment; contributor wallet switching and full browser lifecycle remain untested in this profile.
