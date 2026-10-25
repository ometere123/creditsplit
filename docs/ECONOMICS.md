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

Current contract: [0x03EEC54406D220ce484002A1A493d73D09b7F57C](https://explorer-studio.genlayer.com/address/0x03EEC54406D220ce484002A1A493d73D09b7F57C).

Project 2 funded 10000000000000000 wei, completed all three criteria, and finalized with weights [5,3,3]. The deterministic amounts were:

| Recipient | Weight | Amount |
| --- | ---: | ---: |
| A | 5 | 4545454545454546 wei |
| B | 3 | 2727272727272727 wei |
| C | 3 | 2727272727272727 wei |

The evaluation is [0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde). Triggered native Send children are A [0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d](https://explorer-studio.genlayer.com/tx/0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d), B [0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3](https://explorer-studio.genlayer.com/tx/0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3) and C [0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588](https://explorer-studio.genlayer.com/tx/0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588). Each appears as a finalized incoming Explorer Send, and direct RPC balances equal the corresponding allocations:

| Recipient | Final RPC balance |
| --- | ---: |
| A | 4545454545454546 wei (0.004545454545454546 GEN) |
| B | 2727272727272727 wei (0.002727272727272727 GEN) |
| C | 2727272727272727 wei (0.002727272727272727 GEN) |

This is instance-level delivery evidence; the contract still exposes EMITTED_UNVERIFIED because the protocol has no universal child-transfer callback.

Project 1 is a separate current-contract browser-funded project with 10000000000000000 wei. It remains RECRUITING with no joined contributors and a recruitment due time of 2026-10-27T14:11:29Z. No recruitment refund or payout has been broadcast.

## Historical live accounting evidence

The prior source-matched deployment was [0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f), source SHA 0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF. Its project 2 funded 90000000000000000 wei and finalized with [5,3,3]. The old parent evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8), and old child sends were [0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03). Exact old beneficiary deltas were 40909090909090910, 24545454545454545 and 24545454545454545 wei.

That same historical deployment contains the incomplete-deliverable case: failed evaluation [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), unchanged-evidence retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078), and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) for the full old pool. These records are historical and are not current-contract refund evidence.
