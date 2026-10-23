# Validator integrity

`evaluate_contributions` is the sole nondeterministic entry. It uses an immutable snapshot containing the brief, authorized wallets, signed revision packets, canonical deliverable, source references, and signed attribution responses. JSON is serialized with sorted keys and hashed SHA-256 during freeze, then reconstructed and checked before assessment.

Leader returns: `{complete:bool, weights:[0|1|3|5]*3, evidence_ids:[[packet id],...], reason:string}`. The deterministic result validator rejects incorrect shapes, mismatched wallet-slot citations, fabricated packet IDs, nonzero weights without authenticated evidence and completed work without any credited contributor.

The consensus validator invokes the same assessment **independently** on the same frozen snapshot, then demands exact equality for `complete` and all three `weights`. Those fields alone determine whether funds go to creators or back to the sponsor and the exact shares. `evidence_ids` are checked by both parties against registered packets; leader-supplied payout amounts do not exist.

This deliberately favors correctness over easy agreement. Natural-language contributions may cause genuine evaluator disagreement, leading to protocol leader rotation, appeal or eventual undetermined outcome. There is **no centralized tie-breaker and no silent fallback to a different LLM or arbitrary percentage**.

Adversarial direct-mode scenarios required: malicious `complete=true`, fabricated 5 for zero-work slot, forged source id, source digest substitution, participant swapping, prompt injection within packet, harmful duplicate contribution, leader-reported unexpected fields, incomplete work reported complete, validator disagreement, and failure during the external settlement stage.
