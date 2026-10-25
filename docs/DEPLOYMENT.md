# Source-matched deployment and evidence ledger

This ledger is the authoritative deployment record for Creditsplit. It uses only StudioNet chain `61999`, RPC `https://studio.genlayer.com/api`, repository-local `genlayer@0.39.1`, `genlayer-js@1.1.8`, Python 3.12 and native GEN. No wallet secret is stored in the repository or Vercel.

## Authoritative current release

The current contract source last changed in [`3a745ab95795634769e9bd02993e58a52c10a71d`](https://github.com/ometere123/creditsplit/commit/3a745ab95795634769e9bd02993e58a52c10a71d). The current release branch is `main` at commit [`5e4c3b197130a3ffd81e9a1b203624291424ea6b`](https://github.com/ometere123/creditsplit/commit/5e4c3b197130a3ffd81e9a1b203624291424ea6b); later commits are documentation and production-link updates and do not alter `contracts/Creditsplit.py`.

| Item | Verified value |
| --- | --- |
| Network | StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api` |
| Current contract | [`0x03EEC54406D220ce484002A1A493d73D09b7F57C`](https://explorer-studio.genlayer.com/address/0x03EEC54406D220ce484002A1A493d73D09b7F57C) |
| Deployment transaction | [`0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f`](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f) |
| Deployment result | `FINALIZED`, `MAJORITY_AGREE`, leader execution `SUCCESS`; source registration succeeded |
| Current contract source SHA-256 | `794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818` |
| Registered source | `gen_getContractCode` decoded to exactly that SHA-256; 32,875 bytes |
| Initial readback | `get_project_count() = 0`; accounting had zero active escrow and zero dispatched GEN |
| Current Vercel alias | [`https://creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app) |
| Current CI | [GitHub Actions run 40201586105](https://github.com/ometere123/creditsplit/actions/runs/40201586105), successful on the exact release commit above |

Deployment command used for the current contract:

```text
npx --no-install genlayer deploy --contract contracts/Creditsplit.py --rpc https://studio.genlayer.com/api
```

The current registered schema responds with 17 methods: 5 views and 12 writes. No new contract is required for this documentation reconciliation.

## Chronological deployment history

These rows identify source-matched Creditsplit deployments. Addresses below the current row are historical and were not modified or used as the current frontend target.

| Status | Contract | Source commit before deployment | Source SHA-256 | Deployment transaction |
| --- | --- | --- | --- | --- |
| HISTORICAL | [`0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3`](https://explorer-studio.genlayer.com/address/0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3) | `897815d7ce7d0afcb297e3c530c2341359cdab94` | `4321A21BB8240445F0BC0EC4D4D26AFA2DA0A6D03FE71226030B39176D1C5B8D` | [`0x07d2c917d0c004836b8c8b20ce8501fb560cac1a3e4972c3157874e2c4c7ee28`](https://explorer-studio.genlayer.com/tx/0x07d2c917d0c004836b8c8b20ce8501fb560cac1a3e4972c3157874e2c4c7ee28) |
| HISTORICAL | [`0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD`](https://explorer-studio.genlayer.com/address/0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD) | `944f4643665e3c85edc2ae90471c24b6220409f6` | `5961AF1206D162BE60CE8756C2099B497FE81743924F7EB1393D893F5388551A` | [`0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe`](https://explorer-studio.genlayer.com/tx/0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe) |
| HISTORICAL | [`0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f`](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f) | `18042d55d1de610b9f87d914a0bef3bfd8c7545f` | `0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF` | [`0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b`](https://explorer-studio.genlayer.com/tx/0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b) |
| CURRENT | [`0x03EEC54406D220ce484002A1A493d73D09b7F57C`](https://explorer-studio.genlayer.com/address/0x03EEC54406D220ce484002A1A493d73D09b7F57C) | `3a745ab95795634769e9bd02993e58a52c10a71d` | `794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818` | [`0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f`](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f) |

The diagnostic-only contract [`0xF357362A1c1D725bC57B1F04e1c227D5532F94E9`](https://explorer-studio.genlayer.com/address/0xF357362A1c1D725bC57B1F04e1c227D5532F94E9), deployed by [`0x5d1f38ef1599f26419046673a0df7794a8f15cd8c95970a7ae83fb530d6db3b7`](https://explorer-studio.genlayer.com/tx/0x5d1f38ef1599f26419046673a0df7794a8f15cd8c95970a7ae83fb530d6db3b7), is not a Creditsplit release. Its deterministic `get_value() = 7` readback established that the pinned StudioNet deployment path can work.

## Current contract: project 1 browser funding

The first production write through the Vercel application in Convert Chrome with the injected Rabby EIP-1193 wallet was [`0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474`](https://explorer-studio.genlayer.com/tx/0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474). It targeted the current contract, finalized with `MAJORITY_AGREE`, successful execution and `value_credited=true`, and created project `1` with `10000000000000000` wei.

Direct readback identifies sponsor `0x23187bf36c9b935189cda33deeec6912bc2a211b`, the three CLI-wallet invitees, the three immutable criteria and `pool_wei=10000000000000000`. Project 1 remains `RECRUITING` with `0/3` joined; `recruit_due=1793110289` (`2026-10-27T14:11:29Z`). No recruitment refund has been broadcast or claimed. Refresh and reconnect in the production browser preserved the on-chain project state.

## Current contract: complete project 2 lifecycle

Every transaction in this section targets the current `0x03EEC...F57C` contract. The lifecycle was executed through the production Vercel application in Convert Chrome/Rabby while switching among the authorized sponsor and contributor wallets. The packets are actual text submitted on-chain; no external documents, GitHub files or evidence oracle were fetched.

| Step / method | Transaction hash(es) | Verified result |
| --- | --- | --- |
| `create_project_with_criteria` | [`0x6c1413bf1872e252588219eb9b6f708171041b452b388d1bcb240beaa11b1a9f`](https://explorer-studio.genlayer.com/tx/0x6c1413bf1872e252588219eb9b6f708171041b452b388d1bcb240beaa11b1a9f) | Project `2`, `10000000000000000` wei credited; `FINALIZED`, accepted consensus, successful execution |
| `join_project` A/B/C | [`0x413ba749de1303613d5564aaa5fb54869c56496c65d70799c4fea60add633f6f`](https://explorer-studio.genlayer.com/tx/0x413ba749de1303613d5564aaa5fb54869c56496c65d70799c4fea60add633f6f), [`0x5988167b8c82d31b4142b348fa659f7bdc198022f5bd440dac7ab3c94701231c`](https://explorer-studio.genlayer.com/tx/0x5988167b8c82d31b4142b348fa659f7bdc198022f5bd440dac7ab3c94701231c), [`0xfbf86f46d88aa08f3b0e221ef6630b656996e072fe372a68233542bb6d860ef4`](https://explorer-studio.genlayer.com/tx/0xfbf86f46d88aa08f3b0e221ef6630b656996e072fe372a68233542bb6d860ef4) | A/B/C joined; all parents finalized with successful execution |
| `submit_contribution_with_references` A/B/C | [`0xead46add14d4d0a71cf44a6283cf2f79e6d2f2b14c98b4973989c230c5e3a3fb`](https://explorer-studio.genlayer.com/tx/0xead46add14d4d0a71cf44a6283cf2f79e6d2f2b14c98b4973989c230c5e3a3fb), [`0xcf34db5e3fab62fa31f929d330a45a876ed32acd2962eb98442a7beda3a92423`](https://explorer-studio.genlayer.com/tx/0xcf34db5e3fab62fa31f929d330a45a876ed32acd2962eb98442a7beda3a92423), [`0x62f567be2be8e0121407bce96aa56447d00308f48686e20abf6000f67445c3d9`](https://explorer-studio.genlayer.com/tx/0x62f567be2be8e0121407bce96aa56447d00308f48686e20abf6000f67445c3d9) | Immutable packets `0:1`, `1:1`, `2:1`; B builds on A and C builds on A/B |
| `finish_contributing` A/B/C | [`0x40dd48c9740a0cade45391bf78763f0b6427084e0352404a537bad1035d08cb7`](https://explorer-studio.genlayer.com/tx/0x40dd48c9740a0cade45391bf78763f0b6427084e0352404a537bad1035d08cb7), [`0x0d9b8ef0ad52de1a8e138b2d505412e911b28458bbf9570aabe8807eef86de62`](https://explorer-studio.genlayer.com/tx/0x0d9b8ef0ad52de1a8e138b2d505412e911b28458bbf9570aabe8807eef86de62), [`0x41ce2f7d3d38ba6e6d96e1fde0e8537f78ec93a2e0c3a160bbbc0906a2fd8f31`](https://explorer-studio.genlayer.com/tx/0x41ce2f7d3d38ba6e6d96e1fde0e8537f78ec93a2e0c3a160bbbc0906a2fd8f31) | Contribution stage closed and assembly opened |
| `submit_final_artifact` | [`0x62a85063d6ab0a31cf3a7487e49e5f58b58c3c852ae41d29ea9183a815301349`](https://explorer-studio.genlayer.com/tx/0x62a85063d6ab0a31cf3a7487e49e5f58b58c3c852ae41d29ea9183a815301349) | Final text stored; `source_refs=[\"0:1\",\"1:1\",\"2:1\"]` |
| `respond_attribution` A/B/C | [`0x5c0e407a64dedeb75ab3eae815049bc34a6178be259625df5e26af25e9f099b2`](https://explorer-studio.genlayer.com/tx/0x5c0e407a64dedeb75ab3eae815049bc34a6178be259625df5e26af25e9f099b2), [`0xafbb448b3abd81d84359912163229ebf7dd264349471c8545349867a83d0ee9e`](https://explorer-studio.genlayer.com/tx/0xafbb448b3abd81d84359912163229ebf7dd264349471c8545349867a83d0ee9e), [`0x60400e425008ff85a4a2b7fc49764b1bb399bb8740a67e9c1f3d1c471c9d4cb6`](https://explorer-studio.genlayer.com/tx/0x60400e425008ff85a4a2b7fc49764b1bb399bb8740a67e9c1f3d1c471c9d4cb6) | All three acknowledgments stored. A prior duplicate C response [`0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221`](https://explorer-studio.genlayer.com/tx/0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221) finalized with GenVM `ERROR` because the response was already sealed; it changed no state and was not treated as success. |
| `freeze_project` | [`0xbeab879864346e7c80701747af32141126baf198a47d9b2136ea859f3598b120`](https://explorer-studio.genlayer.com/tx/0xbeab879864346e7c80701747af32141126baf198a47d9b2136ea859f3598b120) | Evidence frozen; digest `ecba62ae2847d1655194b6b94da9bc91839c9c9db4a4b42c1a3b1f9e4a95cfd6` |
| `evaluate_contributions` | [`0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde`](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde) | `FINALIZED`, `MAJORITY_AGREE`; leader execution `SUCCESS`; criteria `met/met/met`; accepted weights `[5,3,3]` |
| Finalization-triggered native `Send` children | A [`0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d`](https://explorer-studio.genlayer.com/tx/0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d), B [`0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3`](https://explorer-studio.genlayer.com/tx/0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3), C [`0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588`](https://explorer-studio.genlayer.com/tx/0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588) | Each is an Explorer `Send` from the contract, finalized `IN` at the beneficiary account. The contract state remains `SETTLEMENT_EMITTED` / `EMITTED_UNVERIFIED`; delivery is verified separately below. |

### Current project 2 readback and balance proof

The three frozen acceptance criteria were:

1. The final note explains the packet-specific attribution rule and its security purpose.
2. The final note uses concrete registered passages to distinguish original work, copied text and meaningful corrections.
3. The final note clearly attributes the accepted work and explains how the frozen evidence supports the conclusion.

The final `get_project(2)` readback was `SETTLEMENT_EMITTED`, `completion=true`, criteria `met/met/met`, weights `[5,3,3]`, amounts `4545454545454546`, `2727272727272727`, `2727272727272727` wei, and acknowledgments `[true,true,true]`. The frozen digest is the value above. The authenticated contributors were A `0x7e2a8d765e0e346c451109eb42d92f61FBdbfd4b`, B `0x1F21Be13E3Fd277C5D3115b7Fb8135de19A427F5` and C `0x9Fb5156D0befFbCE9489C69f4Ae84C8A129598e6`.

| Recipient | Allocated wei | Final RPC balance | Explorer proof |
| --- | ---: | ---: | --- |
| A | `4545454545454546` | `4545454545454546` wei (`0.004545454545454546 GEN`) | [account](https://explorer-studio.genlayer.com/address/0x7e2a8d765e0e346C451109eb42D92f61FBdbfd4b) shows incoming `0x2106...` |
| B | `2727272727272727` | `2727272727272727` wei (`0.002727272727272727 GEN`) | [account](https://explorer-studio.genlayer.com/address/0x1F21Be13E3Fd277C5D3115b7Fb8135de19A427F5) shows incoming `0xc89...` |
| C | `2727272727272727` | `2727272727272727` wei (`0.002727272727272727 GEN`) | [account](https://explorer-studio.genlayer.com/address/0x9Fb5156D0befFbCE9489C69f4Ae84C8A129598e6) shows incoming `0x22e...` |

The amounts sum exactly to the `10000000000000000` wei project pool. Current global accounting is `project_count=2`, `active_escrow_wei=10000000000000000` (project 1 remains recruiting) and `total_dispatched_wei=10000000000000000` (project 2). The contract label `EMITTED_UNVERIFIED` is intentionally conservative; this instance has independent Explorer `Send` and recipient-balance confirmation, but the protocol has no universal callback proving every future EOA delivery.

## Historical contract 0x49 evidence

The older `0x49a635...` deployment is **HISTORICAL**, not current. Its project 2 funded `90000000000000000` wei and evaluated with `[5,3,3]`; the old evaluation was [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8), with old child transfers [`0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875`](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [`0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345`](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [`0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03`](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03). Exact old balance deltas were `40909090909090910`, `24545454545454545`, and `24545454545454545` wei. These hashes target `0x49...`, not the current contract.

The same historical contract contains the incomplete-deliverable test: failed consensus [`0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b`](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), unchanged-evidence retry [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078), and sponsor refund child [`0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd`](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) for `90000000000000000` wei. This is not current-contract refund evidence.

## Earlier deployment-path attempts

Attempts [A](https://explorer-studio.genlayer.com/tx/0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86), [B](https://explorer-studio.genlayer.com/tx/0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd) and [C](https://explorer-studio.genlayer.com/tx/0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769) were zero-value `Send`-type submissions to the protocol consensus endpoint, not registered Creditsplit deployment transactions. Explorer/RPC evidence showed no contract-creation code, no validator assignment or round data, `NO_MAJORITY`, no contract address and no value credit. The later diagnostic and Creditsplit deployments succeeded through the pinned path, disproving a general StudioNet outage. The evidence supports an incorrect transaction/deployment pathway classification; the exact per-transaction encoding subcause remains unresolved because the old RPC did not expose the requested trace/lifecycle methods.

## Vercel production

The existing Vercel project `creditsplit` uses `frontend/` as its Root Directory and team `team_zqLSqTEYuxYTP42pCCst09F3`. The current production build points `NEXT_PUBLIC_CONTRACT_ADDRESS` at the current contract.

- Public alias: [`https://creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app)
- Current Ready deployment: [`https://creditsplit-1wpw7qnkm-delealufejoel-4184s-projects.vercel.app`](https://creditsplit-1wpw7qnkm-delealufejoel-4184s-projects.vercel.app)
- Inspect: [`https://vercel.com/delealufejoel-4184s-projects/creditsplit/3f8JPTkTEj96Mtd41kM2bhQhgzk9`](https://vercel.com/delealufejoel-4184s-projects/creditsplit/3f8JPTkTEj96Mtd41kM2bhQhgzk9)
- Status: `Ready`, Node `22.x`, public HTTP check `200`.

GitHub auto-deployment is not connected; this is the existing authorized direct-source project, not a replacement project. No frontend or contract deployment was performed for this documentation-only reconciliation.
