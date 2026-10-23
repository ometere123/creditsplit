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
6. `EMITTED_UNVERIFIED` transfer label makes the lack of delivery callback explicit. Inspect child messages and actual wallet balances.

## Known limits, not hidden assumptions

- Wallet signatures cannot establish independent real-world authorship or Sybil resistance.
- Public contract storage is not a confidential document vault.
- Free-form textual assessment cannot promise unanimous validators; undetermined assessments may leave funds frozen until protocol recovery.
- EOA external-message failure may not refund principal. Do not blindly replay and double-pay.
- No server or indexer: app reads bounded on-chain pages and can incur RPC delay.
- Cross-project accounting invariants must be confirmed in GenVM and live transactions.
