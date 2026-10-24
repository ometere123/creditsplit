# Escrow and deterministic GEN arithmetic

- Native GEN denominated in 10^18 wei; contract uses `u256` aggregate accounting.
- Every funded project increases `active_escrow` exactly once by `gl.message.value`.
- One irrevocable evaluation or unstarted refund decreases active escrow by that project's full principal; total emitted principal increases by the same amount.
- On a passing evaluation `weight_i ∈ {0,1,3,5}`; `sum(weights)>0`; `amount_i=floor(pool*weight_i/sum(weights))`, remainder to highest weight with lowest slot as tie-breaker. `sum(amount_i)==pool`.
- On a nonpassing evaluation all three weights are zero and sponsor receives the pool.
- There is no owner rescue, no administrator bypass, no commission, no manual payout claim path and no wallet-based fee skim.
- Payout messages to EOA recipients are emitted by the adjudication contract. The EVM-side external messages execute on finalization; failure may permanently strand or consume the value rather than restoring it. Confirm message outcomes and beneficiary balances. No automated re-send exists.
- Protocol/network fees are distinct from the sponsor's locked pool and must be funded by initiating wallets. Production minimums depend on measured Direct Mode/StudioNet costs.
- Reputational `earned_wei` records **allocated/dispatched** amounts, not independently proved EOA receipts. Profile UI labels this distinction.
- The source-matched live project funded `90000000000000000` wei and settled weights `[5,3,1]` into `50000000000000000`, `30000000000000000` and `10000000000000000` wei. The post-settlement accounting readback was `active_escrow_wei=0` and `total_dispatched_wei=90000000000000000`; child transaction `value_credited=true` plus beneficiary balance deltas confirmed delivery for that run.
- A separate incomplete live project reached validator disagreement before settlement. Its `1000000000000000` wei remained active escrow, demonstrating that inconclusive consensus does not silently mint or refund funds.
