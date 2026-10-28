# Validator integrity and the Equivalence Principle

evaluate_contributions is the sole nondeterministic entry. It consumes one immutable snapshot containing the sponsor brief, exactly three acceptance criteria, authorized wallet slots, immutable packet revisions, cross-packet references, the assembler final text and source references, attribution responses and the canonical SHA-256 evidence digest. In the default mode, all factual evidence is participant-registered packet text. In optional verified-source mode, the frozen snapshot also contains a sponsor-registered raw GitHub URL pinned to a commit and its SHA-256 digest; leader and validators independently retrieve the same bytes through `gl.nondet.web.get`, reject status/content/digest mismatches and classify factual claims as supported, contradicted or unverifiable. Retrieved source text is untrusted evidence, never validator instructions. Validators never read mutable contract storage from inside the nondeterministic callback.

The leader must return exactly three bounded assessments:

```json
{
  "complete": true,
  "criteria_status": ["met", "partial", "not_met"],
  "source_status": "verified",
  "source_digest": "expected SHA-256 or empty for closed-evidence mode",
  "assessments": [{
    "relevance": "direct",
    "distinct": true,
    "correctness": true,
    "material_effect": "foundational",
    "attribution_consistent": true,
    "claim_type": "factual",
    "factual_status": "supported",
    "evidence_ids": ["0:1"],
    "evidence_anchors": ["exact short packet excerpt"],
    "source_evidence_anchors": ["exact short excerpt from the verified reference"],
    "justification": "bounded explanation"
  }],
  "reason": "bounded explanation"
}
```

The contract, not the model, derives bands. A contributor receives 0 when work is irrelevant, incorrect, unattributed, unsupported by authentic evidence or has no material effect; 1 for supporting effect or non-distinct work; 3 for distinct substantial work; and 5 for distinct foundational work. Every positive assessment must cite the contributor's own registered packet. Each cited packet must have an exact bounded UTF-8 evidence anchor present in that packet and must pass the practical informative-anchor check: isolated articles and stopwords are rejected, while a concise content-bearing phrase, distinctive token or compact technical expression is accepted. Anchors authenticate the cited passage; validators still decide whether it is relevant and materially valuable. The contract reconstructs wei amounts from the accepted bands.

Assembler source references are authenticated attribution claims, not an economic veto. Validators inspect every registered packet, its wallet slot, revisions, build-on references, final text, responses and omissions. A material packet can receive a high classification even when the assembler omitted its ID. Authentic but irrelevant citations, fabricated IDs, wrong-slot attribution, unsupported foundational claims, copied work, omitted material corrections, false completion and prompt injection remain rejection cases.

Exact normalized packet copies are handled per supporting packet and by registration order. A later cross-slot exact copy is capped at supporting weight 1 only when that specific packet is cited as evidence; a separate original packet from the same wallet remains independently assessable. Citing a clean packet alongside a copied packet cannot conceal the copied evidence. The earlier registered packet remains independently assessable. This is not a real-world authorship oracle. Substantial paraphrase and shared technical language remain semantic validator judgments rather than string-match rejection.

Validators independently rerun the assessment over the same frozen evidence. In verified-source mode they independently retrieve the frozen URL, verify the exact SHA-256 and assess whether each source anchor actually supports the claimed factual contribution; source integrity alone is not proof of semantic relevance. A positive factual classification requires source-specific support, while a genuinely editorial or structural contribution may use `claim_type="nonfactual"` with `factual_status="not_applicable"` when its material effect is independently visible in the authenticated on-chain evidence. Agreement is required on completion, all three criterion statuses, every payment-controlling classification and the derived weights. Explanations and semantically equivalent supporting packet/source selections may differ. A valid JSON shape or matching weights alone is never sufficient.

Completion and contribution merit are separate. An incomplete deliverable may retain honest informational assessments, but the contract deterministically sets settlement weights and amounts to [0,0,0] and emits the full sponsor refund. A successful completion uses the accepted bands. If validators disagree or evaluation errors, the project remains FROZEN: evidence, escrow and payout fields do not change and no child transfer is emitted. A later evaluation may retry the same frozen digest. The current release also supports `approve_unresolved_refund`, but only as a bounded unanimous exit requiring the sponsor and all three contributors to approve; it is not a sponsor-only cancellation or an administrator override.

