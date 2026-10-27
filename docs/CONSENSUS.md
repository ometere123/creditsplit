# Validator integrity and the Equivalence Principle

evaluate_contributions is the sole nondeterministic entry. It consumes one immutable snapshot containing the sponsor brief, exactly three acceptance criteria, authorized wallet slots, immutable packet revisions, cross-packet references, the assembler final text and source references, attribution responses and the canonical SHA-256 evidence digest. In the default mode, all factual evidence is participant-registered packet text. In optional verified-source mode, the frozen snapshot also contains a sponsor-registered raw GitHub URL pinned to a commit and its SHA-256 digest; leader and validators independently retrieve the same bytes through `gl.nondet.web.get`, reject status/content/digest mismatches and classify factual claims as supported, contradicted or unverifiable. Retrieved source text is untrusted evidence, never validator instructions. Validators never read mutable contract storage from inside the nondeterministic callback.

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
    "factual_status": "supported",
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

Current contract [0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44](https://explorer-studio.genlayer.com/address/0xEFf0D2023Fa34Ae150BBa77B906b22384920Dd44), source SHA `ED1E43BD4E32056ADF6D6DD0ED6CA0F126887391A4FC53D159A1644AF92C226F`, was deployed by [0xdb0d4fa219df9a1150687a2672fc035b64f321d5aff74b2ad6be47ab88ba95fa](https://explorer-studio.genlayer.com/tx/0xdb0d4fa219df9a1150687a2672fc035b64f321d5aff74b2ad6be47ab88ba95fa) with FINALIZED / MAJORITY_AGREE / successful leader execution. The registered schema has 18 methods: 5 views and 13 writes.

The current verified-source project 1 registered the immutable reference [`https://raw.githubusercontent.com/ometere123/creditsplit/2767a0ac558a0d52828ee94f015e26dee6dfb18f/docs/CONSENSUS.md`](https://raw.githubusercontent.com/ometere123/creditsplit/2767a0ac558a0d52828ee94f015e26dee6dfb18f/docs/CONSENSUS.md), digest `e68b6d5448dd668219c8fcb13eeee38f0fbd0f6dafd2e355039ea0fc7f68b112`. Its creation was [`0x549443ee02014ea72065af41af7ccfc76e243d066c0e35ace9d874633fd9b683`](https://explorer-studio.genlayer.com/tx/0x549443ee02014ea72065af41af7ccfc76e243d066c0e35ace9d874633fd9b683). After the three joins, packets, assembly, responses and freeze, evaluation [`0xcaa3c9510c92ad90be77f10848f70654e29ae25011eb5219f91503b0c8349ecb`](https://explorer-studio.genlayer.com/tx/0xcaa3c9510c92ad90be77f10848f70654e29ae25011eb5219f91503b0c8349ecb) finalized `MAJORITY_AGREE` with leader `SUCCESS`, votes 3 agree/2 disagree, criteria `met/met/met` and accepted weights `[5,3,3]`. The final readback is `SETTLEMENT_EMITTED`, `VERIFIED`, with allocations `454545454545456`, `272727272727272` and `272727272727272` wei. The three child sends [`0x845d62ccb2cd588ed779193f0af9d64ca28ad84eb5e53c769f1a6c731bfea658`](https://explorer-studio.genlayer.com/tx/0x845d62ccb2cd588ed779193f0af9d64ca28ad84eb5e53c769f1a6c731bfea658), [`0x50c57fe8a239fe159d014de0ed7a0fd864506a64fe923190bbaf8de0991df3e0`](https://explorer-studio.genlayer.com/tx/0x50c57fe8a239fe159d014de0ed7a0fd864506a64fe923190bbaf8de0991df3e0) and [`0xc35c8ebd93fa5aef60263527d3f4e26a8a1864ef809975bfad7fac8b80fda444`](https://explorer-studio.genlayer.com/tx/0xc35c8ebd93fa5aef60263527d3f4e26a8a1864ef809975bfad7fac8b80fda444) each finalized `NO_MAJORITY`; therefore no beneficiary credit is claimed for this run. This is a real source-verified consensus result, but not a successful payment-delivery result.

The separately documented Project 2 browser demonstration belongs to the historical `0x03EEC...` contract, not this source-verified deployment. Its packets are registered on-chain text; they are not externally sourced and do not prove real-world authorship. The historical transaction ledger is in `DEPLOYMENT.md`.

## Historical live evidence

The earlier live omission, disagreement, retry and refund evidence belongs to historical contract 0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f, not the current address. Its successful evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8); the old failed evaluation was [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), followed by unchanged-digest retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd).

This proves retry can preserve frozen evidence and fail closed before a later terminal outcome; it does not promise that every future disagreement will resolve or that every EOA transfer can be confirmed through contract state alone.

Offline and Direct Mode regression coverage includes forged classifications, fake packet/source references, duplicate passages, packet-specific exact-copy ordering, clean-reference concealment, informative-anchor enforcement, prompt injection, wrong-wallet actions, omitted criteria, benign explanation/reference differences, validator disagreement, malformed output, incomplete completion, replay and cross-project accounting.
