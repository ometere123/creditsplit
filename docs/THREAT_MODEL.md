# Threat model

## Assets

Locked GEN principal, immutable project rules, author packet evidence, evaluator outcome, trust-worthy reputation, finalizing external transfers.

## Adversaries

Sponsor manipulating final assembly; invited contributor copying prior submissions; assembler excluding material; adversarial leader inventing evidence; malicious author embedding instructions in packet text; outside actor advancing stages or attempting withdrawal; compromised browser attempting unauthorized writes; callbackless external EOA transfer failure.

## Enforced controls

1. Sponsor excluded from invitee slots; three distinct wallet addresses; no roles based on mutable UI state.
2. Contract-authorized writes only, capped public UTF-8 evidence, append-only versions and one response per contributor.
3. Deadline-based permissionless transitions prevent sponsor/assembler veto; fallback is prominently marked, cannot be presented as guaranteed deliverable.
4. Freeze hash over canonical evidence; only FROZEN can be evaluated; one-time state transition and no separate claims block double settlement.
5. Validator independently re-executes evidence-grounded semantic task; payment-driving fields match exactly; deterministic recipients, amounts and rounding.
6. Assembler `source_refs` are checked for authenticity but cannot veto a materially valuable packet; validators inspect omitted packets and the contract derives payment from their agreed classifications.
7. Evidence anchors must be exact bounded, content-bearing excerpts from registered packet text; token-boundary matching rejects trivial anchors while allowing concise technical corrections. Exact later cross-slot copies are capped per cited packet by registration sequence; a separate original packet is not suppressed, and paraphrases remain semantic validator decisions.
8. Incomplete delivery separates informational merit from settlement: any unmet criterion forces settlement weights to zero and refunds the sponsor. A failed consensus leaves frozen evidence and escrow unchanged.
9. `EMITTED_UNVERIFIED` transfer label makes the lack of delivery callback explicit. Inspect child messages and actual wallet balances.
10. The current hardened release has a live successful three-wallet lifecycle with an accepted [5,3,3] decision, exact child sends and beneficiary balance proof. The assembler-omission, failed incomplete evaluation, same-evidence retry and refund-child evidence belong to the historical `0x49...` deployment and are labeled that way in the deployment ledger. Current negative browser evidence includes a duplicate response that finalized with execution `ERROR` and changed no state.

## Known limits, not hidden assumptions

- Wallet signatures cannot establish independent real-world authorship or Sybil resistance.
- Public contract storage is not a confidential document vault.
- Free-form textual assessment cannot promise unanimous validators; a failed retry can still leave funds frozen because there is no safe sponsor-only cancellation mechanism.
- EOA external-message failure may not refund principal. Do not blindly replay and double-pay.
- No server or indexer: app reads bounded on-chain pages and can incur RPC delay.
- Cross-project accounting invariants must be confirmed in GenVM and live transactions.
- Wallet registration is on-chain authentication only; it does not establish real-world identity, originality or Sybil resistance.
