# Source-matched deployment and evidence ledger

This runbook uses only StudioNet chain `61999`, RPC `https://studio.genlayer.com/api`, repository-local `genlayer@0.39.1`, `genlayer-js@1.1.8`, Python 3.12 and native GEN. Never commit a wallet secret or configure one in Vercel.

## Verified deployment

The redesigned source was committed at [`944f4643665e3c85edc2ae90471c24b6220409f6`](https://github.com/ometere123/creditsplit/commit/944f4643665e3c85edc2ae90471c24b6220409f6) and deployed with:

```text
npx --no-install genlayer deploy --contract contracts/Creditsplit.py --rpc https://studio.genlayer.com/api
```

| Item | Verified value |
| --- | --- |
| Contract | [`0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD`](https://explorer-studio.genlayer.com/address/0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD) |
| Deployment transaction | [`0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe`](https://explorer-studio.genlayer.com/tx/0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe) |
| Consensus | `FINALIZED`, `MAJORITY_AGREE`, five validator votes revealed, leader/validator execution successful |
| Windows checkout source SHA-256 | `5961AF1206D162BE60CE8756C2099B497FE81743924F7EB1393D893F5388551A` |
| Registered source | `gen_getContractCode` decoded to the same SHA-256 and byte length `27612` |
| Initial readback | `get_project_count() = 0`; accounting has zero active escrow and zero dispatched funds |

The historical contract `0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3` is not modified and is not the frontend target.

## Prior deployment-path failures

Attempts A, B and C were zero-value outer `Send` transactions to the protocol consensus endpoint with no validator assignment, no round data, `NO_MAJORITY`, no contract address and no value credit. The RPC did not expose the requested trace/lifecycle methods, so the exact per-transaction encoding subcause cannot be proven. A minimal diagnostic deployment and the new Creditsplit deployment both succeeded through the pinned CLI/RPC path, disproving a general StudioNet outage. The destination seen in the earlier screenshot was not a registered Creditsplit IC.

## Reproducible gates

1. Confirm `git status --short` is empty and the intended commit is on `main`.
2. Confirm local versions: CLI `0.39.1`, SDK `1.1.8`, `genlayer-test==0.29.2`, `genvm-linter==0.11.0`, Node 22 and Python 3.12.
3. Run offline tests, Direct Mode and semantic linter with `GENVM_VERSION=v0.2.16`.
4. Select StudioNet and confirm chain ID `61999` and the RPC before signing.
5. Deploy the diagnostic contract only when investigating routing; inspect validator assignment and registered source.
6. Deploy Creditsplit only from the final committed source. A hash alone is not success: inspect finalization, execution result, source registration and initial reads.
7. After every write, record hash, `FINALIZED` status, consensus result, leader execution result and state readback.
8. For settlement, inspect every triggered child ID and its result, then verify beneficiary balances. `EMITTED_UNVERIFIED` is not a payment receipt.

## New live lifecycle ledger

All transactions below are on contract `0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD`; explorer links use `https://explorer-studio.genlayer.com/tx/<hash>`.

| Step | Transaction hash(es) | Verified result |
| --- | --- | --- |
| Sponsor create/fund | [`0x2c9ef5ab83848450bba21b712ca9e48fb6fcee8f9544fd5fc27edc8ac306b5e4`](https://explorer-studio.genlayer.com/tx/0x2c9ef5ab83848450bba21b712ca9e48fb6fcee8f9544fd5fc27edc8ac306b5e4) | `0.09 GEN`, value credited, project `1` |
| Joins A/B/C | [`0x5e5810115618202b7c6a7ee85f90af132cffd507e8b840fc857f686ea35f0195`](https://explorer-studio.genlayer.com/tx/0x5e5810115618202b7c6a7ee85f90af132cffd507e8b840fc857f686ea35f0195), [`0xeb056152434f6e475917db51983a2da3593d21068d86ad793bc4acc5e096454a`](https://explorer-studio.genlayer.com/tx/0xeb056152434f6e475917db51983a2da3593d21068d86ad793bc4acc5e096454a), [`0x1ad3c2410e525c7c9f614893c24dd88a6e55bf2c79551a5ea527aed34c343d24`](https://explorer-studio.genlayer.com/tx/0x1ad3c2410e525c7c9f614893c24dd88a6e55bf2c79551a5ea527aed34c343d24) | All `FINALIZED / MAJORITY_AGREE / SUCCESS`; all joined |
| Authored packets A/B/C | [`0xd50cfacb95b2fd26e859edf9695ee4573d2f29b0487d132c2779b92d11756a8f`](https://explorer-studio.genlayer.com/tx/0xd50cfacb95b2fd26e859edf9695ee4573d2f29b0487d132c2779b92d11756a8f), [`0xd3ed45621d6527efd1bf9c8cc881318471d5830820809ecfd449d3acd04b3e47`](https://explorer-studio.genlayer.com/tx/0xd3ed45621d6527efd1bf9c8cc881318471d5830820809ecfd449d3acd04b3e47), [`0xca607a81644f915652a729e4f892ae7f24ad7f10f9f6383763ab9c2de30d3d18`](https://explorer-studio.genlayer.com/tx/0xca607a81644f915652a729e4f892ae7f24ad7f10f9f6383763ab9c2de30d3d18) | Immutable texts stored; B references `0:1`; C references `0:1`, `1:1` |
| Completion A/B/C | [`0xfa229cd13d53cfc6fa6700e94674d9bc1d1a8e7fae9e0781f13d554995c9cb62`](https://explorer-studio.genlayer.com/tx/0xfa229cd13d53cfc6fa6700e94674d9bc1d1a8e7fae9e0781f13d554995c9cb62), [`0xb0aa8a22ef6dd0c1606e12d2da974b50d25b690323eaa060fa0a194282bdbe20`](https://explorer-studio.genlayer.com/tx/0xb0aa8a22ef6dd0c1606e12d2da974b50d25b690323eaa060fa0a194282bdbe20), [`0xaf17527d17a0707cb6ee75a4f2f627056f48258aef12721d56e9cb2162ddcca3`](https://explorer-studio.genlayer.com/tx/0xaf17527d17a0707cb6ee75a4f2f627056f48258aef12721d56e9cb2162ddcca3) | Assembly opened |
| Final artifact | [`0xea8020744ac733b8e7bbbbf6d7178348ae23ce4206377c77cad68735da188a8c`](https://explorer-studio.genlayer.com/tx/0xea8020744ac733b8e7bbbbf6d7178348ae23ce4206377c77cad68735da188a8c) | Final text stored with refs `0:1`, `1:1`, `2:1` |
| Attribution responses A/B/C | [`0x5dadaea928574607afbcdec0fcdc1aab2ee72dc45efae2bf1406755c0287349e`](https://explorer-studio.genlayer.com/tx/0x5dadaea928574607afbcdec0fcdc1aab2ee72dc45efae2bf1406755c0287349e), [`0xdb32de9df2309dba8d636ef5e40bf213493551a7f95191c2766aeff6a013132b`](https://explorer-studio.genlayer.com/tx/0xdb32de9df2309dba8d636ef5e40bf213493551a7f95191c2766aeff6a013132b), [`0xc0d36549194ba2e2034b8ff266c554851cf39c49627dfc9fd5734d0250d8f5cb`](https://explorer-studio.genlayer.com/tx/0xc0d36549194ba2e2034b8ff266c554851cf39c49627dfc9fd5734d0250d8f5cb) | All acknowledged |
| Freeze | [`0x9830aa726fa32209dba070a3a6328150b05e0c2c8a04bd459156db2267b4b80d`](https://explorer-studio.genlayer.com/tx/0x9830aa726fa32209dba070a3a6328150b05e0c2c8a04bd459156db2267b4b80d) | `FROZEN`; digest `8c8cc231d2525e7a9a2d7478f4594fa63d0d9bfe72f87d8f76615b544b483bf9` |
| Evaluation | [`0x0acf5f25de45815dcdd39546b3c6ac7fe04ddf3b948bd6109359986168b25ce3`](https://explorer-studio.genlayer.com/tx/0x0acf5f25de45815dcddf3b948bd6109359986168b25ce3) | `FINALIZED / MAJORITY_AGREE / SUCCESS`; criteria `met/met/met`; weights `[5,3,1]`; amounts `0.05/0.03/0.01 GEN` |
| Child transfers | [`0x2fd0309e631584037cf61fac7689489b8a67791ac3af5dfba060e0d4f42ac499`](https://explorer-studio.genlayer.com/tx/0x2fd0309e631584037cf61fac7689489b8a67791ac3af5dfba060e0d4f42ac499), [`0x493968bfcc746ff5ab9558961bf1d4cf2ccc89ff61f7cf828cc96313cdcc8812`](https://explorer-studio.genlayer.com/tx/0x493968bfcc746ff5ab9558961bf1d4cf2ccc89ff61f7cf828cc96313cdcc8812), [`0x2b119900f33263772d27c6b5f966b4f87964276327ec3b929f24f8cda5634a61`](https://explorer-studio.genlayer.com/tx/0x2b119900f33263772d27c6b5f966b4f87964276327ec3b929f24f8cda5634a61) | All `FINALIZED`; `value_credited=true`; child result `NO_MAJORITY`; balances are authoritative |
| Beneficiary balances | RPC readback | A `0.11→0.16`, B `0.11→0.14`, C `0.11→0.12 GEN`; deltas exactly match `[0.05,0.03,0.01]` |
| Final readback | `get_project(1)`, `get_accounting()`, `get_profile()` | Status `SETTLEMENT_EMITTED`, escrow `0`, dispatched `0.09 GEN`; profiles points `5/3/1` and earned amounts match |

## Adversarial live case

Project 2 was separately funded with `0.001 GEN`. The assembler submitted a forged final source reference `0:999` in [`0x9fb76a439b8544382155340eafdf998d43db3b58f47b0c6b0d5e47ccbd3d39a1`](https://explorer-studio.genlayer.com/tx/0x9fb76a439b8544382155340eafdf998d43db3b58f47b0c6b0d5e47ccbd3d39a1); it finalized with leader execution `ERROR`, and state remained `ASSEMBLY` with no final text. The assembler then submitted a valid but intentionally incomplete artifact. Evaluation [`0x3dbcf5c8c2d5d44b898cc0741e9a100a796f81f141237e1c4db00ddf3bcb9e24`](https://explorer-studio.genlayer.com/tx/0x3dbcf5c8c2d5d44b898cc0741e9a100a796f81f141237e1c4db00ddf3bcb9e24) finalized `MAJORITY_DISAGREE / ERROR`; no weights, refund, settlement or child transfer was created, and accounting correctly retained `1000000000000000` wei active escrow. A subsequent retry was not submitted because the RPC became unavailable before a transaction hash existed. This is an explicit unresolved/inconclusive project, not claimed as a refund.

## Vercel

The existing Vercel project uses `frontend/` as its root and only requires `NEXT_PUBLIC_CONTRACT_ADDRESS=0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD`. Production deployment is not claimed: the connected team `team_zqLSqTEYuxYTP42pCCst09F3` previously returned HTTP 403 while resolving the GitHub integration scope. Once that authorization is granted, deploy the existing project or use an authorized direct-source deployment; do not create a replacement project and do not place wallet secrets in frontend configuration.
