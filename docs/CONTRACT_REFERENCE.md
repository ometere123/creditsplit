# Creditsplit contract reference

`contracts/Creditsplit.py` is the sole authority for eligibility, evidence, settlement state and accounting. All JSON-returning views are public contract storage serialized as UTF-8 JSON; the browser does not supply authoritative state.

## Public writes

| Method | Caller and effect |
| --- | --- |
| `create_project(title, brief, a, b, c, assembler_slot)` payable | Any sponsor funds a positive native-GEN pool, registers exactly three distinct non-sponsor wallets and selects the assembler slot. The principal is added once to `active_escrow`. |
| `join_project(id)` | Only an invited wallet can join its own slot before the 48-hour recruitment deadline. The project becomes `ACTIVE` after all three joins. |
| `submit_contribution(id, content)` | A joined contributor can append at most two bounded UTF-8 packets before the 72-hour contribution deadline. Packet IDs and revision links are immutable after submission. |
| `finish_contributing(id)` | A joined contributor closes its slot. When all three close, assembly starts immediately. |
| `submit_final_artifact(id, text, source_refs_json)` | Only the selected assembler can publish a bounded final document during the 24-hour assembly window, and every reference must name a registered packet. |
| `respond_attribution(id, response)` | Each contributor can submit one bounded response and acknowledgment during the 24-hour review window. |
| `advance_project(id)` | Any caller can move an expired active project to assembly or create a deterministic latest-packet fallback after assembler timeout. |
| `freeze_project(id)` | Any caller can freeze after all acknowledgments or the review deadline. The canonical evidence snapshot is hashed with SHA-256 over UTF-8 JSON. |
| `evaluate_contributions(id)` | Only frozen evidence can enter the GenLayer leader/validator equivalence block. Agreement on completion, bands and evidence references is required before accounting or external messages. |
| `refund_unstarted_project(id)` | Any caller can refund the sponsor after recruitment expires if all three wallets did not join. |

## Public views

`get_project(id)`, `get_project_count()`, `list_projects(start_id, count)`, `get_profile(wallet)`, and `get_accounting()` expose state for the browser and independent verification. `get_project` includes packet history, the frozen digest, accepted bands, deterministic `amounts_wei`, settlement label and timestamps.

## Settlement labels

`NOT_EMITTED` means no settlement decision has been written. `EMITTED_UNVERIFIED` means the contract reached a terminal settlement state and emitted finalization-triggered EOA messages; it does not prove the child messages succeeded or that balances changed. The application therefore keeps the label visible and instructs reviewers to inspect each external-message result and beneficiary balance.

The contract has no administrator withdrawal, manual claim, arbitrary payout amount, or second settlement path. A terminal state is written before dispatch, so replayed evaluation cannot emit a second allocation. If an external transfer fails, the protocol limitation is surfaced; the contract does not invent a receipt or silently retry.
