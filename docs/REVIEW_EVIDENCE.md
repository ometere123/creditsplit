# Reviewer evidence ledger

This ledger separates the authoritative current release from historical deployments and distinguishes source/test evidence from live StudioNet evidence. It does not self-certify portal scores.

## A. Final release identity

| Item | Evidence |
| --- | --- |
| Source-release commit | [`852a6257838e36c9fa75f5c290d8c3157c59a66f`](https://github.com/ometere123/creditsplit/commit/852a6257838e36c9fa75f5c290d8c3157c59a66f) |
| Final main commit | The exact post-closeout `main` commit is reported with the final CI run in the release handoff |
| Contract source SHA-256 | `73fd5a760a2ce3c70af3d03802fd2439f2da29c671000a817fdbfab3f5d5ffa3` |
| Current contract | [`0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB`](https://explorer-studio.genlayer.com/address/0x1524e854C69cF5FBBB28f6F0f1828197C2839ecB) |
| Deployment | [`0xd361045f3b3b0162e1a5109bf37c266feb4ad2fe306ad4f1f8471413e8f76b28`](https://explorer-studio.genlayer.com/tx/0xd361045f3b3b0162e1a5109bf37c266feb4ad2fe306ad4f1f8471413e8f76b28), FINALIZED / MAJORITY_AGREE / SUCCESS |
| Network | StudioNet chain `61999`, `https://studio.genlayer.com/api` |
| Production | [`https://creditsplit-sigma.vercel.app`](https://creditsplit-sigma.vercel.app) |
| Exact-SHA source-release CI | Updated after the post-closeout push; the final run URL and SHA are reported in the release handoff |

The contract source last changed at `852a6257838e36c9fa75f5c290d8c3157c59a66f`; `gen_getContractCode` returned 45,057 bytes with the exact source hash above, and the registered schema reports 18 methods (5 views, 13 writes), including the optional verified-source creation path. The source-mode deployment below is current; older deployment and payment records remain explicitly historical.

## B. Implemented contract controls

The current source and passing regression suites verify:

- three immutable criteria, authenticated invitees and sponsor exclusion;
- immutable packet/revision history, authenticated cross-contributor references and canonical evidence freezing;
- independent leader/validator assessment of the actual packet text, revisions, final artifact, criteria, responses and omissions;
- assembler references as authenticated claims rather than an economic veto;
- optional commit-pinned verified-source retrieval with digest validation and supported/contradicted/unverifiable factual status;
- informative bounded anchors, packet-specific exact-copy ordering and no clean-reference concealment;
- informational merit separated from settlement weights for incomplete work;
- deterministic 0/1/3/5 bands, integer allocation, exact pool conservation, replay protection and project-local escrow;
- fail-closed disagreement: frozen evidence and escrow remain unchanged until a later evaluation;
- finalization-only native GEN messages with the deliberately conservative EMITTED_UNVERIFIED label.

create_project() is backward-compatible and uses generic default criteria; it follows the same escrow, authorization, freeze, consensus and settlement path as create_project_with_criteria(). The preferred frontend path is the custom-criteria method because it gives a sponsor project-specific requirements. The legacy method is less expressive, not a weaker financial-security path.

## C. Historical contract 0x03EEC live lifecycle: project 2

Project 2 is the historical `0x03EEC...` demonstration. It was performed through the production Vercel application in Convert Chrome with Rabby, switching among the authorized sponsor and the three browser invitees:

- A 0x7e2a8d765e0e346C451109eb42D92f61FBdbfd4b
- B 0x1F21Be13E3Fd277C5D3115b7Fb8135de19A427F5
- C 0x9Fb5156D0befFbCE9489C69f4Ae84C8A129598e6

| Stage | Current transaction evidence |
| --- | --- |
| Create/fund | [`0x6c1413bf1872e252588219eb9b6f708171041b452b388d1bcb240beaa11b1a9f`](https://explorer-studio.genlayer.com/tx/0x6c1413bf1872e252588219eb9b6f708171041b452b388d1bcb240beaa11b1a9f), 0.01 GEN, value credited |
| Joins | A [`0x413ba749de1303613d5564aaa5fb54869c56496c65d70799c4fea60add633f6f`](https://explorer-studio.genlayer.com/tx/0x413ba749de1303613d5564aaa5fb54869c56496c65d70799c4fea60add633f6f), B [`0x5988167b8c82d31b4142b348fa659f7bdc198022f5bd440dac7ab3c94701231c`](https://explorer-studio.genlayer.com/tx/0x5988167b8c82d31b4142b348fa659f7bdc198022f5bd440dac7ab3c94701231c), C [`0xfbf86f46d88aa08f3b0e221ef6630b656996e072fe372a68233542bb6d860ef4`](https://explorer-studio.genlayer.com/tx/0xfbf86f46d88aa08f3b0e221ef6630b656996e072fe372a68233542bb6d860ef4) |
| Packets | A [`0xead46add14d4d0a71cf44a6283cf2f79e6d2f2b14c98b4973989c230c5e3a3fb`](https://explorer-studio.genlayer.com/tx/0xead46add14d4d0a71cf44a6283cf2f79e6d2f2b14c98b4973989c230c5e3a3fb), B [`0xcf34db5e3fab62fa31f929d330a45a876ed32acd2962eb98442a7beda3a92423`](https://explorer-studio.genlayer.com/tx/0xcf34db5e3fab62fa31f929d330a45a876ed32acd2962eb98442a7beda3a92423), C [`0x62f567be2be8e0121407bce96aa56447d00308f48686e20abf6000f67445c3d9`](https://explorer-studio.genlayer.com/tx/0x62f567be2be8e0121407bce96aa56447d00308f48686e20abf6000f67445c3d9); B references A and C references A/B |
| Finish/assemble | Finish A [`0x40dd48c9740a0cade45391bf78763f0b6427084e0352404a537bad1035d08cb7`](https://explorer-studio.genlayer.com/tx/0x40dd48c9740a0cade45391bf78763f0b6427084e0352404a537bad1035d08cb7), B [`0x0d9b8ef0ad52de1a8e138b2d505412e911b28458bbf9570aabe8807eef86de62`](https://explorer-studio.genlayer.com/tx/0x0d9b8ef0ad52de1a8e138b2d505412e911b28458bbf9570aabe8807eef86de62), C [`0x41ce2f7d3d38ba6e6d96e1fde0e8537f78ec93a2e0c3a160bbbc0906a2fd8f31`](https://explorer-studio.genlayer.com/tx/0x41ce2f7d3d38ba6e6d96e1fde0e8537f78ec93a2e0c3a160bbbc0906a2fd8f31); final artifact [`0x62a85063d6ab0a31cf3a7487e49e5f58b58c3c852ae41d29ea9183a815301349`](https://explorer-studio.genlayer.com/tx/0x62a85063d6ab0a31cf3a7487e49e5f58b58c3c852ae41d29ea9183a815301349) |
| Responses/freeze | Successful response hashes A [`0x5c0e407a64dedeb75ab3eae815049bc34a6178be259625df5e26af25e9f099b2`](https://explorer-studio.genlayer.com/tx/0x5c0e407a64dedeb75ab3eae815049bc34a6178be259625df5e26af25e9f099b2), B [`0xafbb448b3abd81d84359912163229ebf7dd264349471c8545349867a83d0ee9e`](https://explorer-studio.genlayer.com/tx/0xafbb448b3abd81d84359912163229ebf7dd264349471c8545349867a83d0ee9e), C [`0x60400e425008ff85a4a2b7fc49764b1bb399bb8740a67e9c1f3d1c471c9d4cb6`](https://explorer-studio.genlayer.com/tx/0x60400e425008ff85a4a2b7fc49764b1bb399bb8740a67e9c1f3d1c471c9d4cb6); freeze [`0xbeab879864346e7c80701747af32141126baf198a47d9b2136ea859f3598b120`](https://explorer-studio.genlayer.com/tx/0xbeab879864346e7c80701747af32141126baf198a47d9b2136ea859f3598b120), digest `ecba62ae2847d1655194b6b94da9bc91839c9c9db4a4b42c1a3b1f9e4a95cfd6` |
| Evaluation | [`0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde`](https://explorer-studio.genlayer.com/tx/0xf52ee77b96c82e1a3623d76ffa357e2ac86abafc6aee62a65fe22915d2145dde), FINALIZED / MAJORITY_AGREE / SUCCESS, criteria met/met/met, weights [5,3,3] |
| Native child sends | A [`0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d`](https://explorer-studio.genlayer.com/tx/0x2106feff0fe47e77739f34412b9d3bd0ad51fbb42784044c1d4fb54735aafd0d), B [`0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3`](https://explorer-studio.genlayer.com/tx/0xc89cdc6eb073353fe91f476e3b4261c46439c2ea350f82172d06a9f88ca428ef3), C [`0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588`](https://explorer-studio.genlayer.com/tx/0x22e04cafa4f23c4b97f7950eaab24c7d6df043d26dc3ff59458bd4c4eb6cf588); all explorer rows are finalized incoming sends |

The final get_project(2) readback is SETTLEMENT_EMITTED, all three criteria met, weights [5,3,3], amounts 4545454545454546, 2727272727272727, 2727272727272727 wei and all acknowledgments true. The allocations sum exactly to the funded 0.01 GEN. Direct balance reads after the child sends equal those same amounts for A, B and C; Explorer account pages show the corresponding incoming Send rows. The contract continues to expose EMITTED_UNVERIFIED because a child transfer callback is not part of the protocol.

The duplicate C response transaction [`0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221`](https://explorer-studio.genlayer.com/tx/0x943d1634410b73d1a888820cf2a100da7e11287fa5929d51d78810d2d9bad221) finalized with execution ERROR after the response was already sealed. It changed no state, and the later successful readback was not mistaken for a second write.

## D. Current contract verified-source lifecycle: project 1

The current contract `0x1524...9ecB` was exercised with the commit-pinned official GenLayer protocol reference [`PROTOCOL_DOCUMENTATION.md`](https://raw.githubusercontent.com/genlayerlabs/genlayer-docs/c403c30b01c5adaa2d93719d6e17a8aa1f478d1a/PROTOCOL_DOCUMENTATION.md), digest `a7cf6df48f9ee08041ecdfabd016cdab45fec9a4b938ca302f3ea8ac50170c05`. Creation [`0xf89459b1743f48918b87f88a8780568358f6a45797a6c89f84fba935ff8990ea`](https://explorer-studio.genlayer.com/tx/0xf89459b1743f48918b87f88a8780568358f6a45797a6c89f84fba935ff8990ea) credited a `0.001 GEN` pool. Three CLI-authorized contributor wallets joined, submitted actual text including a correction reference, finished, assembled, responded, froze and evaluated; the complete transaction ledger is in `docs/DEPLOYMENT.md`.

Evaluation [`0xf13ff7565c483b16a05c8ad892277d30ca660997aa9d534a9e8c8cb2809db27a`](https://explorer-studio.genlayer.com/tx/0xf13ff7565c483b16a05c8ad892277d30ca660997aa9d534a9e8c8cb2809db27a) finalized `MAJORITY_AGREE` with leader `SUCCESS`, criteria `met/met/met`, and accepted weights `[5,3,1]`. Readback recorded `VERIFIED` source status and allocations `555555555555556`, `333333333333333`, `111111111111111` wei. The emitted child transactions [`0x22b6747bb94ece5ac0d587f5e2344cea1fd23b63122e3a7fa1572d22900e65ab`](https://explorer-studio.genlayer.com/tx/0x22b6747bb94ece5ac0d587f5e2344cea1fd23b63122e3a7fa1572d22900e65ab), [`0x34b0f1499626c7c41e07cb1681ab09c7d66ba11b3fe45c3b4935c5bc18246c79`](https://explorer-studio.genlayer.com/tx/0x34b0f1499626c7c41e07cb1681ab09c7d66ba11b3fe45c3b4935c5bc18246c79) and [`0x2f6c7a1550856f84b7b850de11084436d3418295fa3ef1f12ac749cdeedc6329`](https://explorer-studio.genlayer.com/tx/0x2f6c7a1550856f84b7b850de11084436d3418295fa3ef1f12ac749cdeedc6329) each finalized `NO_MAJORITY`, `value_credited=true`, with no child execution hash. Independent balance readback showed exact beneficiary deltas equal to those allocations; no child execution success is claimed.

## E. Bounded real-model and fail-closed evidence

The live evidence is intentionally bounded; deterministic offline and Direct Mode fixtures are not counted as independent production-model agreement.

| Case | Evidence | Observed result |
| --- | --- | --- |
| Source-backed positive assessment | Current contract project 1, frozen digest `49d3dbbeb1f3c2bc9909ff01d5541298d228319c7ff96c68c2273d0f1d6e7db9f`; evaluation [`0xf13ff7565c483b16a05c8ad892277d30ca660997aa9d534a9e8c8cb2809db27a`](https://explorer-studio.genlayer.com/tx/0xf13ff7565c483b16a05c8ad892277d30ca660997aa9d534a9e8c8cb2809db27a) | `FINALIZED / MAJORITY_AGREE`, leader `SUCCESS`, criteria `met/met/met`, weights `[5,3,1]`; A/B factual statuses `supported` with source anchors, C `nonfactual/not_applicable`; settlement/accounting and child records are documented above |
| Invalid validator-agreed judgment | Intermediate source-backed contract `0x01E4E352Ac9b70138488cc654ea76aaDDff2d9F4`, evaluation [`0x5fc6a1cd5204613a6c7132597f727941e030a2a3d4dd3dcfb65438c51d4f3e5d`](https://explorer-studio.genlayer.com/tx/0x5fc6a1cd5204613a6c7132597f727941e030a2a3d4dd3dcfb65438c51d4f3e5d) | Finalized `MAJORITY_AGREE` at the protocol layer but leader execution `ERROR` with rollback `invalid validator-agreed judgment`; project remained frozen with its `0.001 GEN` escrow and no payout. This was the runtime-isolation finding that led to the explicit validator-cache attestation in commit `852a625`; it is diagnostic evidence, not current-contract evidence |
| Invalid external reference registration | Intermediate source-backed contract, rejected `.mdx` reference creation [`0x2d6badbe65e221159cc65e0c0235c4ee1da4010028394dda26e74b7d1627ba99`](https://explorer-studio.genlayer.com/tx/0x2d6badbe65e221159cc65e0c0235c4ee1da4010028394dda26e74b7d1627ba99) | Finalized with leader `ERROR` because the bounded source policy allows only `.md`, `.txt`, `.json` and `.csv`; no project or escrow was created |

This is one accepted current source-augmented model outcome plus bounded fail-closed diagnostics, not a statistically meaningful convergence rate. The repository's 48 offline and 30 Direct Mode tests cover the requested adversarial decision classes with deterministic/mocked outputs; they do not claim independent production-model convergence for every matrix case. No false acceptance or state mutation from the two rejected diagnostics was observed.

## F. Historical live evidence

The earlier successful [5,3,3] settlement, incomplete-deliverable refund and same-evidence retry belong to historical contract 0x49a63512878c639C8205c7f0c32eeFa78E8aBF3f, source SHA 0AA8AACDDF5E65B72B60BFFC057F8393B46B586B7B60185C815CD1D50DDDCCAF, deployment [`0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b`](https://explorer-studio.genlayer.com/tx/0x2016405aad3d64cec94db8065c02d647b9019d7f28d9d5dd0fe75b4f3fca435b). They are preserved as historical evidence and are not current-contract results:

- successful old evaluation [`0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8`](https://explorer-studio.genlayer.com/tx/0xfa0f5ead76400df101bd1d2b4219312bde47c4d229eb4a3d150041cd93b6c8a8), old child sends [`0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875`](https://explorer-studio.genlayer.com/tx/0x9bdee49c353b52cd900027322f94202a7e6a8acf1bdf90ae8bf6715415e9d875), [`0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345`](https://explorer-studio.genlayer.com/tx/0x936c2e734e5a8070ef2ff521302c8609122581c3507d0655fc0f4ff71c902345), [`0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03`](https://explorer-studio.genlayer.com/tx/0x57288bdc5ab30007e348a0496300549812359ba79f74eff8519e02bce8d3cc03);
- failed old evaluation [`0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b`](https://explorer-studio.genlayer.com/tx/0xad470281c94843b2d100137484e6332ba0c05f7cf6d6c8706fee369bbc69ae8b), then retry [`0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078`](https://explorer-studio.genlayer.com/tx/0x7704de27424830c93636906377615d8d8d207d10e9575222d9bc63ae07309078);
- old refund child [`0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd`](https://explorer-studio.genlayer.com/tx/0x8bde4b39b0bd0387a6422a88b2893ca5e609829a6fbf6185f43c45bec267e4bd) returned the full 90000000000000000 wei pool to the old sponsor.

This historical record proves that a disagreement can fail closed and that a later evaluation over unchanged evidence can resolve to a refund. It does not promise universal recovery for future validator disagreement.

## G. Browser, SDK and automated evidence

- **Manual connected-wallet QA:** Convert Chrome profile, injected Rabby, StudioNet chain 61999, production Vercel application. The signed create/fund transaction [`0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474`](https://explorer-studio.genlayer.com/tx/0x96f69cb434c0291a3b314b9d74e3f8204eec57c8888a7ac8807274eecaa20474) targeted the historical `0x03EEC...` deployment and was read back after refresh/reconnect. The historical project 2 joins, packets, assembly, responses, freeze, evaluation and displayed rewards were also signed through the production UI. In this closeout, the existing Convert profile loaded the rebuilt production alias and read current project 1, verified-source details, contract address and Consensus classifications after a cache-busting reload; no new current-contract browser signature is claimed.
- **SDK/RPC evidence:** Direct readbacks, source-byte comparison, contract schema, child Send rows, recipient balance checks and the exact current project/accounting state were independently verified through StudioNet RPC/Explorer.
- **Automated browser evidence:** two Playwright smoke projects (desktop and mobile) cover navigation/form rendering. They are not a substitute for the manual wallet-signing record.
- **Recovery behavior:** the frontend scopes pending records by chain, wallet, contract, method and transaction hash; it reconciles finalized execution outcomes, clears permanently failed finalized records, refreshes after account/network changes and prevents a duplicate write while a transaction is unresolved. The duplicate response above is a live historical negative example that did not corrupt state. The current source-mode lifecycle was CLI/RPC-driven, not a current browser-wallet write proof.

No seed phrase, private key, keystore password or browser secret is included in the repository or this ledger.

## H. Refund and disagreement status

| Scenario | Status | Evidence |
| --- | --- | --- |
| Current-contract recruitment-expiry refund | Not executed | The source-mode project recruited all three wallets; no current-contract recruitment-refund receipt exists |
| Current-contract incomplete-deliverable refund | Implemented and covered by offline/Direct Mode; no current live receipt | Regression tests verify informational merit with settlement weights [0,0,0] |
| Historical incomplete-deliverable refund | Verified | Historical 0x49 retry and refund child above |
| Historical inconclusive consensus | Verified fail-closed | Historical failed evaluation left frozen evidence/escrow unchanged before retry |
| Current-contract successful retry after disagreement | Not repeated; current source-mode project 1 reached an accepted outcome on its first evaluation | Same-evidence retry behavior remains covered by tests and historical live evidence |

## I. Readiness assessment

- **GenLayer Fit:** the current contract has a live source-augmented assessment over frozen participant evidence plus a commit-pinned external reference; the evidence still does not prove human authorship, universal originality or non-collusion.
- **Intelligent Contract Quality:** the targeted attribution, duplicate, anchor, completion/refund and deterministic-settlement controls are implemented and regression-tested; the current run exposed the callbackless child-transfer limitation honestly and disagreement can remain fail-closed.
- **Engineering Quality:** pinned tests, semantic lint, exact source registration, live RPC readbacks, source-mode consensus evidence and the current Ready Vercel deployment are present; the exact final CI run is recorded with the post-closeout commit.
- **Frontend/UX:** the rebuilt production application was read-verified in Convert Chrome against the new source-backed project, while the only current-contract wallet write remains untested in this closeout and the current-contract live refund is not claimed.

Reviewers should inspect the source, final CI run, deployment receipt, current source-mode project 1 readback, parent/child records and historical recipient accounts directly. This ledger does not award portal scores.
