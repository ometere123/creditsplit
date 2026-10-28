# Architecture and canonical state machine

```text
Sponsor / 3 invited wallets / read-only observers
      │ EIP-1193 (MetaMask)
Next.js + GenLayerJS@1.1.8 (Vercel, no server keys)
      │ signed writes + final-state reads
StudioNet 61999 RPC https://studio.genlayer.com/api
      │
Creditsplit Python Intelligent Contract (one current deployment)
      ├─ Sponsor-payable escrow + invitation-only membership
      ├─ Two bounded, append-only authored submissions per slot + sequence/registered build-on refs
      ├─ Three immutable project-specific acceptance criteria
      ├─ Single assembler output or deterministic deadline fallback
      ├─ Signed responses, acknowledgment deadline, frozen evidence SHA-256
      ├─ GenVM run_nondet_unsafe leader + independently rerun validators with exact packet anchors
      ├─ Optional commit-pinned verified source retrieval + SHA-256/factual-status checks
      ├─ Validator-agreed materiality classifications → deterministic 0/1/3/5 bands
      ├─ Deterministic wei allocation + on-finalization EOA GEN messages
      ├─ Unresolved frozen-project exit only with unanimous participant approval
      └─ Public project list, full history, reputation + accounting views
```

The authoritative current deployment is `0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D` on StudioNet `61999`, source SHA-256 `309998d18ce351f45af55c34dcab3481c8bb923f74b9d2da5249e0039c3f6977`. Earlier addresses and their lifecycles are historical evidence only; they are not interchangeable with the current frontend target.

## States

`RECRUITING → ACTIVE → ASSEMBLY → REVIEW → FROZEN → SETTLEMENT_EMITTED | REFUND_EMITTED`

In `RECRUITING`, expired and incomplete recruitment can transition directly to `REFUND_EMITTED` through `refund_unstarted_project`. `ACTIVE` can close early if all mark complete; otherwise any caller can advance it after the deadline. `ASSEMBLY` can end on an attributed final document, or deadline-expired fallback that retains latest submissions and marks `fallback_assembly`. `REVIEW` ends when all three acknowledge or its deadline expires. `FROZEN` can be resolved via GenLayer consensus; a failed evaluation leaves the same digest and escrow in place so a later evaluation can retry safely. The current release also permits `approve_unresolved_refund` only after the sponsor and all three contributors have approved the same frozen project; it is a conditional unanimous exit, not unilateral cancellation.

The final states refer to emitted external messages, **not verified recipient payment**. The runtime does not provide a trusted callback for universally successful EOA transfers. Only explorer/ghost execution and beneficiary balance proof establishes delivery. Never render `paid` solely based on IC state.

## Read/write interface

Writes: `create_project(title,brief,a,b,c,assembler_slot)` payable, `create_project_with_criteria(title,brief,criteria_json,a,b,c,assembler_slot)` payable, `create_project_with_verified_source(title,brief,criteria_json,source_url,source_digest,a,b,c,assembler_slot)` payable, `join_project(id)`, `submit_contribution(id,content)`, `submit_contribution_with_references(id,content,references_json)`, `finish_contributing(id)`, `submit_final_artifact(id,text,source_refs_json)`, `respond_attribution(id,response)`, `advance_project(id)`, `freeze_project(id)`, `evaluate_contributions(id)`, `refund_unstarted_project(id)`, `approve_unresolved_refund(id)`.

Views: `get_project(id)`, `get_project_count()`, `list_projects(start,count≤20)`, `get_profile(wallet)`, `get_accounting()`.

Views return UTF-8 JSON strings for ABI simplicity. `list_projects` returns bounded summaries; `get_project` returns public detailed evidence, including informational merit separately from settlement weights. `create_project` remains a backward-compatible generic-criteria path; it shares the same authorization, escrow, freeze, consensus and settlement safeguards as `create_project_with_criteria`, while the latter is preferred for project-specific requirements.

## Trust boundaries

The contract alone controls state, eligibility, evidence freeze, transfer amounts, and accounting. Browser state controls **nothing authoritative**. The leader's narrative is not binding; validators independently reassess the same actual passages and frozen criteria. Only agreed payment-controlling classifications and contract-derived weights govern settlement. The default workflow is closed evidence. The optional verified-source workflow accepts only a raw GitHub file pinned to a commit and a sponsor-registered SHA-256 digest; both leader and validators retrieve and verify that exact content through GenLayer nondeterministic web access. Source verification can support, contradict or leave factual claims unverifiable, but it does not establish human identity, originality or non-collusion. Each wallet acts as its own authenticated on-chain principal.
