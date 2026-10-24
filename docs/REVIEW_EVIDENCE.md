# Reviewer evidence ledger

This ledger separates reproducible source/CI evidence from live StudioNet evidence. It does not self-certify portal scores. The live collaboration below used synthetic packet strings submitted directly by disposable wallets; no external documents, URLs or contribution sources were fetched.

## Source and CI

- The pre-ledger source/CI gate passed at commit [`453373dbc5b380253c60dfccdd3882bbe5f37f9c`](https://github.com/ometere123/creditsplit/commit/453373dbc5b380253c60dfccdd3882bbe5f37f9c) in Actions run [`40069823199`](https://github.com/ometere123/creditsplit/actions/runs/40069823199). The exact commit and successful Actions run for this evidence ledger's final push are recorded in the completion report.
- `contracts/Creditsplit.py` Windows checkout SHA-256: `4321A21BB8240445F0BC0EC4D4D26AFA2DA0A6D03FE71226030B39176D1C5B8D`.
- The normalized Git blob SHA-256 is `8E668391F941A26E6C91215798A4BF8533FC4609EAB2AB641634168E25AF2405`; the difference is checkout CRLF versus Git LF normalization.
- Offline + Direct Mode: 35 Python tests passed locally. Frontend: 11 Vitest tests, strict TypeScript, production build and 2 Playwright smoke projects passed. Root runtime audit is clean; the full development tree retains advisories bundled by the required CLI and is documented rather than concealed.

## Deployment path

- Network: StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Diagnostic contract: [`0xF357362A1c1D725bC57B1F04e1c227D5532F94E9`](https://explorer-studio.genlayer.com/address/0xF357362A1c1D725bC57B1F04e1c227D5532F94E9), deployment [`0x5d1f38ef1599f26419046673a0df7794a8f15cd8c95970a7ae83fb530d6db3b7`](https://explorer-studio.genlayer.com/tx/0x5d1f38ef1599f26419046673a0df7794a8f15cd8c95970a7ae83fb530d6db3b7). It finalized `MAJORITY_AGREE`; `get_value()` returned `7` and registered source matched.
- Creditsplit contract: [`0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3`](https://explorer-studio.genlayer.com/address/0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3).
- Creditsplit deployment: [`0x07d2c917d0c004836b8c8b20ce8501fb560cac1a3e4972c3157874e2c4c7ee28`](https://explorer-studio.genlayer.com/tx/0x07d2c917d0c004836b8c8b20ce8501fb560cac1a3e4972c3157874e2c4c7ee28), `FINALIZED`, `MAJORITY_AGREE`, five validators committed/revealed, deployed source byte-equal to the checked-out source.
- Initial readback: `get_project_count() = 0`; `get_accounting() = {active_escrow_wei: "0", project_count: 0, total_dispatched_wei: "0"}`.

## Prior failed attempts

| Attempt | Evidence | Classification |
| --- | --- | --- |
| A | [`0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86`](https://explorer-studio.genlayer.com/tx/0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86) | Outer `FINALIZED · Send`, zero value, consensus-main recipient, no validators/rounds, `NO_MAJORITY`, no address |
| B | [`0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd`](https://explorer-studio.genlayer.com/tx/0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd) | Same pre-consensus failure pattern |
| C | [`0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769`](https://explorer-studio.genlayer.com/tx/0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769) | Same pattern; signed rollup payload contained the submitted source |

The diagnostic success proves these were not sufficient evidence of a network-wide consensus outage. The exact subcause of those individual attempts remains unresolved because the RPC does not expose the requested trace/lifecycle methods and no validator round existed to inspect.

## Live synthetic lifecycle

| Step | Transaction(s) / readback | Verified result |
| --- | --- | --- |
| Sponsor create/fund | `0x12b7d26ba00401d5969efdc789d60ba09ce472dcbd688e6426d7e791f0b66634` | 0.03 GEN escrow; project 1; active escrow `30000000000000000` wei |
| Join | A `0x8153d2e836b1abd68977fa3ce7883b530fe9c167e8df4d6f471dea794ec8867`; B `0x1f1b01e1636a2b3d3909d409ff50ca11087f523f0f2aca3cc31dc078b2d138f5`; C hash not recovered after RPC HTML error | State readback proves all three joined; C hash intentionally not invented |
| Packets + completion | A submit `0xb3b23b65084c029fb36e03bbbe5edecebf2f02307a6c8e7bb41e2379b3a8bb8b`, finish `0x914c44713b9702f6cfdfd9bafb2d6cfa209cf5667921618033caf8873e91d187`; B submit `0x8cfb7373e7f5aae2d3c76c446c02ec73c6ab4a3699a3de57c616b842bd1edcd7`, finish `0x157feeb5a9b48fdc975f4c50b4b9e8bbf808a59627455d55bc82006c7d58b351`; C submit `0xbff3934606ac0b886368975ed3abed8b2ef9391cfb16c6843b695aa5e4e6db0c`, finish `0x8112200558868ff11b6d8fc55f1b1ef3f028979cfa75a38d047ad932648da2f3` | All finalized `MAJORITY_AGREE`; project entered `ASSEMBLY` |
| Final artifact | `0x4e55f2fb5e66c87ee04d060ec9ee55ec9569094678140d4df4f8c56259fe107f` | Stored final text with source refs `0:1`, `1:1`, `2:1` |
| Attribution responses | A `0x15d17e224e81f9ed5a90cbdfffb65c910550034be248bb28e3a63c16d3700067`; B `0xa8d14e89973d1656d0d3780525ece3abbf8452be26d23413a00c5fa18e1f78c1`; C `0x0fdb2246bde57e67d0eb464bb873c93c41158159112d7f2cbaae538a42f16483` | All finalized; responses true |
| Freeze | `0x16b6b1d7b94d050c025699a906a1d9d9cf0ff8aaab80987f95c341365fce86bf` | Digest `a7fb6eb6a51280b52f74e31e12fd58e68f8de46b7ad82e6b65c0405ef4cd34a6`; status `FROZEN` |
| Evaluation | `0x2eea902eb1dda9a68a781a334d70082587740d739098ccbc5104364d642e67f7` | Finalized `MAJORITY_AGREE`; completion true; weights `[3,3,3]`; amounts `0.01 GEN` each |
| Child transfers | `0x7707c1c5fffaae735ed2116e4137a66bece36f34942215e702db49fc0b3eef1d`, `0x1efb955909a25592d92c6ad1524d2d3c7b7f285d174cbacb2d4fb62d3cdcdfe7`, `0x689f40de056cb28232213d2c3a4b30b13426015d762d9712a78bedaab7520f42` | Each finalized, EVM receipt status `0x1`, child result `NO_MAJORITY`; recipient balance proof is authoritative |
| Balance proof | Before: each recipient `0.1 GEN`; after: each `0.11 GEN` | `+0.01 GEN` confirmed for all three recipients |
| Reputation | SDK readback for all three wallets | Each `{projects: 1, points: 3, earned_wei: "10000000000000000"}` |

## Negative and incomplete evidence

- Replay/settlement rejection: [`0x23a73156d18bd41fd036e8e42336dab171ef5494d9fcec474b6eea1da75bd55b`](https://explorer-studio.genlayer.com/tx/0x23a73156d18bd41fd036e8e42336dab171ef5494d9fcec474b6eea1da75bd55b) finalized consensus but leader execution was `ERROR` with `frozen evidence required`; no child messages and no state mutation occurred. This demonstrates why `MAJORITY_AGREE` alone is not treated as successful execution.
- Live recruitment-refund and incomplete-deliverable-refund receipts are not claimed. The contract enforces wall-clock deadlines, so a legitimate live proof requires waiting for the relevant deadline; local Direct Mode covers both branches.
- No Vercel URL is claimed in this ledger until a production project is actually deployed and browser-tested against the verified address.
- Vercel blocker: project configuration and `NEXT_PUBLIC_CONTRACT_ADDRESS` were created, but the connected account received HTTP 403 for the GitHub integration scope `delealufejoel-4184s-projects` / team `team_zqLSqTEYuxYTP42pCCst09F3`. The Vercel connector explicitly requires the user to grant that team access; no public deployment URL is claimed.

## Review posture

The evidence supports a real GenLayer deployment, substantive nondeterministic evaluation, deterministic accounting and actual recipient balance increases. It does not prove external authorship because the live packets were synthetic. Reviewers should inspect the source, Direct Mode adversarial tests, explorer transactions, child messages and balances independently rather than relying on a claimed score.
