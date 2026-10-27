# Escrow and deterministic GEN arithmetic

- Native GEN is denominated in 10^18 wei; the contract uses u256 aggregate accounting.
- Every funded project increases active_escrow exactly once by gl.message.value.
- A successful evaluation or eligible unstarted refund decreases active escrow by that project's full principal and increments total_dispatched by the same amount.
- On a passing evaluation, accepted weight_i is one of 0, 1, 3 or 5 and the sum is positive. The contract computes amount_i=floor(pool*weight_i/sum(weights)); the integer remainder goes to the highest weight and lowest slot on ties. The model never supplies amounts or recipients.
- On an incomplete evaluation, informational contribution merit is retained for auditability, but settlement weights and amounts are [0,0,0] and the sponsor receives the full pool.
- A failed or inconclusive evaluation does not change escrow, payout fields or settlement state. A later evaluation may retry the same frozen digest; there is no sponsor-only cancellation, administrator rescue or manual claim path.
- There is no owner rescue, hidden commission, manual payout claim, sponsor-controlled allocation or wallet-based fee skim.
- Finalization emits EOA GEN messages. EMITTED_UNVERIFIED means only that the contract reached a terminal state and emitted messages; it does not prove child execution or beneficiary credit. Inspect each child transaction and balance delta. There is no blind automatic resend.
- Protocol fees are distinct from the locked project pool and must be funded by initiating wallets. The browser passes sponsor value separately from the SDK-estimated network fee.
- Reputation earned_wei records contract allocations/dispatched amounts, not independent proof of EOA receipt. The frontend labels this distinction.

## Current hardened deployment

Current contract: [0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44](https://explorer-studio.genlayer.com/address/0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44), source SHA-256 `ED1E43BD4E32056ADF6D6DD0ED6CA0F126887391A4FC53D159A1644AF92C226F`.

The current verified-source project 1 funded `1000000000000000` wei, completed all three criteria, and finalized with weights [5,3,3]. The deterministic recorded allocations were:

| Recipient | Weight | Amount |
| --- | ---: | ---: |
| A | 5 | 454545454545456 wei |
| B | 3 | 272727272727272 wei |
| C | 3 | 272727272727272 wei |

The evaluation is [0xcaa3c9510c92ad90be77f10848f70654e29ae25011eb5219f91503b0c8349ecb](https://explorer-studio.genlayer.com/tx/0xcaa3c9510c92ad90be77f10848f70654e29ae25011eb5219f91503b0c8349ecb). Triggered sends are A [0x845d62ccb2cd588ed779193f0af9d64ca28ad84eb5e53c769f1a6c731bfea658](https://explorer-studio.genlayer.com/tx/0x845d62ccb2cd588ed779193f0af9d64ca28ad84eb5e53c769f1a6c731bfea658), B [0x50c57fe8a239fe159d014de0ed7a0fd864506a64fe923190bbaf8de0991df3e0](https://explorer-studio.genlayer.com/tx/0x50c57fe8a239fe159d014de0ed7a0fd864506a64fe923190bbaf8de0991df3e0) and C [0xc35c8ebd93fa5aef60263527d3f4e26a8a1864ef809975bfad7fac8b80fda444](https://explorer-studio.genlayer.com/tx/0xc35c8ebd93fa5aef60263527d3f4e26a8a1864ef809975bfad7fac8b80fda444). All three child receipts finalized `NO_MAJORITY`, so no recipient balance credit is claimed for this current run:

| Recipient | Final RPC balance |
| --- | ---: |
| A | No verified credit in this run |
| B | No verified credit in this run |
| C | No verified credit in this run |

The contract correctly exposes `EMITTED_UNVERIFIED`: the parent allocated and emitted messages, but child consensus did not execute those transfers. This demonstrates why the frontend must distinguish allocation, emission and beneficiary credit.

The successful native payout for 0.01 GEN is preserved below as historical `0x03EEC...` evidence. The current source-verified project is not used to claim a successful payout.

## Historical 0x03EEC payout evidence

The previous hardened deployment `0x03EEC54406D220ce484002A1A493d73D09b7F57C` (source SHA `794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818`) remains historical. Its project 2 evaluation [`0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde`](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde) recorded [5,3,3] over a `10000000000000000` wei pool. The child sends were [`0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d`](https://explorer-studio.genlayer.com/tx/0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d), [`0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3`](https://explorer-studio.genlayer.com/tx/0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3) and [`0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588`](https://explorer-studio.genlayer.com/tx/0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588), with independently observed beneficiary balances equal to `4545454545454546`, `2727272727272727` and `2727272727272727` wei. These are not current-contract results.

## Historical live accounting evidence

The prior source-matched deployment was [0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f), source SHA 0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF. Its project 2 funded 90000000000000000 wei and finalized with [5,3,3]. The old parent evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8), and old child sends were [0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03). Exact old beneficiary deltas were 40909090909090910, 24545454545454545 and 24545454545454545 wei.

That same historical deployment contains the incomplete-deliverable case: failed evaluation [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), unchanged-evidence retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078), and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) for the full old pool. These records are historical and are not current-contract refund evidence.