## Current hardened deployment evidence

Current contract [0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D](https://explorer-studio.genlayer.com/address/0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D), source SHA `309998d18ce351f45af55c34dcab3481c8bb923f74b9d2da5249e0039c3f6977`, was deployed by [0xa21f4e7ce67d438583a1bbdef1a7282db6888feb9a9edcd31eec9fefc1219114](https://explorer-studio.genlayer.com/tx/0xa21f4e7ce67d438583a1bbdef1a7282db6888feb9a9edcd31eec9fefc1219114) with FINALIZED / MAJORITY_AGREE / successful leader execution. The registered schema has 19 methods: 5 views and 14 writes, including `approve_unresolved_refund`.

The current browser project `1` registered the immutable official protocol reference with digest `a7cf6df48f9ee08041ecdfabd016cdab45fec9a4b938ca302f3ea8ac50170c05`, completed the three-wallet evidence lifecycle and froze digest `0013e6a785f751e5dc2ba07dd92829247f986c1d545bcd49d538fc2370c813dc`. Evaluations [`0x21573da22ec0642d1e66e8e4a1be1b42ef1424236b73992085322ee52b5ad63c`](https://explorer-studio.genlayer.com/tx/0x21573da22ec0642d1e66e8e4a1be1b42ef1424236b73992085322ee52b5ad63c) and [`0xf305258f91e5c0454b76ad3290be9fdda472931ebb659a23b89567c37e6d2471`](https://explorer-studio.genlayer.com/tx/0xf305258f91e5c0454b76ad3290be9fdda472931ebb659a23b89567c37e6d2471) both finalized `MAJORITY_DISAGREE`; no payment-controlling decision was stored. Four participant approvals then completed the conditional unresolved exit, parent [`0x166db01ed7a20af34051e9bc8cc021f7ff6d4e595eab5737b5a7010bfaff87cf`](https://explorer-studio.genlayer.com/tx/0x166db01ed7a20af34051e9bc8cc021f7ff6d4e595eab5737b5a7010bfaff87cf), with refund child [`0x5902080a9d06cd5076646fc4dfa92d042138e24d78a07ac76623a259deedab0e`](https://explorer-studio.genlayer.com/tx/0x5902080a9d06cd5076646fc4dfa92d042138e24d78a07ac76623a259deedab0e) carrying `value_credited=true` but no child execution success claim.

The current CLI/SDK project `2` used the same commit-pinned reference, froze evidence digest `3a1ff2fa8320acc1ed82170205f46e3b4134bab4471165798de692b0367c2ef5`, and evaluated once in [`0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972`](https://explorer-studio.genlayer.com/tx/0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972). It finalized `MAJORITY_AGREE` with leader `SUCCESS`, criteria `met/met/met`, and `[5,3,3]`; the validator vote summary was `AGREE,DISAGREE,AGREE,AGREE,DISAGREE`. The final readback is `SETTLEMENT_EMITTED / EMITTED_UNVERIFIED`; child sends were `FINALIZED / NO_MAJORITY / value_credited=true`, so no child execution success is claimed. This is the current accepted source-backed assessment. The historical `[5,3,1]` assessment and older payout remain separate evidence. None of these records proves real-world authorship or non-collusion.

## Historical live evidence

The earlier live omission, disagreement, retry and refund evidence belongs to historical contract 0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f, not the current address. Its successful evaluation was [0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8); the old failed evaluation was [0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), followed by unchanged-digest retry [0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078) and refund child [0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd).

This proves retry can preserve frozen evidence and fail closed before a later terminal outcome; it does not promise that every future disagreement will resolve or that every EOA transfer can be confirmed through contract state alone.

Offline and Direct Mode regression coverage includes forged classifications, fake packet/source references, duplicate passages, packet-specific exact-copy ordering, clean-reference concealment, informative-anchor enforcement, prompt injection, wrong-wallet actions, omitted criteria, benign explanation/reference differences, validator disagreement, malformed output, incomplete completion, replay and cross-project accounting.
