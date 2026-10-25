# Escrow and deterministic GEN arithmetic

- Native GEN is denominated in `10^18` wei; the contract uses `u256` aggregate accounting.
- Every funded project increases `active_escrow` exactly once by `gl.message.value`.
- A successful evaluation or eligible unstarted refund decreases active escrow by that project's full principal and increments `total_dispatched` by the same amount.
- On a passing evaluation, accepted `weight_i ∈ {0,1,3,5}` and `sum(weights)>0`; `amount_i=floor(pool*weight_i/sum(weights))`, with the integer remainder assigned to the highest weight and lowest slot on ties. The contract, never the model, reconstructs the amounts and `sum(amount_i)==pool`.
- On an incomplete evaluation, informational contribution merit is retained in the decision for auditability, but settlement weights and amounts are `[0,0,0]` and the sponsor receives the full pool.
- A failed or inconclusive evaluation does not change escrow, payout fields or settlement state. A later evaluation can retry the same frozen digest; no sponsor-only cancellation, administrator rescue or manual claim path exists.
- There is no owner rescue, hidden commission, manual payout claim, sponsor-controlled allocation or wallet-based fee skim.
- Finalization emits EOA GEN messages. `EMITTED_UNVERIFIED` means only that the contract reached a terminal state and emitted messages; it does not prove child execution or beneficiary credit. Inspect each child transaction and balance delta. There is no blind automatic resend.
- Protocol fees are distinct from the locked project pool and must be funded by initiating wallets. The browser passes the sponsor value separately from the SDK-estimated network fee.
- Reputation `earned_wei` records contract allocations/dispatched amounts, not an independent proof of EOA receipt. The frontend labels this distinction.

## Current live accounting evidence

The current source-matched deployment is [`0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f`](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f). Project 2 funded `90000000000000000` wei and finalized with weights `[5,3,3]` and amounts:

```text
A 40909090909090910 wei
B 24545454545454545 wei
C 24545454545454545 wei
```

The parent evaluation is [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8). Triggered child messages [`0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875`](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [`0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345`](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [`0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03`](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03) all finalized with `value_credited=true`. Despite child `result_name=NO_MAJORITY`, exact beneficiary balance deltas were:

| Recipient | Before | After | Delta |
| --- | ---: | ---: | ---: |
| A | `160000000000000000` | `200909090909090910` | `40909090909090910` |
| B | `140000000000000000` | `164545454545454545` | `24545454545454545` |
| C | `120000000000000000` | `144545454545454545` | `24545454545454545` |

Project 1 was intentionally incomplete. After one failed consensus and one safe retry, the refund parent [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) emitted refund child [`0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd`](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) of `90000000000000000` wei to the sponsor with `value_credited=true`. Final readback after both projects was `active_escrow_wei=0` and `total_dispatched_wei=180000000000000000`.

Historical deployment and settlement records remain in `docs/DEPLOYMENT.md`; they are not the current frontend target.
