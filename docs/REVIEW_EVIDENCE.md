# Reviewer evidence ledger

This ledger separates source/test evidence from live StudioNet evidence. It does not self-certify portal scores.

## Source and implementation

- Implementation commit: [`944f4643665e3c85edc2ae90471c24b6220409f6`](https://github.com/ometere123/creditsplit/commit/944f4643665e3c85edc2ae90471c24b6220409f6).
- Contract source SHA-256: `5961AF1206D162BE60CE8756C2099B497FE81743924F7EB1393D893F5388551A`.
- The contract now stores exactly three acceptance criteria, actual immutable packet text, bounded cross-packet references, final source references and attribution responses. The leader/validator output contains no weights or payment amounts; the contract derives `[0,1,3,5]` bands deterministically.
- Python: 44 combined offline + Direct Mode tests passed. GenVM semantic lint passed with 17 methods, 5 views and 12 writes. Frontend: 12 Vitest tests, strict TypeScript, production build and 2 Playwright desktop/mobile smoke projects passed.
- The test packets below are authored directly by disposable wallets. No external documents or contribution sources were fetched; this is on-chain authorship evidence for the registered wallets, not proof of identity outside the chain.

## Deployment

- Network: StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- New contract: [`0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD`](https://explorer-studio.genlayer.com/address/0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD).
- Deployment: [`0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe`](https://explorer-studio.genlayer.com/tx/0x0291a6fc1967b16b2479dce2bd26a5d3febbb0a06e43b8336e0f13dda6ad6dbe), `FINALIZED`, `MAJORITY_AGREE`, five validator votes revealed, successful leader/validator execution.
- `gen_getContractCode` decoded byte-for-byte to the committed source SHA-256. Initial readback: `get_project_count() = 0`; `get_accounting() = {active_escrow_wei:"0", project_count:0, total_dispatched_wei:"0"}`.
- Historical contract `0xB8d8Cc8384a0eaeFFC7998521E2a4fFD8deFC5C3` was not modified.

## Completed evidence-based lifecycle

Project 1 was funded with `0.09 GEN` by the sponsor and used three distinct contributor wallets. The immutable on-chain packets were:

- A / `0:1`: foundational trust-boundary map.
- B / `1:1`: a technical correction separating escrow, allocation, transfer emission, child execution and beneficiary balance confirmation; it referenced `0:1`.
- C / `2:1`: integration/editorial work referencing `0:1` and `1:1`.

The assembler's final text cited all three packet IDs. The frozen digest was `8c8cc231d2525e7a9a2d7478f4594fa63d0d9bfe72f87d8f76615b544b483bf9`. The finalized evaluation stored `criteria_status=["met","met","met"]`, assessments `foundational/substantial/supporting`, weights `[5,3,1]`, and amounts `[50000000000000000,30000000000000000,10000000000000000]` wei. The leader and validators—not the sponsor or frontend—controlled that judgment.

The evaluation transaction is [`0x0acf5f25de45815dcdd39546b3c6ac7fe04ddf3b948bd6109359986168b25ce3`](https://explorer-studio.genlayer.com/tx/0x0acf5f25de45815dcdd39546b3c6ac7fe3b948bd6109359986168b25ce3). Its three triggered messages were:

| Recipient | Child transaction | Value | Verified balance delta |
| --- | --- | ---: | ---: |
| A | [`0x2fd0309e631584037cf61fac7689489b8a67791ac3af5dfba060e0d4f42ac499`](https://explorer-studio.genlayer.com/tx/0x2fd0309e631584037cf61fac7689489b8a67791ac3af5dfba060e0d4f42ac499) | `0.05 GEN` | `0.11 → 0.16 GEN` |
| B | [`0x493968bfcc746ff5ab9558961bf1d4cf2ccc89ff61f7cf828cc96313cdcc8812`](https://explorer-studio.genlayer.com/tx/0x493968bfcc746ff5ab9558961bf1d4cf2ccc89ff61f7cf828cc96313cdcc8812) | `0.03 GEN` | `0.11 → 0.14 GEN` |
| C | [`0x2b119900f33263772d27c6b5f966b4f87964276327ec3b929f24f8cda5634a61`](https://explorer-studio.genlayer.com/tx/0x2b119900f33263772d27c6b5f966b4f87964276327ec3b929f24f8cda5634a61) | `0.01 GEN` | `0.11 → 0.12 GEN` |

Each child finalized and reported `value_credited=true`; the child consensus label was `NO_MAJORITY`, so the balance deltas—not the parent `EMITTED_UNVERIFIED` label—are the payment proof. Final accounting readback was `active_escrow_wei=0` and `total_dispatched_wei=90000000000000000`; profiles recorded points `5/3/1` and matching allocated amounts.

## Adversarial case

Project 2 used a separate `0.001 GEN` pool and an impossible third criterion. The assembler's forged source reference transaction [`0x9fb76a439b8544382155340eafdf998d43db3b58f47b0c6b0d5e47ccbd3d39a1`](https://explorer-studio.genlayer.com/tx/0x9fb76a439b8544382155340eafdf998d43db3b58f47b0c6b0d5e47ccbd3d39a1) finalized with leader execution `ERROR`; state remained `ASSEMBLY`, with no final text. After a valid but incomplete artifact, evaluation [`0x3dbcf5c8c2d5d44b898cc0741e9a100a796f81f141237e1c4db00ddf3bcb9e24`](https://explorer-studio.genlayer.com/tx/0x3dbcf5c8c2d5d44b898cc0741e9a100a796f81f141237e1c4db00ddf3bcb9e24) reached `FINALIZED / MAJORITY_DISAGREE / ERROR`; no payout fields or child transfers were written and the `0.001 GEN` remained active escrow. A second retry was not submitted because the RPC failed before producing a hash.

## Earlier deployment failures

Attempts [A](https://explorer-studio.genlayer.com/tx/0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86), [B](https://explorer-studio.genlayer.com/tx/0x144c2cba41795aa9792c1bfb74d63575a4274a9c7bd4aab51ef8bd163915d3dd) and [C](https://explorer-studio.genlayer.com/tx/0x090f3314d1fa3f3bd2a8732a91e340e1f6098b89445e6d175ad11a2313569769) were zero-value `Send`-type submissions with no validator assignment, no round data, `NO_MAJORITY`, no registered contract address and no value credit. The minimal diagnostic and current deployment later succeeded, establishing that the shared deployment path can work. The exact subcause of the earlier individual transactions remains unresolved because the RPC exposed no trace/lifecycle methods for them.

## Incomplete external gates

- Live recruitment-expiry and incomplete-deliverable refund receipts were not claimed; StudioNet deadlines are wall-clock enforced and the adversarial project intentionally remains frozen after an inconclusive judgment.
- No Vercel public URL is claimed. The existing team `team_zqLSqTEYuxYTP42pCCst09F3` previously returned HTTP 403 for the GitHub integration scope. Deployment requires that authorization or an authorized direct-source path.
- No GitHub Actions URL is claimed for the final implementation commit until the remote workflow completes; local checks above are the evidence currently available.

Reviewers should inspect the source, tests, deployment receipt, project readbacks, child transaction records and recipient balances directly. The evidence supports a real source-matched deployment and an evidence-based live judgment; it does not justify automatic 5/5/5/5 scores.
