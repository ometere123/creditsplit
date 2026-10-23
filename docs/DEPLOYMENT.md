# Source-matched deployment runbook

This runbook is intentionally executable only with an authorized, funded StudioNet wallet and the repository's GitHub/Vercel credentials. Do not put a private key or server wallet in this repository or frontend.

Current verification record (2026-10-23): the final source was submitted to StudioNet from the active funded keystore, but deployment transaction `0x5871890bcccbcb55d1b3980f28e5e04953cfdafc21ddee5a7147d7b9e77fbe86` finalized as `Undetermined` with `result_name=NO_MAJORITY`, `txExecutionResultName=UNKNOWN`, `consensus_data=null`, and `value_credited=false`. No contract address was created. The same RPC reports that consensus/staking contracts are unavailable, so this is an external StudioNet consensus condition—not evidence of a successful deployment.

## Contract

1. Check out the exact intended `main` commit and confirm `git status --short` is empty.
2. Confirm Node 22, Python 3.12, local `genlayer --version` `0.39.1`, `genlayer-js` `1.1.8`, `genlayer-test` `0.29.2`, and `genvm-linter` `0.11.0`.
3. Run the offline suite, Direct Mode suite, and semantic linter with `GENVM_VERSION=v0.2.16`. Record the full JSON linter output. Direct Mode is pinned to this compatible universal bundle for `genlayer-test==0.29.2`.
4. Select StudioNet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`. Confirm the CLI network configuration before signing.
5. Deploy `contracts/Creditsplit.py` from the exact commit. Record the deployment transaction hash, contract address, source SHA-256, and final execution result.
6. Read the deployed contract's initial accounting and project count. Do not reuse an address after a material source change.
7. Set only `NEXT_PUBLIC_CONTRACT_ADDRESS` in the frontend's build environment. `frontend/lib/chain.ts` already fixes the RPC and chain to StudioNet 61999 and uses the injected EIP-1193 provider.
8. After every write, record the transaction hash, `FINALIZED` status, `txExecutionResultName`, and the resulting contract read. `FINALIZED` alone is not successful execution.
9. For each settlement, inspect triggered transaction IDs and each external-message result, then verify recipient balance deltas. `EMITTED_UNVERIFIED` is deliberately not a payment receipt.

## Vercel

Use `frontend/` as the Vercel project root. Build with Node 22 and the committed `frontend/package-lock.json`. Configure only `NEXT_PUBLIC_CONTRACT_ADDRESS` after the source-matched deployment is proven. Visit the public URL on desktop and mobile and verify reads, wallet connection, signing, pending recovery and refresh behavior.

## Required transaction ledger

Record sponsor funding, each of the three joins, at least one packet per wallet, assembler publication or fallback, attribution responses, freeze, evaluation, every triggered external message, and the final readback. Also record recruitment refund, incomplete-deliverable refund, one adversarial attribution case and one unauthorized-call revert. Include explorer links and actual balance deltas; do not replace them with browser mocks.
