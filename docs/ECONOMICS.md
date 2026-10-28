# Escrow and deterministic GEN arithmetic

- Native GEN is denominated in 10^18 wei; the contract uses u256 aggregate accounting.
- Every funded project increases active_escrow exactly once by gl.message.value.
- A successful evaluation or eligible unstarted refund decreases active escrow by that project's full principal and increments total_dispatched by the same amount.
- On a passing evaluation, accepted weight_i is one of 0, 1, 3 or 5 and the sum is positive. The contract computes amount_i=floor(pool*weight_i/sum(weights)); the integer remainder goes to the highest weight and lowest slot on ties. The model never supplies amounts or recipients.
- On an incomplete evaluation, informational contribution merit is retained for auditability, but settlement weights and amounts are [0,0,0] and the sponsor receives the full pool.
- A failed or inconclusive evaluation does not change escrow, payout fields or settlement state. A later evaluation may retry the same frozen digest. The current release adds only a bounded unanimous exit: `approve_unresolved_refund` requires the sponsor and all three contributors to approve a still-FROZEN project, cannot override a successful adjudication and emits the full pool once. There is no sponsor-only cancellation, administrator rescue or manual claim path.
- There is no owner rescue, hidden commission, manual payout claim, sponsor-controlled allocation or wallet-based fee skim.
- Finalization emits EOA GEN messages. EMITTED_UNVERIFIED means only that the contract reached a terminal state and emitted messages; it does not prove child execution or beneficiary credit. Inspect each child transaction and balance delta. There is no blind automatic resend.
- Protocol fees are distinct from the locked project pool and must be funded by initiating wallets. The browser passes sponsor value separately from the SDK-estimated network fee.
- Reputation earned_wei records contract allocations/dispatched amounts, not independent proof of EOA receipt. The frontend labels this distinction.

## Current hardened deployment

Current contract: [0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D](https://explorer-studio.genlayer.com/address/0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D), source SHA-256 `309998d18ce351f45af55c34dcab3481c8bb923f74b9d2da5249e0039c3f6977`.

The current browser-tested project 1 funded `1000000000000000` wei, completed recruitment and froze evidence digest `0013e6a785f751e5dc2ba07dd92829247f986c1d545bcd49d538fc2370c813dc`. Its two evaluations [`0x21573da22ec0642d1e66e8e4a1be1b42ef1424236b73992085322ee52b5ad63c`](https://explorer-studio.genlayer.com/tx/0x21573da22ec0642d1e66e8e4a1be1b42ef1424236b73992085322ee52b5ad63c) and [`0xf305258f91e5c0454b76ad3290be9fdda472931ebb659a23b89567c37e6d2471`](https://explorer-studio.genlayer.com/tx/0xf305258f91e5c0454b76ad3290be9fdda472931ebb659a23b89567c37e6d2471) finalized `MAJORITY_DISAGREE`, so it recorded no contribution weights, no allocation and no contributor payout. All four principals then approved `approve_unresolved_refund`; the terminal parent [`0x166db01ed7a20af34051e9bc8cc021f7ff6d4e595eab5737b5a7010bfaff87cf`](https://explorer-studio.genlayer.com/tx/0x166db01ed7a20af34051e9bc8cc021f7ff6d4e595eab5737b5a7010bfaff87cf) emitted the entire pool to the sponsor.

| Current terminal field | Value |
| --- | --- |
| Project state | `REFUND_EMITTED` |
| Settlement label | `EMITTED_UNVERIFIED` |
| Reason | `UNRESOLVED_UNANIMOUS_EXIT` |
| Refund child | [`0x5902080a9d06cd5076646fc4dfa92d042138e24d78a07ac76623a259deedab0e`](https://explorer-studio.genlayer.com/tx/0x5902080a9d06cd5076646fc4dfa92d042138e24d78a07ac76623a259deedab0e), `FINALIZED / NO_MAJORITY / value_credited=true` |
| Accounting after project 1, before project 2 | `active_escrow_wei=0`, `project_count=1`, `total_dispatched_wei=1000000000000000` |

The refund child is described conservatively: `value_credited=true` proves the child value was credited at the protocol layer, not successful child consensus or a universal callback. No exact sponsor balance delta is claimed because no pre-refund balance snapshot was captured.

## Current project 2 source-backed settlement

The current contract's project 2 used the pinned official protocol reference with digest `a7cf6df48f9ee08041ecdfabd016cdab45fec9a4b938ca302f3ea8ac50170c05` and a user-authorized `2000000000000000` wei pool. Its first evaluation [`0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972`](https://explorer-studio.genlayer.com/tx/0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972) finalized `MAJORITY_AGREE` with leader `SUCCESS`; readback recorded all three criteria `met` and accepted weights `[5,3,3]`.

| Recipient slot | Weight | Allocated wei |
| --- | ---: | ---: |
| A | 5 | `909090909090910` |
| B | 3 | `545454545454545` |
| C | 3 | `545454545454545` |

The amounts sum exactly to `2000000000000000` wei. Triggered child sends A [`0xa787662d35adba760b0c133ab7f903381723d74ad5312276be5e3c8c1f009a09`](https://explorer-studio.genlayer.com/tx/0xa787662d35adba760b0c133ab7f903381723d74ad5312276be5e3c8c1f009a09), B [`0x2ac4419cf1fa360c678e003c7c1bb9a1538f89898a5fe8f46293a0ea3a46b261`](https://explorer-studio.genlayer.com/tx/0x2ac4419cf1fa360c678e003c7c1bb9a1538f89898a5fe8f46293a0ea3a46b261) and C [`0x6617691d6d893b2efb8111d24724efdd0a1cfc021bf587738590859bf9c82aff`](https://explorer-studio.genlayer.com/tx/0x6617691d6d893b2efb8111d24724efdd0a1cfc021bf587738590859bf9c82aff) each finalized `NO_MAJORITY` with `value_credited=true`; no child execution success is claimed. Final accounting readback was `active_escrow_wei=0`, `project_count=2`, `total_dispatched_wei=3000000000000000` wei, combining the earlier 0.001 GEN unanimous refund and this 0.002 GEN allocation. Final recipient balances were read through RPC, but no exact deltas are claimed because pre-settlement snapshots were not captured.

The accepted source-backed payout on `0x1524...` and successful native payout on `0x03EEC...` remain below as historical evidence; they are not current-contract results.

## Historical 0x03EEC payout evidence

The previous hardened deployment `0x03EEC54406D220ce484002A1A493d73D09b7F57C` (source SHA `794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818`) remains historical. Its project 2 evaluation [`0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde`](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde) recorded [5,3,3] over a `10000000000000000` wei pool. The child sends were [`0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d`](https://explorer-studio.genlayer.com/tx/0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d), [`0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3`](https://explorer-studio.genlayer.com/tx/0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3) and [`0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588`](https://explorer-studio.genlayer.com/tx/0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588), with independently observed beneficiary balances equal to `4545454545454546`, `2727272727272727` and `2727272727272727` wei. These are not current-contract results.

## Historical live accounting evidence

The prior source-matched deployment was [0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f](https://explorer-studio.genlayer.com/address/0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f), source SHA 0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF. Its project 2 funded 90000000000000000 wei and finalized with [5,3,3]. The old parent evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8), and old child sends were [0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345) and [0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03). Exact old beneficiary deltas were 40909090909090910, 24545454545454545 and 24545454545454545 wei.

That same historical deployment contains the incomplete-deliverable case: failed evaluation [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), unchanged-evidence retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078), and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) for the full old pool. These records are historical and are not current-contract refund evidence.
