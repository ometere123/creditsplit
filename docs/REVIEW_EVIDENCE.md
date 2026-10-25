# Reviewer evidence ledger

This ledger separates source/test evidence from live StudioNet evidence. It does not self-certify portal scores.

## Source and implementation

- Contract implementation commit before deployment: [`18042d55d1de610b9f87d914a0bef3bfd8c7545f`](https://github.com/ometere123/creditsplit/commit/18042d55d1de610b9f87d914a0bef3bfd8c7545f).
- Release commit containing the frontend receipt fix, Node 22 pin and documentation closeout: [`48209010b867594d4d56fef6e8d3d30e2dd05195`](https://github.com/ometere123/creditsplit/commit/48209010b867594d4d56fef6e8d3d30e2dd05195). The contract file is unchanged after `18042d55`.
- GitHub Actions run for that exact release commit: [`40195814452`](https://github.com/ometere123/creditsplit/actions/runs/40195814452), completed successfully.
- Contract source SHA-256: `0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF`.
- The corrected source removes assembler citation as an economic veto, stores exact packet anchors and registration sequence, caps later exact duplicates at band `1`, and separates informational merit from incomplete-project settlement.
- Combined Python suite: `54 passed`; GenVM semantic lint: `17 methods`, `5 views`, `12 writes`; frontend: `15` Vitest tests, strict TypeScript, production build and `2` desktop/mobile Playwright smoke projects passed locally.
- Runtime/frontend dependency audits passed at high severity; the required root CLI development tree retains separately reported advisories and is not represented as vulnerability-free.
- Live packet text was authored directly by disposable wallets. It is on-chain wallet evidence, not proof of real-world identity or authorship.

## Deployment

- Network: StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Current contract: [`0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f`](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f).
- Deployment transaction: [`0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b`](https://explorer-studio.genlayer.com/tx/0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b), `FINALIZED`, `MAJORITY_AGREE`, five validator votes agreed, leader execution `SUCCESS`.
- `gen_getContractCode` decoded to 30,616 bytes with the exact committed SHA-256 above.
- Initial readback: `get_project_count()=0`; `get_accounting()={active_escrow_wei:"0",project_count:0,total_dispatched_wei:"0"}`.
- Historical contracts and their evidence remain untouched.

## Corrected live successful judgment

Project 2 funded `90000000000000000` wei and registered three distinct packets:

| Slot | Packet | Work and relationship |
| --- | --- | --- |
| A | `0:1` | Immutable packet/revision model; foundational work |
| B | `1:1` | Independent review dimensions; references `0:1` |
| C | `2:1` | Deterministic settlement/refund rule; references `0:1` and `1:1` |

The assembler's final artifact included all three passages but submitted only `source_refs=["0:1","2:1"]`, deliberately omitting B. The frozen digest was `c90c6fa749bb6db09f8197ee289d2012496148da1c7fac3bc8b0fc866ecd563a`. Evaluation [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8) finalized `MAJORITY_AGREE`, criteria `met/met/met`, accepted weights `[5,3,3]`, and assessments with evidence anchors for `0:1`, `1:1` and `2:1`. B's justification explicitly noted that its packet was materially valuable despite being omitted from `source_refs`.

The contract reconstructed amounts `[40909090909090910,24545454545454545,24545454545454545]` wei. Child transactions [`0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875`](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [`0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345`](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [`0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03`](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03) finalized with `value_credited=true`; exact RPC balance deltas matched all three amounts. The contract readback was `SETTLEMENT_EMITTED` / `EMITTED_UNVERIFIED`, so the balance checks are the delivery evidence.

## Incomplete completion and safe retry

Project 1 intentionally retained only A's useful packet and a final text that omitted two criteria. Evaluation [`0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b`](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b) finalized `MAJORITY_DISAGREE / ERROR` with no settlement change. A retry over the same frozen digest [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) finalized `MAJORITY_AGREE`, stored `completion=false`, criteria `["met","not_met","not_met"]`, informational weights `[5,0,0]`, settlement weights `[0,0,0]`, and no contributor payout. Refund child [`0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd`](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) finalized with `value_credited=true` to the sponsor for the full `90000000000000000` wei.

This demonstrates fail-closed disagreement, unchanged frozen evidence, safe later resolution, no double settlement and honest refund accounting. It does not establish a universal recovery guarantee for all future validator failures.

## Vercel and frontend

- Existing project: `creditsplit`, Root Directory `frontend`, no GitHub auto-deploy integration.
- Current production alias: [`https://creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app).
- Current Ready deployment inspect page: [`GhwmKjhwjDXyxcEogi4c2Ls6Sg8h`](https://vercel.com/delealufejoel-4184s-projects/creditsplit/GhwmKjhwjDXyxcEogi4c2Ls6Sg8h). The build used Node `22.x`.
- `NEXT_PUBLIC_CONTRACT_ADDRESS` was updated to the current address and the public URL returned HTTP `200` with discovery and wallet controls.
- The local frontend now recognizes the pinned SDK's simplified StudioNet success receipt, scopes pending transaction recovery by chain/wallet/contract/method/hash, clears permanently failed finalized transactions and refreshes on account/network changes.
- Connected MetaMask end-to-end QA was not claimed by the automated smoke suite; the Playwright evidence is desktop/mobile navigation and form coverage. Manual wallet QA should still be performed by the reviewer with funded disposable wallets.

## Prior evidence

The former contract, former `[5,3,1]` lifecycle and historical unresolved project remain documented in Git history and older deployment records. They are preserved as historical evidence, not mixed with the current source-matched address.

## Readiness assessment

- GenLayer Fit: strong evidence that independent nondeterministic consensus controls economically consequential attribution; no centralized adjudicator exists.
- Contract Quality: targeted fixes are implemented and live-tested; external EOA delivery remains callbackless and disagreement can remain fail-closed.
- Engineering: reproducible pinned tests, lint, source-matched deployment, live readbacks and the successful exact-SHA CI run above are evidenced.
- Frontend/UX: connected read/write paths and receipt recovery are implemented and built; automated connected-wallet browser QA remains a separately stated limitation.

Reviewers should inspect the source, final CI run, deployment receipt, project readbacks, parent/child records and recipient balances directly. This ledger does not award portal scores.
