# Source-matched deployment runbook

This runbook is intentionally executable only with an authorized, funded StudioNet wallet and the repository's GitHub/Vercel credentials. Do not put a private key or server wallet in this repository or frontend.

Current verification record (2026-10-24): none of the three reported hashes is a deployed Creditsplit contract. Direct RPC and the official Studio Explorer show that each was routed to the configured StudioNet consensus-main endpoint `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575` as a zero-value protocol submission. The explorer labels them `FINALIZED · Send` because it exposes the outer protocol transaction; the Consensus tab contains a `signed_rollup_transaction` with the submitted Creditsplit source. Each reached finality without validator assignment: `Initial Validators -`, `Consensus Result -`, zero rounds/votes, `consensus_data=null`, `result_name=NO_MAJORITY`, `txExecutionResultName=UNKNOWN`, `triggered_transactions=[]`, and `value_credited=false`.

This narrows the root cause to a StudioNet consensus-assignment/activation failure for these submissions, not a missing source file or an ordinary wallet-to-wallet send. It does not prove whether the remaining subcause is CLI/runtime encoding or a per-transaction protocol failure: `gen_dbg_traceTransaction` and `gen_getTransactionLifecycle` are unsupported by this RPC, and the three transactions have no validator/round data to inspect. The Studio Explorer dashboard currently reports active validators and recent successful deployments, so a network-wide consensus outage is not established. No Creditsplit deployment is claimed.

The configured protocol address is `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575` (`...aFC32...`). The separately supplied address `0xb7278A61aa25c888815aF032Ad3cC52fF24fE575` (`...aF032...`) has zero balance and no code at the queried block and is not the configured protocol endpoint. `eth_getCode` returns `0x` for the protocol endpoint because it is not an Intelligent Contract address; `gen_getContractCode` returns `Contract not found`, confirming that it is neither a Creditsplit IC nor a registered Ghost.

The minimal no-LLM diagnostic contract passed the pinned GenVM linter, but its deployment could not yet be submitted: the authorized `praest-deployer` keystore is currently locked and the CLI correctly requested its password. No password was guessed, logged or stored. Unlock the account locally with the authorized credential, then run exactly one diagnostic deployment before retrying Creditsplit.

## Contract

1. Check out the exact intended `main` commit and confirm `git status --short` is empty.
2. Confirm Node 22, Python 3.12, local `genlayer --version` `0.39.1`, `genlayer-js` `1.1.8`, `genlayer-test` `0.29.2`, and `genvm-linter` `0.11.0`.
3. Run the offline suite, Direct Mode suite, and semantic linter with `GENVM_VERSION=v0.2.16`. Record the full JSON linter output. Direct Mode is pinned to this compatible universal bundle for `genlayer-test==0.29.2`.
4. Select StudioNet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`. Confirm the CLI network configuration before signing.
5. First deploy `contracts/DeploymentDiagnostic.py` once, using the same local CLI, wallet, RPC and chain. Treat it as a routing diagnostic only. Inspect its explorer type, validator assignment, execution result, returned address, `gen_getContractCode`, and `get_value()` readback. If it fails before validator assignment like the three attempts above, stop spending and classify the shared external blocker; do not submit Creditsplit again.
6. Only if the diagnostic succeeds, deploy `contracts/Creditsplit.py` from the exact final `main` commit. Record the deployment transaction hash, contract address, source SHA-256, and final execution result.
7. Read the deployed contract's initial accounting and project count. Do not reuse an address after a material source change.
8. Set only `NEXT_PUBLIC_CONTRACT_ADDRESS` in the frontend's build environment. `frontend/lib/chain.ts` fixes the RPC and chain to StudioNet 61999 and uses the injected EIP-1193 provider.
9. After every write, record the transaction hash, `FINALIZED` status, `txExecutionResultName`, and the resulting contract read. `FINALIZED` alone is not successful execution.
10. For each settlement, inspect triggered transaction IDs and each external-message result, then verify recipient balance deltas. `EMITTED_UNVERIFIED` is deliberately not a payment receipt.

## Vercel

Use `frontend/` as the Vercel project root. Build with Node 22 and the committed `frontend/package-lock.json`. Configure only `NEXT_PUBLIC_CONTRACT_ADDRESS` after the source-matched deployment is proven. Visit the public URL on desktop and mobile and verify reads, wallet connection, signing, pending recovery and refresh behavior.

## Required transaction ledger

Record sponsor funding, each of the three joins, at least one packet per wallet, assembler publication or fallback, attribution responses, freeze, evaluation, every triggered external message, and the final readback. Also record recruitment refund, incomplete-deliverable refund, one adversarial attribution case and one unauthorized-call revert. Include explorer links and actual balance deltas; do not replace them with browser mocks.
