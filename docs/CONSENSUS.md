# Validator integrity and the Equivalence Principle

`evaluate_contributions` is the sole nondeterministic entry. It consumes one immutable snapshot containing the sponsor brief, exactly three acceptance criteria, authorized wallet slots, immutable packet revisions, cross-packet references, the assembler's final text and source references, attribution responses, and the canonical SHA-256 evidence digest. Validators never fetch external sources and never read mutable contract storage from inside the nondeterministic callback.

The leader must return exactly three assessments with bounded fields:

```json
{
  "complete": true,
  "criteria_status": ["met", "partial", "not_met"],
  "assessments": [{
    "relevance": "direct",
    "distinct": true,
    "correctness": true,
    "material_effect": "foundational",
    "attribution_consistent": true,
    "evidence_ids": ["0:1"],
    "evidence_anchors": ["exact short packet excerpt"],
    "justification": "bounded explanation"
  }],
  "reason": "bounded explanation"
}
```

The contract, not the model, derives bands. A contributor receives `0` when the work is irrelevant, incorrect, unattributed, unsupported by authentic evidence or has no material effect; `1` for supporting effect or non-distinct work; `3` for distinct substantial work; and `5` for distinct foundational work. Every positive assessment must cite the contributor's own registered packet. Each cited packet must have an exact bounded UTF-8 `evidence_anchor` that is present in that packet and passes the contract's practical informative-anchor check: isolated articles/stopwords are rejected, while a concise content-bearing phrase, distinctive token or compact technical expression is accepted. Anchors authenticate the cited passage; validators still decide whether it is relevant and materially valuable. The contract reconstructs wei amounts from the resulting bands.

Assembler `source_refs` are authenticated attribution claims, not an economic veto. Validators inspect every registered packet, its wallet slot, revisions, build-on references, the final text, responses and omissions. A material packet can receive a high classification even when the assembler omitted its ID. Authentic but irrelevant citations, fabricated IDs, wrong-slot attribution, unsupported foundational claims, copied work, omitted material corrections, false completion and prompt injection remain rejection cases.

Exact normalized packet copies are handled per supporting packet and by registration order: a later cross-slot exact copy is capped at supporting weight `1` only when that packet is cited as evidence; a separate original packet from the same wallet remains independently assessable. Citing a clean packet alongside a copied packet cannot conceal the copied evidence. The earlier registered packet remains independently assessable. This is not a real-world authorship oracle. Substantial paraphrase and shared technical language are left to independent semantic assessment rather than string matching.

Validators independently rerun the assessment over the same frozen evidence. Agreement is required on completion, all three criterion statuses, every payment-controlling classification and the derived weights. Explanations and semantically equivalent supporting packet selections may differ. A valid JSON shape alone is never sufficient.

Completion and contribution merit are separate. An incomplete deliverable may retain honest informational assessments, but the contract deterministically sets settlement weights and amounts to `[0,0,0]` and emits the full sponsor refund. A successful completion uses the accepted bands. If validators disagree or the evaluation errors, the project remains `FROZEN`: evidence, escrow and payout fields do not change and no child transfer is emitted. A later evaluation may retry the same frozen digest; there is no sponsor-only cancellation or administrator override.

## Historical live evidence from the prior source-matched lifecycle

On current contract `0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f`, project 2 finalized `MAJORITY_AGREE` at [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8). Its criteria were `met/met/met`, the accepted weights were `[5,3,3]`, and B's assessment cited packet `1:1` even though the assembler's frozen `source_refs` were only `0:1` and `2:1`. The frozen digest was `c90c6fa749bb6db09f8197ee289d2012496148da1c7fac3bc8b0fc866ecd563a`.

Project 1 first reached `FINALIZED / MAJORITY_DISAGREE / ERROR` at [`0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b`](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), with no settlement change. A retry against the unchanged frozen evidence finalized `MAJORITY_AGREE` at [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078), recorded informational weights `[5,0,0]`, forced settlement weights to zero, and refunded the full pool. This proves retry is possible without changing frozen evidence; it does not promise that every future disagreement will resolve.

The hardened deployment is [`0x03EEC54406D220ce484002A1A493d73D09b7F57C`](https://explorer-studio.genlayer.com/address/0x03EEC54406D220ce484002A1A493d73D09b7F57C), source SHA-256 `794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818`, deployed by [`0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f`](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f). Initial readback was zero projects, zero active escrow and zero dispatched GEN. The first production browser write from Convert Chrome/Rabby is [`0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474`](https://explorer-studio.genlayer.com/tx/0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474), finalized `MAJORITY_AGREE` with `value_credited=true`; it created project `1` with `10000000000000000` wei and read back the sponsor, three invitees and the three immutable criteria. The browser test did not impersonate contributor wallets; contributor-side signing remains explicitly untested in this browser profile.

Offline and Direct Mode regression coverage includes forged classifications, fake packet/source references, duplicate passages, packet-specific exact-copy ordering, clean-reference concealment, informative-anchor enforcement, prompt injection, wrong-wallet actions, omitted criteria, benign explanation/reference differences, validator disagreement, malformed output, incomplete completion, replay and cross-project accounting.
