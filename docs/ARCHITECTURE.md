# Architecture and canonical state machine

```text
Sponsor / 3 invited wallets / read-only observers
      │ EIP-1193 (MetaMask)
Next.js + GenLayerJS@1.1.8 (Vercel, no server keys)
      │ signed writes + final-state reads
StudioNet 61999 RPC https://studio.genlayer.com/api
      │
Creditsplit Python Intelligent Contract (one deployment)
      ├─ Sponsor-payable escrow + invitation-only membership
      ├─ Two bounded, append-only authored submissions per slot + sequence/registered build-on refs
      ├─ Three immutable project-specific acceptance criteria
      ├─ Single assembler output or deterministic deadline fallback
      ├─ Signed responses, acknowledgment deadline, frozen evidence SHA-256
      ├─ GenVM run_nondet_unsafe leader + independently rerun validators with exact packet anchors
      ├─ Validator-agreed materiality classifications → deterministic 0/1/3/5 bands
      ├─ Deterministic wei allocation + on-finalization EOA GEN messages
      └─ Public project list, full history, reputation + accounting views
```

## States

`RECRUITING → ACTIVE → ASSEMBLY → REVIEW → FROZEN → SETTLEMENT_EMITTED | REFUND_EMITTED`

In `RECRUITING`, expired and incomplete recruitment can transition directly to `REFUND_EMITTED` through `refund_unstarted_project`. `ACTIVE` can close early if all mark complete; otherwise any caller can advance it after the deadline. `ASSEMBLY` can end on an attributed final document, or deadline-expired fallback that retains latest submissions and marks `fallback_assembly`. `REVIEW` ends when all three acknowledge or its deadline expires. `FROZEN` can only be resolved via GenLayer consensus; a failed evaluation leaves the same digest and escrow in place so a later evaluation can retry safely.

The final states refer to emitted external messages, **not verified recipient payment**. The runtime does not provide a trusted callback for universally successful EOA transfers. Only explorer/ghost execution and beneficiary balance proof establishes delivery. Never render `paid` solely based on IC state.

## Read/write interface

Writes: `create_project(title,brief,a,b,c,assembler_slot)` payable, `create_project_with_criteria(title,brief,criteria_json,a,b,c,assembler_slot)` payable, `join_project(id)`, `submit_contribution(id,content)`, `submit_contribution_with_references(id,content,references_json)`, `finish_contributing(id)`, `submit_final_artifact(id,text,source_refs_json)`, `respond_attribution(id,response)`, `advance_project(id)`, `freeze_project(id)`, `evaluate_contributions(id)`, `refund_unstarted_project(id)`.

Views: `get_project(id)`, `get_project_count()`, `list_projects(start,count≤20)`, `get_profile(wallet)`, `get_accounting()`.

Views return UTF-8 JSON strings for ABI simplicity. `list_projects` returns bounded summaries; `get_project` returns public detailed evidence, including informational merit separately from settlement weights.

## Trust boundaries

The contract alone controls state, eligibility, evidence freeze, transfer amounts, and accounting. Browser state controls **nothing authoritative**. The leader's narrative is not binding; validators independently reassess the same actual passages and frozen criteria. Only agreed payment-controlling classifications and contract-derived weights govern settlement. Prompts never fetch mutable external sources. Each wallet acts as its own authenticated on-chain principal; no identity/originality outside signed submissions is claimed.
