# Validator integrity and the Equivalence Principle

`evaluate_contributions` is the sole nondeterministic entry. It consumes one immutable snapshot containing the sponsor brief, exactly three acceptance criteria, the authorized wallet slots, immutable packet revisions, cross-packet references, the assembler's final text and source references, attribution responses, and the canonical SHA-256 evidence digest. Validators never fetch external sources and never read mutable contract storage from inside the nondeterministic callback.

The leader must return exactly:

```json
{
  "complete": true,
  "criteria_status": ["met", "partial", "not_met"],
  "assessments": [
    {
      "relevance": "direct",
      "distinct": true,
      "correctness": true,
      "material_effect": "foundational",
      "attribution_consistent": true,
      "evidence_ids": ["0:1"],
      "justification": "bounded explanation"
    }
  ],
  "reason": "bounded explanation"
}
```

The contract, not the model, derives the payment bands. A contributor receives `0` when the work is irrelevant, incorrect, unattributed, unsupported by authentic evidence or has no material effect; `1` for supporting effect or non-distinct work; `3` for distinct substantial work; and `5` for distinct foundational work. Positive classifications must cite registered packet IDs from the same wallet slot; bands `3` and `5` must also cite a packet used by the final deliverable. Exact normalized duplicate passages cannot both earn a substantial-or-higher band. The contract reconstructs wei amounts from these bands with deterministic remainder handling.

Each validator independently calls the same assessment over the same frozen evidence. Agreement is required on completion, all three criterion statuses, all five payment-controlling fields for every slot, and the derived weights. Natural-language explanations and valid supporting packet selections do not need byte-for-byte equality, so equivalent evidence paths do not create an arbitrary consensus requirement. A valid JSON shape by itself is never sufficient.

The evidence text is explicitly untrusted. Prompt-injection strings in a brief, packet, response or final document cannot change the evaluator's rules. Validators must reject unsupported claims, fabricated packet IDs, wrong contributor slots, omitted material corrections, copied work presented as distinct, false completion and source-reference substitution. If validators disagree or evaluation fails, the project remains frozen with no weights, no settlement state change and no child transfers. There is no administrator, sponsor override, single-provider tie-breaker or manual payout path.

The live completed project at `0xaa14cb0B1f6c4868096Ef70dE131B93037B324fD` produced criteria `met/met/met`, assessments for foundational/substantial/supporting work and weights `[5,3,1]`. A separate live case attempted `0:999` as a final source reference; the transaction finalized with leader execution `ERROR` and the project readback remained `ASSEMBLY` with an empty final text. After a valid but intentionally incomplete artifact, evaluation reached `MAJORITY_DISAGREE` with execution `ERROR`; the frozen project retained no payout fields and its escrow remained reserved. Those results are recorded as evidence of fail-closed behavior, not as guaranteed consensus success.

Offline and Direct Mode regression coverage includes forged classifications, fake packet/source references, duplicate passages, prompt injection, wrong-wallet actions, omitted criteria, benign explanation/reference differences, validator disagreement, malformed outputs, replay and cross-project accounting.
