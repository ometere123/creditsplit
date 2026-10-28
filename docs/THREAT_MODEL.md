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
10. Optional verified-source mode accepts only a raw GitHub file pinned to a commit plus a sponsor-registered SHA-256 digest. Leader and validators independently retrieve and verify the same bytes, classify factual claims as supported/contradicted/unverifiable, and fail closed on retrieval or digest mismatch. Retrieved source is untrusted evidence and cannot override validator instructions. This strengthens factual corroboration but does not establish human authorship, universal originality or non-collusion.
11. The current `0xBfBF...` release has two live three-wallet source-verified records: browser project 1 reached frozen evidence, two `MAJORITY_DISAGREE` outcomes and a unanimous refund; CLI/SDK project 2 reached `MAJORITY_AGREE` with leader `SUCCESS`, all criteria met and weights `[5,3,3]`. Project 2 emitted three child sends recorded conservatively as `FINALIZED / NO_MAJORITY / value_credited=true`; no child execution success is claimed. The accepted historical payout, assembler-omission, incomplete-deliverable refund and same-evidence retry remain separately labeled historical. Current evidence therefore covers both fail-closed disagreement and one accepted source-backed settlement without claiming universal model convergence or delivery guarantees.

## Known limits, not hidden assumptions

- Wallet signatures cannot establish independent real-world authorship or Sybil resistance.
- Public contract storage is not a confidential document vault.
- Free-form textual assessment cannot promise unanimous validators. The current contract provides a conditional unanimous exit for a still-frozen project, but it is not guaranteed if a required participant withholds consent; without that consent a failed retry can still leave funds frozen.
- EOA external-message failure may not refund principal. Do not blindly replay and double-pay.
- A verified public reference can be stale, incomplete or correct while a contribution is still wrong; source verification is bounded corroboration, not an identity or plagiarism oracle. If retrieval fails or the digest does not match, the assessment fails closed.
- No server or indexer: app reads bounded on-chain pages and can incur RPC delay.
- Cross-project accounting invariants must be confirmed in GenVM and live transactions.
- Wallet registration is on-chain authentication only; it does not establish real-world identity, originality or Sybil resistance.
