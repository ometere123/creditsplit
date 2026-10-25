# Validator integrity and the Equivalence Principle

evaluate_contributions is the sole nondeterministic entry. It consumes one immutable snapshot containing the sponsor brief, exactly three acceptance criteria, authorized wallet slots, immutable packet revisions, cross-packet references, the assembler final text and source references, attribution responses and the canonical SHA-256 evidence digest. Validators never fetch external sources and never read mutable contract storage from inside the nondeterministic callback.

The leader must return exactly three bounded assessments:

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

The contract, not the model, derives bands. A contributor receives 0 when work is irrelevant, incorrect, unattributed, unsupported by authentic evidence or has no material effect; 1 for supporting effect or non-distinct work; 3 for distinct substantial work; and 5 for distinct foundational work. Every positive assessment must cite the contributor's own registered packet. Each cited packet must have an exact bounded UTF-8 evidence anchor present in that packet and must pass the practical informative-anchor check: isolated articles and stopwords are rejected, while a concise content-bearing phrase, distinctive token or compact technical expression is accepted. Anchors authenticate the cited passage; validators still decide whether it is relevant and materially valuable. The contract reconstructs wei amounts from the accepted bands.

Assembler source references are authenticated attribution claims, not an economic veto. Validators inspect every registered packet, its wallet slot, revisions, build-on references, final text, responses and omissions. A material packet can receive a high classification even when the assembler omitted its ID. Authentic but irrelevant citations, fabricated IDs, wrong-slot attribution, unsupported foundational claims, copied work, omitted material corrections, false completion and prompt injection remain rejection cases.

Exact normalized packet copies are handled per supporting packet and by registration order. A later cross-slot exact copy is capped at supporting weight 1 only when that specific packet is cited as evidence; a separate original packet from the same wallet remains independently assessable. Citing a clean packet alongside a copied packet cannot conceal the copied evidence. The earlier registered packet remains independently assessable. This is not a real-world authorship oracle. Substantial paraphrase and shared technical language remain semantic validator judgments rather than string-match rejection.

Validators independently rerun the assessment over the same frozen evidence. Agreement is required on completion, all three criterion statuses, every payment-controlling classification and the derived weights. Explanations and semantically equivalent supporting packet selections may differ. A valid JSON shape alone is never sufficient.

Completion and contribution merit are separate. An incomplete deliverable may retain honest informational assessments, but the contract deterministically sets settlement weights and amounts to [0,0,0] and emits the full sponsor refund. A successful completion uses the accepted bands. If validators disagree or evaluation errors, the project remains FROZEN: evidence, escrow and payout fields do not change and no child transfer is emitted. A later evaluation may retry the same frozen digest; there is no sponsor-only cancellation or administrator override.

## Current hardened deployment evidence

Current contract [0x03EEC54406D220ce484002A1A493d73D09b7F57C](https://explorer-studio.genlayer.com/address/0x03EEC54406D220ce484002A1A493d73D09b7F57C), source SHA 794231E47E0EF7873E6F14A4BBC9FC7B0D1CAF94A2C9BBDE9DBFD85A52612818, was deployed by [0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f](https://explorer-studio.genlayer.com/tx/0x64f7f36cbc2eb8349e6e68850cc00bf839fecb7251c05941b1b67a62d95d405f) with FINALIZED / MAJORITY_AGREE / successful leader execution.

The current live project 2 froze digest ecba62ae2847d1655194b6b94da9bc91839c9c9db4a4b42c1a3b1f9e4a95cfd6. Its evaluation [0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde) finalized MAJORITY_AGREE with criteria met/met/met and weights [5,3,3]. The accepted assessments used actual packet IDs 0:1, 1:1 and 2:1 with content-bearing anchors. The final readback contains amounts 4545454545454546, 2727272727272727 and 2727272727272727 wei. Explorer Send children and direct RPC balances confirm the same three beneficiary credits, while the contract state correctly remains EMITTED_UNVERIFIED.

Project 2 was submitted through the production application in Convert Chrome/Rabby using the three invitees. The packets are registered on-chain text; they are not externally sourced and do not prove real-world authorship. The full current transaction ledger is in DEPLOYMENT.md.

## Historical live evidence

The earlier live omission, disagreement, retry and refund evidence belongs to historical contract 0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f, not the current address. Its successful evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8); the old failed evaluation was [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), followed by unchanged-digest retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd).

This proves retry can preserve frozen evidence and fail closed before a later terminal outcome; it does not promise that every future disagreement will resolve or that every EOA transfer can be confirmed through contract state alone.

Offline and Direct Mode regression coverage includes forged classifications, fake packet/source references, duplicate passages, packet-specific exact-copy ordering, clean-reference concealment, informative-anchor enforcement, prompt injection, wrong-wallet actions, omitted criteria, benign explanation/reference differences, validator disagreement, malformed output, incomplete completion, replay and cross-project accounting.
