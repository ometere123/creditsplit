# Source-matched deployment and evidence ledger

This runbook uses only StudioNet chain `61999`, RPC `https://studio.genlayer.com/api`, repository-local `genlayer@0.39.1`, `genlayer-js@1.1.8`, Python 3.12 and native GEN. No wallet secret is stored in the repository or Vercel.

## Current verified deployment

The corrected contract implementation was committed on `main` at [`18042d55d1de610b9f87d914a0bef3bfd8c7545f`](https://github.com/ometere123/creditsplit/commit/18042d55d1de610b9f87d914a0bef3bfd8c7545f) before deployment. The final frontend receipt-compatibility fix and release documentation are committed after that source deployment; the contract file itself is unchanged, so its source hash remains source-matched.

Deployment command:

```text
npx --no-install genlayer deploy --contract contracts/Creditsplit.py --rpc https://studio.genlayer.com/api
```

| Item | Verified value |
| --- | --- |
| Contract | [`0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f`](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f) |
| Deployment transaction | [`0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b`](https://explorer-studio.genlayer.com/tx/0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b) |
| Status | `FINALIZED`, `MAJORITY_AGREE`, five validator votes `AGREE`, leader execution `SUCCESS` |
| Contract source SHA-256 | `0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF` |
| Registered source | `gen_getContractCode` decoded to exactly the same SHA-256; 30,616 bytes |
| Initial readback | `get_project_count() = 0`; accounting `{active_escrow_wei:"0", project_count:0, total_dispatched_wei:"0"}` |

The old contract `0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD` and earlier historical contract `0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3` remain historical evidence and were not modified. The frontend target is only the current address above.

## Corrected live lifecycle: successful completion

All transactions below are on the current contract. Project 2 used three separate disposable contributor wallets and authored packets directly on-chain. No external files or contribution sources were fetched.

| Step | Transaction hash(es) | Verified result |
| --- | --- | --- |
| Sponsor create/fund | [`0x52e70cf22b0eef5bb280b051d7188d48261d7271da254b30a841d78377d80d52`](https://explorer-studio.genlayer.com/tx/0x52e70cf22b0eef5bb280b051d7188d48261d7271da254b30a841d78377d80d52) | Project `2`, `90000000000000000` wei credited; `FINALIZED / MAJORITY_AGREE / SUCCESS` |
| Joins A/B/C | [`0xb7951de278090fe93912173c0c8dfdc209e749c160692b5cddb57957ac97f3ea`](https://explorer-studio.genlayer.com/tx/0xb7951de278090fe93912173c0c8dfdc209e749c160692b5cddb57957ac97f3ea), [`0x766ab1f503d09539f68af0134916c5cae394d6ebb206c4690e4215dfd84774c4`](https://explorer-studio.genlayer.com/tx/0x766ab1f503d09539f68af0134916c5cae394d6ebb206c4690e4215dfd84774c4), [`0x64b7558a8e77dbe79e92f33005b44361c01c190b37d6cb90aa8fd27a35447c0f`](https://explorer-studio.genlayer.com/tx/0x64b7558a8e77dbe79e92f33005b44361c01c190b37d6cb90aa8fd27a35447c0f) | All joined; each parent finalized with successful execution |
| Authored packets A/B/C | [`0x4d7407bb2296869472d35f16eba8832e8905f7244a56e1095ca54bdf3a1f927e`](https://explorer-studio.genlayer.com/tx/0x4d7407bb2296869472d35f16eba8832e8905f7244a56e1095ca54bdf3a1f927e), [`0x24699ac5cca13895763f4ad8ab30c7b27df7e0fce655181621403d6282724f38`](https://explorer-studio.genlayer.com/tx/0x24699ac5cca13895763f4ad8ab30c7b27df7e0fce655181621403d6282724f38), [`0x2228ca0e637ee5da7c572bcdd8efd29b15fa9e0aee6227ae5b8ad85922f71e62`](https://explorer-studio.genlayer.com/tx/0x2228ca0e637ee5da7c572bcdd8efd29b15fa9e0aee6227ae5b8ad85922f71e62) | A `0:1`; B `1:1` references A; C `2:1` references A and B; all immutable packets stored |
| Completion A/B/C | [`0x25735978c59c6107d9222d2fd9cd2b253a35bd4b18603fb9a36ee5f32a7d1e91`](https://explorer-studio.genlayer.com/tx/0x25735978c59c6107d9222d2fd9cd2b253a35bd4b18603fb9a36ee5f32a7d1e91), [`0x90da5a3f2f6b4559ffdfb1b883dc801b40b0afafa2f86c47f352f38ec173a9d2`](https://explorer-studio.genlayer.com/tx/0x90da5a3f2f6b4559ffdfb1b883dc801b40b0afafa2f86c47f352f38ec173a9d2), [`0x80a087ca2d7049d5ca10b05e168a454c2affedc8377b2fa84f188b66503d16e9`](https://explorer-studio.genlayer.com/tx/0x80a087ca2d7049d5ca10b05e168a454c2affedc8377b2fa84f188b66503d16e9) | Assembly opened |
| Final artifact | [`0x6c363342541bb325b70683044f4e69f02a20f2f830423bfaf87524e484ddd81c`](https://explorer-studio.genlayer.com/tx/0x6c363342541bb325b70683044f4e69f02a20f2f830423bfaf87524e484ddd81c) | Final text includes all three passages; source refs intentionally omit B (`[0:1,2:1]`) |
| Attribution responses A/B/C | [`0x23347a4fadb71521a69e31330499ed9216be149536fc6598e44d52098344ba21`](https://explorer-studio.genlayer.com/tx/0x23347a4fadb71521a69e31330499ed9216be149536fc6598e44d52098344ba21), [`0xcc8698ac6fe490a09b8de35cc9d936e8b90e17957c9d281757c49813e5c0ecbb`](https://explorer-studio.genlayer.com/tx/0xcc8698ac6fe490a09b8de35cc9d936e8b90e17957c9d281757c49813e5c0ecbb), [`0x55a342cb650d52e7b4bc7c9ea68f0f04dd402e426c90e3dc83fb750089f7b307`](https://explorer-studio.genlayer.com/tx/0x55a342cb650d52e7b4bc7c9ea68f0f04dd402e426c90e3dc83fb750089f7b307) | All acknowledged |
| Freeze | [`0xc3b02fc093bf2896a6efb73101f5ed59b76451a8b8f967fa9b9457d3a0b7860b`](https://explorer-studio.genlayer.com/tx/0xc3b02fc093bf2896a6efb73101f5ed59b76451a8b8f967fa9b9457d3a0b7860b) | `FROZEN`; digest `c90c6fa749bb6db09f8197ee289d2012496148da1c7fac3bc8b0fc866ecd563a` |
| Evaluation | [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8) | `FINALIZED / MAJORITY_AGREE`; criteria `met/met/met`; accepted weights `[5,3,3]`; informational weights `[5,3,3]` |
| Child transfers | [`0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875`](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [`0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345`](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345), [`0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03`](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03) | All `FINALIZED`, `value_credited=true`; recipient balances changed by the exact contract allocations |

### Allocation and balance proof

| Recipient | Contract amount (wei) | Balance before | Balance after | Delta |
| --- | ---: | ---: | ---: | ---: |
| A | `40909090909090910` | `160000000000000000` | `200909090909090910` | `40909090909090910` |
| B | `24545454545454545` | `140000000000000000` | `164545454545454545` | `24545454545454545` |
| C | `24545454545454545` | `120000000000000000` | `144545454545454545` | `24545454545454545` |

The contract readback after project 2 was `SETTLEMENT_EMITTED`, `amounts_wei` exactly as above, and `settlement=EMITTED_UNVERIFIED`. Final accounting after the refund below was `active_escrow_wei=0` and `total_dispatched_wei=180000000000000000`.

## Incomplete deliverable, consensus retry and refund

Project 1 deliberately used only A's packet and a final text that explicitly omitted the review and settlement requirements. The first evaluation [`0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b`](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b) finalized `MAJORITY_DISAGREE / ERROR`; no state or escrow changed. The retry [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) used the same frozen digest `923b120d056690b007c0045e1d7e924985f60653c82c5036bfe6e20c390f948a`, finalized `MAJORITY_AGREE`, recorded informational weights `[5,0,0]`, forced settlement weights to `[0,0,0]`, and emitted the full sponsor refund.

Refund child [`0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd`](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) finalized with `value_credited=true` to the sponsor for `90000000000000000` wei. This is a verified incomplete-deliverable refund, not a recruitment-expiry refund.

## Historical deployment-path investigation

Attempts [A](https://explorer-studio.genlayer.com/tx/0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86), [B](https://explorer-studio.genlayer.com/tx/0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd) and [C](https://explorer-studio.genlayer.com/tx/0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769) were zero-value `Send`-type submissions to the protocol endpoint: no validator assignment, no round data, `NO_MAJORITY`, no contract address and no value credit. A minimal diagnostic deployment and the current Creditsplit deployment succeeded through the pinned CLI/RPC path, so a general StudioNet outage was disproven. The exact individual encoding subcause remains unresolved because the older RPC did not expose the requested trace/lifecycle methods. The screenshot destination was the protocol consensus endpoint, not a registered Creditsplit IC.

## Vercel

The existing Vercel project `creditsplit` uses `frontend/` as its Root Directory. The current environment points `NEXT_PUBLIC_CONTRACT_ADDRESS` to the current contract above. Authorized direct-source production deployment completed successfully:

- Public alias: [`https://creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app)
- Current deployment: [`https://creditsplit-iartng2c8-delealufejoel-4184s-projects.vercel.app`](https://creditsplit-iartng2c8-delealufejoel-4184s-projects.vercel.app)
- Inspect: [`https://vercel.com/delealufejoel-4184s-projects/creditsplit/GhwmKjhwjDXyxcEogi4c2Ls6Sg8h`](https://vercel.com/delealufejoel-4184s-projects/creditsplit/GhwmKjhwjDXyxcEogi4c2Ls6Sg8h)
- Status: `Ready`; the build used Node `22.x`, and the public HTTP check returned `200` with discovery/wallet controls.

GitHub auto-deployment is not connected; this is the existing authorized direct-source project, not a replacement Vercel project.
