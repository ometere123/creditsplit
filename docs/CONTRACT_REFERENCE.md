# Creditsplit contract reference

`contracts/Creditsplit.py` is the sole authority for eligibility, evidence, settlement state and accounting. JSON-returning views expose public contract storage as UTF-8 JSON; the browser supplies no authoritative state.

## Public writes

| Method | Caller and effect |
| --- | --- |
| `create_project(title, brief, a, b, c, assembler_slot)` payable | Backward-compatible path using the three default criteria. The sponsor funds a positive native-GEN pool and registers exactly three distinct non-sponsor wallets. |
| `create_project_with_criteria(title, brief, criteria_json, a, b, c, assembler_slot)` payable | Preferred path. Locks exactly three bounded UTF-8 acceptance criteria and adds the principal once to `active_escrow`. |
| `create_project_with_verified_source(title, brief, criteria_json, source_url, source_digest, a, b, c, assembler_slot)` payable | Optional factual-evidence path. Locks the same three criteria plus a raw GitHub file URL pinned to a 40-character commit and a 64-character SHA-256 digest. GenLayer independently retrieves and verifies the bytes during assessment; it does not prove authorship or originality. |
| `join_project(id)` | An invited wallet joins its own immutable slot before the 48-hour recruitment deadline. All three joins activate the project. |
| `submit_contribution(id, content)` | A joined contributor appends at most two immutable bounded UTF-8 packets. The packet text is the work itself. |
| `submit_contribution_with_references(id, content, references_json)` | Same packet path with up to three references to already registered packets. References authenticate correction/build-on relationships but do not prove real-world authorship. Each packet receives a contract registration sequence. |
| `finish_contributing(id)` | A contributor closes its slot; when all three close, assembly starts. |
| `submit_final_artifact(id, text, source_refs_json)` | The selected assembler publishes bounded final text and authentic packet references. `source_refs` are attribution claims, not an economic veto. |
| `respond_attribution(id, response)` | Each contributor seals one bounded review response. |
| `advance_project(id)` | Permissionless deadline transition or deterministic latest-packet fallback after assembler timeout. |
| `freeze_project(id)` | Canonicalizes the brief, criteria, roles, packets, revisions, final text, source refs and responses, then stores a SHA-256 evidence digest. |
| `evaluate_contributions(id)` | Runs the leader and independent validators over the frozen evidence. Only validator-agreed payment classifications can settle. |
| `refund_unstarted_project(id)` | Permissionless full refund after recruitment expiry if all three wallets did not join. |

`create_project` is retained for compatibility and supplies generic default criteria. It is not a separate escrow or settlement implementation: it reaches the same authenticated, frozen-evidence, validator-agreement and deterministic accounting path as `create_project_with_criteria`. The frontend uses the custom-criteria method so each sponsor can define the three requirements explicitly.

## Assessment and settlement rules

Each assessment contains `relevance`, `distinct`, `correctness`, `material_effect`, `attribution_consistent`, `factual_status`, `evidence_ids`, exact bounded `evidence_anchors`, and a bounded justification. Positive work must cite the contributor's own packet. Anchors must be exact normalized packet excerpts, match on token boundaries, and contain identifiable content; isolated articles/stopwords such as `The` are rejected, while concise technical corrections remain eligible. In verified-source mode, `factual_status` is `supported`, `contradicted` or `unverifiable`; positive credit is not allowed for contradicted or unverifiable factual work. The contract derives bands `0/1/3/5`; model-provided weights, amounts and recipients are ignored.

An exact normalized packet copied later across slots is capped at supporting band `1` only when that specific packet is part of the accepted supporting evidence; earlier registered work and a separate original packet from the same contributor remain assessable. Citing an unrelated clean packet cannot hide a copied cited packet. Substantial paraphrase is not rejected by string equality and remains a validator judgment. A valid high classification does not require the assembler to have included that packet in `source_refs`.

Completion is independent of merit. If all three criteria are met and the final text exists, accepted bands produce deterministic integer allocations. If any criterion is partial/not met, informational assessments remain stored but settlement weights and amounts become `[0,0,0]` and the full principal is refunded. If consensus fails, frozen evidence and escrow remain unchanged and a later evaluation may retry.

## Public views

`get_project(id)`, `get_project_count()`, `list_projects(start_id, count)`, `get_profile(wallet)`, and `get_accounting()` expose public state. `get_project` includes packet sequence/revision history, final text, source refs, frozen digest, criteria status, decision assessments, informational weights, settlement label and deterministic `amounts_wei`.

## Settlement labels

`NOT_EMITTED` means no terminal settlement decision exists. `EMITTED_UNVERIFIED` means the contract reached a terminal state and emitted finalization-triggered EOA messages; it does not prove child execution or balance credit. Inspect every child result and recipient balance. The contract has no administrator withdrawal, arbitrary payout amount, manual claim path or blind retry.

## Current deployment

The verified current address is [`0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44`](https://explorer-studio.genlayer.com/address/0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44), source SHA-256 `ED1E43BD4E32056ADF6D6DD0ED6CA0F126887391A4FC53D159A1644AF92C226F`. Its source provenance and live transaction ledger are in [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) and [`docs/REVIEW_EVIDENCE.md`](REVIEW_EVIDENCE.md). The previous `0x03EEC...` address and its completed payout lifecycle remain historical evidence.
