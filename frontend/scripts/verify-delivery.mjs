#!/usr/bin/env node

/**
 * Read-only settlement verifier for a finalized Creditsplit project.
 *
 * This tool deliberately separates:
 *   - the parent adjudication and deterministic allocation;
 *   - emitted child transfer records; and
 *   - independently observed beneficiary balance changes.
 *
 * It never signs, broadcasts, retries, or changes contract state. Historical
 * balance deltas are only reported when the caller supplies both block tags.
 */

import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const DEFAULT_RPC = 'https://studio.genlayer.com/api';
const HASH = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function usage() {
  console.error(`Usage:
  node frontend/scripts/verify-delivery.mjs \
    --rpc https://studio.genlayer.com/api \
    --contract 0x... \
    --project 2 \
    --parent 0x... \
    --recipient 0xA...,0xB...,0xC... \
    --child 0xA...,0xB...,0xC... \
    [--before-block 0x...] [--after-block 0x...]

All options are read-only. --before-block and --after-block must be supplied
together to calculate historical balance deltas.`);
}

function parseArgs(argv) {
  const values = { rpc: DEFAULT_RPC, recipient: [], child: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    if (name === 'help') {
      usage();
      process.exit(0);
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
    i += 1;
    if (name === 'recipient' || name === 'child') values[name] = value.split(',').filter(Boolean);
    else values[name] = value;
  }
  if (!values.contract || !ADDRESS.test(values.contract)) throw new Error('--contract must be an EVM address');
  if (!Number.isInteger(Number(values.project)) || Number(values.project) < 0) throw new Error('--project must be a non-negative integer');
  if (!HASH.test(values.parent)) throw new Error('--parent must be a transaction hash');
  if (values.recipient.length !== values.child.length) throw new Error('--recipient and --child must contain the same number of entries');
  if (!values.recipient.every((value) => ADDRESS.test(value))) throw new Error('Every --recipient value must be an EVM address');
  if (!values.child.every((value) => HASH.test(value))) throw new Error('Every --child value must be a transaction hash');
  if ((values.beforeBlock && !values.afterBlock) || (!values.beforeBlock && values.afterBlock)) {
    throw new Error('--before-block and --after-block must be supplied together');
  }
  // StudioNet's gen_call path has historically treated contract-address casing
  // as significant, so preserve the caller's deployment-record spelling for
  // the SDK read. RPC transaction hashes and address comparisons remain
  // case-insensitive elsewhere in this verifier.
  return { ...values, project: Number(values.project), parent: values.parent.toLowerCase() };
}

function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

async function rpc(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: `${Date.now()}-${Math.random()}`, method, params }),
  });
  if (!response.ok) throw new Error(`${method} returned HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body.result;
}

async function optionalRpc(rpcUrl, method, params) {
  try {
    return { supported: true, value: jsonSafe(await rpc(rpcUrl, method, params)) };
  } catch (error) {
    return { supported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function firstRecord(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const first = value.find((item) => item && typeof item === 'object');
      if (first) return first;
    } else if (value && typeof value === 'object') {
      return value;
    }
  }
  return null;
}

function getField(record, ...names) {
  if (!record) return undefined;
  for (const name of names) if (record[name] !== undefined) return record[name];
  return undefined;
}

function normalizeStatus(value) {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

function summarize(raw) {
  const record = firstRecord(raw);
  const consensus = firstRecord(getField(record, 'consensusData', 'consensus_data'));
  const leader = firstRecord(getField(consensus, 'leader_receipt', 'leaderReceipt'));
  return {
    status: normalizeStatus(getField(record, 'statusName', 'status_name', 'status')),
    execution: normalizeStatus(getField(record, 'txExecutionResultName', 'tx_execution_result_name', 'executionResultName', 'execution_result')),
    result: normalizeStatus(getField(record, 'resultName', 'result_name', 'consensusResult', 'consensus_result')),
    leaderExecution: normalizeStatus(getField(leader, 'execution_result', 'executionResult', 'statusName', 'status_name')),
    valueCredited: getField(record, 'value_credited', 'valueCredited'),
  };
}

function compactTransaction(raw) {
  const record = firstRecord(raw);
  if (!record) return raw;
  const consensus = firstRecord(getField(record, 'consensusData', 'consensus_data'));
  const leaderReceipts = getField(consensus, 'leader_receipt', 'leaderReceipt');
  const validators = getField(consensus, 'validators');
  const lastRound = firstRecord(getField(record, 'last_round', 'lastRound'));
  return {
    hash: getField(record, 'hash', 'transactionHash', 'tx_id', 'txId'),
    from: getField(record, 'from', 'from_address', 'sender', 'origin_address'),
    to: getField(record, 'to', 'to_address', 'recipient'),
    value: getField(record, 'value'),
    status: getField(record, 'status', 'statusName', 'status_name'),
    result: getField(record, 'result_name', 'resultName', 'result'),
    execution: getField(record, 'execution_result', 'txExecutionResultName', 'tx_execution_result_name', 'txExecutionResult'),
    leaderExecution: firstRecord(leaderReceipts)?.execution_result,
    validatorVotes: getField(lastRound, 'validator_votes_name', 'validatorVotesName') ?? Object.values(getField(consensus, 'votes') ?? {}),
    validatorCount: Array.isArray(validators) ? validators.length : undefined,
    valueCredited: getField(record, 'value_credited', 'valueCredited'),
    triggeredBy: getField(record, 'triggered_by', 'triggeredBy'),
    triggeredTransactions: getField(record, 'triggered_transactions', 'triggeredTransactions'),
    pendingTransactions: getField(record, 'pending_transactions', 'pendingTransactions'),
    messages: getField(record, 'messages'),
    txExecutionHash: getField(record, 'tx_execution_hash', 'txExecutionHash'),
    blockNumber: getField(record, 'blockNumber', 'block_number'),
    receiptStatus: getField(record, 'status') === '0x1' ? 'SUCCESS' : getField(record, 'status') === '0x0' ? 'REVERTED' : undefined,
  };
}

function compactOptional(entry) {
  return entry.supported && entry.value && typeof entry.value === 'object'
    ? { ...entry, value: compactTransaction(entry.value) }
    : entry;
}

async function readProject(client, contract, project) {
  try {
    const raw = await client.readContract({
      address: contract,
      functionName: 'get_project',
      args: [project],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { supported: true, value: jsonSafe(parsed) };
  } catch (error) {
    return { supported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function asWei(value) {
  try { return BigInt(String(value)); } catch { return null; }
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function addressEqual(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
}

function verifyReadback(project, recipients, children) {
  const contradictions = [];
  if (!project || typeof project !== 'object') return { contradictions: ['Project readback is unavailable'] };
  const pool = asWei(project.pool_wei);
  const amounts = normalizeList(project.amounts_wei).map(asWei);
  const contributors = normalizeList(project.contributors);
  const weights = normalizeList(project.weights);
  if (pool === null) contradictions.push('Project pool_wei is missing or not an integer');
  if (amounts.length !== recipients.length) contradictions.push('Project allocation count does not match recipient count');
  if (contributors.length !== recipients.length) contradictions.push('Project contributor count does not match recipient count');
  if (project.status !== 'SETTLEMENT_EMITTED') contradictions.push(`Project status is ${project.status ?? 'missing'}, not SETTLEMENT_EMITTED`);
  if (project.completion !== true) contradictions.push('Project completion is not true');
  if (!normalizeList(project.criteria_status).every((value) => value === 'met')) contradictions.push('Not all acceptance criteria are met');
  if (project.settlement !== 'EMITTED_UNVERIFIED') contradictions.push(`Unexpected settlement label: ${project.settlement ?? 'missing'}`);
  if (amounts.some((value) => value === null)) contradictions.push('One or more allocations are not integer wei');
  if (pool !== null && amounts.every((value) => value !== null) && amounts.reduce((sum, value) => sum + value, 0n) !== pool) {
    contradictions.push('Deterministic allocations do not conserve the project pool');
  }
  recipients.forEach((recipient, index) => {
    if (!addressEqual(contributors[index], recipient)) contradictions.push(`Recipient ${index} does not match the authenticated contributor slot`);
    if (weights[index] === undefined) contradictions.push(`Missing weight for recipient ${index}`);
    if (children[index]?.to && !addressEqual(children[index].to, recipient)) contradictions.push(`Child ${index} recipient differs from the expected beneficiary`);
    if (children[index]?.value !== undefined && amounts[index] !== null && asWei(children[index].value) !== amounts[index]) contradictions.push(`Child ${index} value differs from the deterministic allocation`);
  });
  return { contradictions, poolWei: pool?.toString(), amountsWei: amounts.map((value) => value?.toString() ?? null), weights };
}

async function balanceAt(rpcUrl, address, block) {
  const result = await rpc(rpcUrl, 'eth_getBalance', [address, block]);
  return asWei(BigInt(result).toString())?.toString() ?? null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = {
    verifier: 'creditsplit-read-only-delivery-verifier',
    rpc: args.rpc,
    contract: args.contract,
    projectId: args.project,
    parent: { hash: args.parent },
    children: [],
    readback: null,
    balanceEvidence: { historicalDeltas: null, currentBalances: [] },
    contradictions: [],
  };
  report.chainId = await optionalRpc(args.rpc, 'eth_chainId', []);
  report.parent.transaction = await optionalRpc(args.rpc, 'eth_getTransactionByHash', [args.parent]);
  report.parent.status = await optionalRpc(args.rpc, 'gen_getTransactionStatus', [args.parent]);
  report.parent.genReceipt = await optionalRpc(args.rpc, 'gen_getTransactionReceipt', [args.parent]);
  report.parent.evmReceipt = await optionalRpc(args.rpc, 'eth_getTransactionReceipt', [args.parent]);
  const parentRaw = report.parent.genReceipt.supported
    ? report.parent.genReceipt.value
    : report.parent.transaction.supported ? report.parent.transaction.value : report.parent.status.value;
  report.parent.summary = summarize(parentRaw);
  report.parent.transaction = compactOptional(report.parent.transaction);
  report.parent.genReceipt = compactOptional(report.parent.genReceipt);
  report.parent.evmReceipt = compactOptional(report.parent.evmReceipt);

  const client = createClient({ chain: studionet, endpoint: args.rpc });
  report.readback = await readProject(client, args.contract, args.project);

  for (let index = 0; index < args.child.length; index += 1) {
    const hash = args.child[index];
    const child = { hash, expectedRecipient: args.recipient[index] };
    child.transaction = await optionalRpc(args.rpc, 'eth_getTransactionByHash', [hash]);
    child.status = await optionalRpc(args.rpc, 'gen_getTransactionStatus', [hash]);
    child.genReceipt = await optionalRpc(args.rpc, 'gen_getTransactionReceipt', [hash]);
    child.evmReceipt = await optionalRpc(args.rpc, 'eth_getTransactionReceipt', [hash]);
    const childTx = child.transaction.value;
    child.to = childTx?.to ?? childTx?.to_address ?? childTx?.recipient;
    child.value = childTx?.value;
    child.summary = summarize(child.genReceipt.supported
      ? child.genReceipt.value
      : child.transaction.supported ? child.transaction.value : child.status.value);
    child.transaction = compactOptional(child.transaction);
    child.genReceipt = compactOptional(child.genReceipt);
    child.evmReceipt = compactOptional(child.evmReceipt);
    report.children.push(child);
  }

  const checked = verifyReadback(report.readback.value, args.recipient, report.children);
  report.allocationCheck = checked;
  report.children.forEach((child, index) => {
    if (child.summary.valueCredited !== true) report.contradictions.push(`Child ${index} does not report value_credited=true`);
    if (child.summary.status !== 'FINALIZED') report.contradictions.push(`Child ${index} is not FINALIZED`);
  });
  report.contradictions.push(...checked.contradictions);
  if (report.parent.summary.status !== 'FINALIZED') report.contradictions.push('Parent is not FINALIZED');
  if (report.parent.summary.result && report.parent.summary.result !== 'MAJORITY_AGREE') report.contradictions.push(`Parent consensus is ${report.parent.summary.result}, not MAJORITY_AGREE`);
  if (report.parent.summary.execution && !['FINISHED_WITH_RETURN', 'SUCCESS'].includes(report.parent.summary.execution)) report.contradictions.push(`Parent execution is ${report.parent.summary.execution}`);

  for (const recipient of args.recipient) {
    const current = await optionalRpc(args.rpc, 'eth_getBalance', [recipient, 'latest']);
    report.balanceEvidence.currentBalances.push({ address: recipient, latest: current });
  }
  if (args.beforeBlock && args.afterBlock) {
    report.balanceEvidence.historicalDeltas = [];
    for (const recipient of args.recipient) {
      const before = await balanceAt(args.rpc, recipient, args.beforeBlock);
      const after = await balanceAt(args.rpc, recipient, args.afterBlock);
      report.balanceEvidence.historicalDeltas.push({ address: recipient, before, after, deltaWei: (BigInt(after) - BigInt(before)).toString() });
    }
  }
  const parentExecution = report.parent.summary.execution ?? report.parent.summary.leaderExecution;
  const parentSuccess = report.parent.summary.status === 'FINALIZED' && report.parent.summary.result === 'MAJORITY_AGREE' && ['FINISHED_WITH_RETURN', 'SUCCESS'].includes(parentExecution);
  const exactChildren = report.children.length === args.recipient.length && report.children.every((child, index) => child.summary.valueCredited === true && addressEqual(child.to, args.recipient[index]));
  report.verdict = report.contradictions.length === 0 && parentSuccess && exactChildren
    ? report.balanceEvidence.historicalDeltas ? 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_VERIFIED' : 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED'
    : 'INCONCLUSIVE_OR_CONTRADICTED';
  report.limitations = [
    'EMITTED_UNVERIFIED remains the contract settlement label.',
    'value_credited=true is recorded separately from child execution success.',
    report.balanceEvidence.historicalDeltas ? 'Historical balance deltas were calculated from caller-supplied block tags.' : 'No exact beneficiary balance delta is claimed without caller-supplied historical block tags.',
  ];
  console.log(JSON.stringify(jsonSafe(report), null, 2));
  process.exitCode = report.verdict === 'INCONCLUSIVE_OR_CONTRADICTED' ? 2 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exitCode = 1;
});
