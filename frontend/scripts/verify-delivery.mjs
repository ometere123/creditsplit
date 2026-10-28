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
import { pathToFileURL } from 'node:url';

const DEFAULT_RPC = 'https://studio.genlayer.com/api';
const HASH = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const STUDIO_CHAIN_ID = '0xf22f';
const CREDIT_SPLIT_STATUS_BY_NUMBER = ['UNINITIALIZED', 'PENDING', 'PROPOSING', 'COMMITTING', 'REVEALING', 'ACCEPTED', 'UNDETERMINED', 'FINALIZED'];
const CONSENSUS_BY_NUMBER = ['IDLE', 'MAJORITY_AGREE', 'MAJORITY_DISAGREE', 'MAJORITY_TIMEOUT', 'DETERMINISTIC_VIOLATION', 'NO_MAJORITY', 'MAJORITY_AGREE', 'MAJORITY_DISAGREE'];
const EXECUTION_BY_NUMBER = ['NOT_VOTED', 'FINISHED_WITH_RETURN', 'FINISHED_WITH_ERROR', 'TIMEOUT', 'NONDET_DISAGREE', 'DETERMINISTIC_VIOLATION'];
const REFUND_REASONS = new Set(['INCOMPLETE_DELIVERABLE', 'RECRUITMENT_EXPIRED', 'UNRESOLVED_UNANIMOUS_EXIT']);

function usage() {
  console.error(`Usage:
  node frontend/scripts/verify-delivery.mjs \
    --rpc https://studio.genlayer.com/api \
    --contract 0x... \
    --project 2 \
    --parent 0x... \
    --recipient 0xA...,0xB...,0xC... \
    --child 0xA...,0xB...,0xC... \
    [--mode payout|refund|auto] \
    [--before-block 0x...] [--after-block 0x...]

All options are read-only. --before-block and --after-block must be supplied
together to inspect historical balance evidence. A balance delta is not
attributed to this settlement unless the surrounding block activity is also
authoritatively attributable.`);
}

export function parseArgs(argv) {
  const values = { rpc: DEFAULT_RPC, recipient: [], child: [], mode: 'auto' };
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
  if (!values.recipient.length) throw new Error('At least one expected recipient and child are required');
  if (!values.recipient.every((value) => ADDRESS.test(value))) throw new Error('Every --recipient value must be an EVM address');
  if (!values.child.every((value) => HASH.test(value))) throw new Error('Every --child value must be a transaction hash');
  if (!['auto', 'payout', 'refund'].includes(values.mode)) throw new Error('--mode must be payout, refund or auto');
  if (new Set(values.recipient.map((value) => value.toLowerCase())).size !== values.recipient.length) throw new Error('Duplicate recipient addresses are not allowed');
  if (new Set(values.child.map((value) => value.toLowerCase())).size !== values.child.length) throw new Error('Duplicate child transaction hashes are not allowed');
  if ((values.beforeBlock && !values.afterBlock) || (!values.beforeBlock && values.afterBlock)) {
    throw new Error('--before-block and --after-block must be supplied together');
  }
  for (const [name, value] of [['before-block', values.beforeBlock], ['after-block', values.afterBlock]]) {
    if (value !== undefined && (!/^0x[0-9a-fA-F]+$/.test(value) || BigInt(value) < 0n)) throw new Error(`--${name} must be a hexadecimal block identifier`);
  }
  if (values.beforeBlock && BigInt(values.beforeBlock) >= BigInt(values.afterBlock)) throw new Error('--before-block must precede --after-block');
  // StudioNet's gen_call path has historically treated contract-address casing
  // as significant, so preserve the caller's deployment-record spelling for
  // the SDK read. RPC transaction hashes and address comparisons remain
  // case-insensitive elsewhere in this verifier.
  return { ...values, project: Number(values.project), parent: values.parent.toLowerCase(), child: values.child.map((value) => value.toLowerCase()) };
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
  for (const name of names) if (record[name] !== undefined && record[name] !== null) return record[name];
  return undefined;
}

function normalizeStatus(value) {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

function enumName(value, names) {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (/^\d+$/.test(upper)) return names[Number(upper)] ?? `UNKNOWN_${upper}`;
    return upper;
  }
  if (typeof value === 'number' && Number.isInteger(value)) return names[value] ?? `UNKNOWN_${value}`;
  return value;
}

function uniqueDefined(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))];
}

function summarize(raw) {
  const record = firstRecord(raw);
  const consensus = firstRecord(getField(record, 'consensusData', 'consensus_data'));
  const leader = firstRecord(getField(consensus, 'leader_receipt', 'leaderReceipt'));
  const statusValues = uniqueDefined([
    getField(record, 'statusName', 'status_name'),
    getField(record, 'status'),
  ]).map((value) => enumName(value, CREDIT_SPLIT_STATUS_BY_NUMBER));
  const executionValues = uniqueDefined([
    getField(record, 'txExecutionResultName', 'tx_execution_result_name', 'executionResultName', 'execution_result'),
    getField(record, 'txExecutionResult'),
  ]).map((value) => enumName(value, EXECUTION_BY_NUMBER));
  const resultValues = uniqueDefined([
    getField(record, 'resultName', 'result_name', 'consensusResult', 'consensus_result'),
    getField(record, 'result'),
  ]).map((value) => enumName(value, CONSENSUS_BY_NUMBER));
  const leaderValues = uniqueDefined([
    getField(leader, 'execution_result', 'executionResult', 'statusName', 'status_name'),
  ]).map(normalizeStatus);
  const issues = [];
  if (new Set(statusValues).size > 1) issues.push('Contradictory transaction status indicators');
  if (new Set(executionValues).size > 1) issues.push('Contradictory execution indicators');
  if (new Set(resultValues).size > 1) issues.push('Contradictory consensus indicators');
  if (leaderValues.some((value) => value !== 'SUCCESS' && value !== 'FINISHED_WITH_RETURN')) issues.push('Leader execution is not successful');
  return {
    status: statusValues[0],
    execution: executionValues[0],
    result: resultValues[0],
    leaderExecution: leaderValues[0],
    valueCredited: getField(record, 'value_credited', 'valueCredited'),
    issues,
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
    data: getField(record, 'data', 'tx_data', 'txData'),
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

async function readSdkTransaction(client, hash) {
  try {
    return { supported: true, value: jsonSafe(await client.getTransaction({ hash })) };
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

function extractOperation(record) {
  const data = getField(record, 'data', 'tx_data', 'txData');
  const calldata = getField(data, 'calldata') ?? getField(record, 'calldata');
  const readable = typeof calldata === 'object' && calldata !== null ? getField(calldata, 'readable') : typeof calldata === 'string' ? calldata : undefined;
  const method = getField(record, 'method', 'functionName', 'function_name') ?? (typeof readable === 'string' ? readable.match(/"method"\s*:\s*"([^"]+)"/)?.[1] : undefined);
  const projectMatch = typeof readable === 'string' ? readable.match(/"args"\s*:\s*\[\s*(\d+)/) : null;
  const projectId = getField(record, 'project_id', 'projectId') ?? (projectMatch ? Number(projectMatch[1]) : undefined);
  return { method, projectId: Number.isInteger(projectId) ? projectId : undefined, readable };
}

function expectedSettlement(project, mode) {
  const reason = project?.settlement_reason;
  const inferred = reason === 'COMPLETED_DELIVERABLE' ? 'payout' : REFUND_REASONS.has(reason) ? 'refund' : mode;
  const methods = {
    COMPLETED_DELIVERABLE: ['evaluate_contributions'],
    INCOMPLETE_DELIVERABLE: ['evaluate_contributions'],
    RECRUITMENT_EXPIRED: ['refund_unstarted_project'],
    UNRESOLVED_UNANIMOUS_EXIT: ['approve_unresolved_refund'],
  };
  return { mode: inferred, reason, methods: methods[reason] ?? [] };
}

function canonicalSet(values) {
  return new Set(normalizeList(values).filter((value) => typeof value === 'string').map((value) => value.toLowerCase()));
}

function verifyReadback(project, recipients, children, contract, mode) {
  const contradictions = [];
  if (!project || typeof project !== 'object') return { contradictions: ['Project readback is unavailable'] };
  if (project.id !== undefined && Number(project.id) !== Number(project.project_id ?? project.id)) contradictions.push('Project readback contains contradictory project identifiers');
  const pool = asWei(project.pool_wei);
  if (pool === null) contradictions.push('Project pool_wei is missing or not an integer');
  if (project.settlement !== 'EMITTED_UNVERIFIED') contradictions.push(`Unexpected settlement label: ${project.settlement ?? 'missing'}`);
  const settlement = expectedSettlement(project, mode);
  if (!settlement.reason) contradictions.push('Settlement reason is missing');
  if (!['SETTLEMENT_EMITTED', 'REFUND_EMITTED'].includes(project.status)) contradictions.push(`Project status is ${project.status ?? 'missing'}, not a terminal settlement status`);
  if (!['payout', 'refund'].includes(settlement.mode)) contradictions.push('Settlement mode cannot be determined from the project readback');
  if (mode !== 'auto' && settlement.mode !== mode) contradictions.push(`Requested ${mode} verification does not match the project settlement`);

  const contributors = normalizeList(project.contributors);
  if (canonicalSet(contributors).size !== contributors.length) contradictions.push('Project contains duplicate contributor addresses');

  if (settlement.mode === 'payout') {
    const amounts = normalizeList(project.amounts_wei).map(asWei);
    const weights = normalizeList(project.weights);
    if (project.status !== 'SETTLEMENT_EMITTED') contradictions.push('Contributor settlement is not in SETTLEMENT_EMITTED state');
    if (project.completion !== true || project.decision?.complete !== true) contradictions.push('Contributor settlement is not marked complete');
    if (normalizeList(project.criteria_status).length !== 3 || !normalizeList(project.criteria_status).every((value) => value === 'met')) contradictions.push('All three acceptance criteria are not explicitly met');
    if (amounts.length !== 3 || contributors.length !== 3 || weights.length !== 3) contradictions.push('Contributor settlement is missing a complete three-slot allocation');
    if (amounts.some((value) => value === null)) contradictions.push('One or more allocations are not integer wei');
    if (pool !== null && amounts.length === 3 && amounts.every((value) => value !== null) && amounts.reduce((sum, value) => sum + value, 0n) !== pool) contradictions.push('Deterministic allocations do not conserve the project pool');
    if (recipients.length !== 3 || recipients.some((recipient, index) => !addressEqual(contributors[index], recipient))) contradictions.push('Expected payout recipients do not exactly match authenticated contributor slots');
    return { contradictions, mode: settlement.mode, reason: settlement.reason, poolWei: pool?.toString(), amountsWei: amounts.map((value) => value?.toString() ?? null), expectedMethods: settlement.methods, expectedRecipients: contributors };
  }

  if (settlement.mode === 'refund') {
    if (!addressEqual(project.sponsor, recipients[0])) contradictions.push('Refund recipient does not match the authenticated sponsor');
    if (recipients.length !== 1 || children.length !== 1) contradictions.push('A refund requires exactly one sponsor recipient and one child transfer');
    if (project.settlement_reason === 'UNRESOLVED_UNANIMOUS_EXIT' && !normalizeList(project.unresolved_refund_approvals).every(Boolean)) contradictions.push('Unresolved refund does not show unanimous participant approval');
    if (project.settlement_reason === 'INCOMPLETE_DELIVERABLE' && project.completion !== false) contradictions.push('Incomplete-deliverable refund is not marked incomplete');
    if (project.settlement_reason === 'RECRUITMENT_EXPIRED' && normalizeList(project.joined).every(Boolean)) contradictions.push('Recruitment-expiry refund shows all contributors joined');
    return { contradictions, mode: settlement.mode, reason: settlement.reason, poolWei: pool?.toString(), amountsWei: [], expectedMethods: settlement.methods, expectedRecipients: [project.sponsor] };
  }
  return { contradictions, mode: settlement.mode, reason: settlement.reason, poolWei: pool?.toString(), amountsWei: [] };
}

async function balanceAt(rpcUrl, address, block) {
  const result = await rpc(rpcUrl, 'eth_getBalance', [address, block]);
  if (typeof result !== 'string' || !/^0x[0-9a-fA-F]+$/.test(result)) throw new Error('eth_getBalance returned a non-hex balance');
  return BigInt(result).toString();
}

function blockNumber(record) {
  const value = getField(record, 'blockNumber', 'block_number');
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value)) return BigInt(value);
  return null;
}

function chainIdIsStudio(value) {
  if (value === 61999 || value === '61999') return true;
  return typeof value === 'string' && value.toLowerCase() === STUDIO_CHAIN_ID;
}

function expectedValues(checked, children) {
  return checked.amountsWei.length ? checked.amountsWei : [checked.poolWei];
}

function evaluateHistoricalEvidence(balanceEvidence, parentRecord, children, checked) {
  const result = {
    status: 'NOT_PROVIDED',
    deltas: balanceEvidence?.historicalDeltas ?? null,
    attribution: balanceEvidence?.historicalAttribution ?? null,
    contradictions: [],
  };
  if (!result.deltas) return result;
  const expected = expectedValues(checked, children);
  if (result.deltas.length !== expected.length) {
    result.contradictions.push('Historical balance evidence does not cover every expected beneficiary');
    result.status = 'CONTRADICTED';
    return result;
  }
  for (let index = 0; index < result.deltas.length; index += 1) {
    const entry = result.deltas[index];
    const delta = asWei(entry?.deltaWei);
    const expectedWei = asWei(expected[index]);
    if (delta === null || expectedWei === null || delta !== expectedWei) {
      result.contradictions.push(`Historical balance delta for beneficiary ${index} does not equal the expected transfer`);
    }
  }
  const before = balanceEvidence.beforeBlock ? BigInt(balanceEvidence.beforeBlock) : null;
  const after = balanceEvidence.afterBlock ? BigInt(balanceEvidence.afterBlock) : null;
  const parentBlock = blockNumber(parentRecord);
  const childBlocks = children.map((child) => blockNumber(child.transaction?.value));
  if (before === null || after === null || before >= after) result.contradictions.push('Historical block boundaries are missing or not chronological');
  if (parentBlock === null || parentBlock <= (before ?? -1n) || parentBlock > (after ?? -1n)) result.contradictions.push('Parent settlement block is unavailable or outside the supplied historical range');
  if (childBlocks.some((value) => value === null || value <= (before ?? -1n) || value > (after ?? -1n))) result.contradictions.push('One or more child transfer blocks are unavailable or outside the supplied historical range');
  if (result.contradictions.length) {
    result.status = 'CONTRADICTED';
    return result;
  }
  if (result.attribution?.supported === true && result.attribution.attributable === true && result.attribution.unrelatedActivity === false && result.attribution.gasWei === '0') {
    result.status = 'VERIFIED';
    return result;
  }
  if (result.attribution?.unrelatedActivity === true) {
    result.contradictions.push('Historical beneficiary activity contains unrelated or unexplained movement');
    result.status = 'CONTRADICTED';
    return result;
  }
  result.status = 'OBSERVED_UNATTRIBUTED';
  return result;
}

function triggeredIdsMatch(triggered, expected) {
  if (!triggered?.supported || !Array.isArray(triggered.value)) return false;
  const actual = canonicalSet(triggered.value);
  const wanted = canonicalSet(expected);
  return actual.size === wanted.size && [...actual].every((hash) => wanted.has(hash));
}

function verifyChildren(report, args, checked) {
  const contradictions = [];
  const children = report.children ?? [];
  if (!triggeredIdsMatch(report.parent?.triggeredTransactionIds, args.child)) contradictions.push('The authoritative SDK child-transaction list is missing or does not exactly match the supplied child hashes');
  const parentTriggered = report.parent?.transaction?.value?.triggeredTransactions;
  if (parentTriggered !== undefined && !triggeredIdsMatch({ supported: true, value: parentTriggered }, args.child)) contradictions.push('Parent transaction child list contradicts the supplied child hashes');
  if (children.length !== args.child.length) contradictions.push('Required child transaction records are missing');
  const expected = expectedValues(checked, children);
  const seen = new Set();
  children.forEach((child, index) => {
    const childRecord = child.transaction?.value;
    if (seen.has(child.hash.toLowerCase())) contradictions.push(`Child ${index} transaction hash is duplicated`);
    seen.add(child.hash.toLowerCase());
    if (!childRecord) {
      contradictions.push(`Child ${index} transaction record is unavailable`);
      return;
    }
    if (childRecord.hash && childRecord.hash.toLowerCase() !== child.hash.toLowerCase()) contradictions.push(`Child ${index} record hash does not match the requested hash`);
    if (!addressEqual(childRecord.from, args.contract)) contradictions.push(`Child ${index} does not originate from the Creditsplit contract`);
    if (!addressEqual(childRecord.to, args.recipient[index])) contradictions.push(`Child ${index} recipient differs from the expected beneficiary`);
    if (childRecord.value === undefined || asWei(childRecord.value) === null) contradictions.push(`Child ${index} transfer amount is missing or not integer wei`);
    else if (asWei(childRecord.value) !== asWei(expected[index])) contradictions.push(`Child ${index} value differs from the deterministic allocation or refund amount`);
    if (childRecord.triggeredBy !== undefined) {
      if (typeof childRecord.triggeredBy !== 'string' || !HASH.test(childRecord.triggeredBy)) contradictions.push(`Child ${index} provenance parent is malformed`);
      else if (childRecord.triggeredBy.toLowerCase() !== args.parent.toLowerCase()) contradictions.push(`Child ${index} provenance points to a different parent`);
    }
    if (child.summary?.status !== 'FINALIZED') contradictions.push(`Child ${index} is not FINALIZED`);
    if (child.summary?.valueCredited !== true) contradictions.push(`Child ${index} does not report value_credited=true`);
    if (child.summary?.issues?.length) contradictions.push(...child.summary.issues.map((issue) => `Child ${index}: ${issue}`));
    if (child.summary?.result && !['NO_MAJORITY', 'MAJORITY_AGREE'].includes(child.summary.result)) contradictions.push(`Child ${index} has an explicit unsuccessful result: ${child.summary.result}`);
    if (child.evmReceipt?.value?.receiptStatus === 'REVERTED') contradictions.push(`Child ${index} has a reverted EVM receipt`);
    if (child.code?.supported && child.code.value && child.code.value !== '0x' && child.code.value !== '0x0') contradictions.push(`Beneficiary ${index} is not an EOA according to eth_getCode`);
  });
  return contradictions;
}

export function evaluateEvidence(report, args) {
  const contradictions = [];
  const chainValue = report.chainId?.supported ? report.chainId.value : undefined;
  if (!report.chainId?.supported || !chainIdIsStudio(chainValue)) contradictions.push('RPC chain is not authoritatively identified as StudioNet 61999');
  const parentTransaction = report.parent?.sdkTransaction?.supported ? report.parent.sdkTransaction.value : report.parent?.transaction?.value;
  const parentSummary = report.parent?.summary ?? {};
  if (!parentTransaction) contradictions.push('Parent transaction is unavailable');
  if (!addressEqual(parentTransaction?.to, args.contract)) contradictions.push('Parent transaction does not target the specified Creditsplit contract');
  const operation = extractOperation(parentTransaction);
  const checked = verifyReadback(report.readback?.value, args.recipient, report.children ?? [], args.contract, args.mode);
  contradictions.push(...checked.contradictions);
  const projectId = report.readback?.value?.id ?? report.readback?.value?.project_id;
  if (projectId !== undefined && Number(projectId) !== args.project) contradictions.push('Readback project ID does not match the requested project');
  if (operation.projectId === undefined || operation.method === undefined) contradictions.push('Parent calldata does not expose an independently readable method and project ID');
  else {
    if (operation.projectId !== args.project) contradictions.push('Parent calldata targets a different project ID');
    if (!checked.expectedMethods?.includes(operation.method)) contradictions.push(`Parent method ${operation.method} is not the settlement operation expected for ${checked.reason ?? 'this project'}`);
  }
  if (parentSummary.status !== 'FINALIZED') contradictions.push('Parent is not FINALIZED');
  if (parentSummary.result !== 'MAJORITY_AGREE') contradictions.push(`Parent consensus is ${parentSummary.result ?? 'missing'}, not MAJORITY_AGREE`);
  const parentExecution = parentSummary.execution ?? parentSummary.leaderExecution;
  if (!['FINISHED_WITH_RETURN', 'SUCCESS'].includes(parentExecution)) contradictions.push(`Parent execution is ${parentExecution ?? 'missing'}, not successful`);
  if (parentSummary.issues?.length) contradictions.push(...parentSummary.issues.map((issue) => `Parent: ${issue}`));
  contradictions.push(...verifyChildren(report, args, checked));

  const historicalParent = parentTransaction ? {
    ...parentTransaction,
    blockNumber: getField(report.parent?.transaction?.value, 'blockNumber', 'block_number') ?? getField(parentTransaction, 'blockNumber', 'block_number'),
  } : parentTransaction;
  const history = evaluateHistoricalEvidence(report.balanceEvidence, historicalParent, report.children ?? [], checked);
  contradictions.push(...history.contradictions);
  const hasVerifiedHistory = history.status === 'VERIFIED';
  const hasObservedHistory = history.status === 'OBSERVED_UNATTRIBUTED';
  let verdict = 'INCONCLUSIVE_OR_CONTRADICTED';
  if (!contradictions.length) {
    if (checked.mode === 'refund') verdict = hasVerifiedHistory ? 'REFUND_AND_HISTORICAL_BALANCE_DELTA_VERIFIED' : hasObservedHistory ? 'REFUND_PROTOCOL_CREDIT_AND_BALANCE_DELTA_OBSERVED_UNATTRIBUTED' : 'REFUND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED';
    else verdict = hasVerifiedHistory ? 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_VERIFIED' : hasObservedHistory ? 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_OBSERVED_UNATTRIBUTED' : 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED';
  }
  return {
    contradictions,
    mode: checked.mode,
    reason: checked.reason,
    operation,
    allocationCheck: checked,
    history,
    verdict,
  };
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

  const client = createClient({ chain: studionet, endpoint: args.rpc });
  report.parent.sdkTransaction = await readSdkTransaction(client, args.parent);
  try {
    report.parent.triggeredTransactionIds = { supported: true, value: jsonSafe(await client.getTriggeredTransactionIds({ hash: args.parent })) };
  } catch (error) {
    report.parent.triggeredTransactionIds = { supported: false, error: error instanceof Error ? error.message : String(error) };
  }
  report.parent.transaction = compactOptional(report.parent.transaction);
  report.parent.sdkTransaction = compactOptional(report.parent.sdkTransaction);
  report.parent.genReceipt = compactOptional(report.parent.genReceipt);
  report.parent.evmReceipt = compactOptional(report.parent.evmReceipt);
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
    child.code = await optionalRpc(args.rpc, 'eth_getCode', [args.recipient[index], 'latest']);
    child.transaction = compactOptional(child.transaction);
    child.genReceipt = compactOptional(child.genReceipt);
    child.evmReceipt = compactOptional(child.evmReceipt);
    report.children.push(child);
  }

  const parentBlock = blockNumber(report.parent.transaction?.value);
  const beforeBlock = args.beforeBlock ? BigInt(args.beforeBlock) : null;
  const afterBlock = args.afterBlock ? BigInt(args.afterBlock) : null;
  if (args.beforeBlock && args.afterBlock) {
    report.balanceEvidence.beforeBlock = beforeBlock.toString();
    report.balanceEvidence.afterBlock = afterBlock.toString();
    report.balanceEvidence.historicalDeltas = [];
  }

  for (const recipient of args.recipient) {
    const current = await optionalRpc(args.rpc, 'eth_getBalance', [recipient, 'latest']);
    report.balanceEvidence.currentBalances.push({ address: recipient, latest: current });
  }
  if (args.beforeBlock && args.afterBlock) {
    for (const recipient of args.recipient) {
      try {
        const before = await balanceAt(args.rpc, recipient, args.beforeBlock);
        const after = await balanceAt(args.rpc, recipient, args.afterBlock);
        report.balanceEvidence.historicalDeltas.push({ address: recipient, before, after, deltaWei: (BigInt(after) - BigInt(before)).toString() });
      } catch (error) {
        report.balanceEvidence.historicalDeltas = null;
        report.balanceEvidence.historicalError = error instanceof Error ? error.message : String(error);
        break;
      }
    }
    report.balanceEvidence.historicalAttribution = { supported: false, attributable: false, reason: 'No authoritative transaction-activity proof was supplied.' };
    if (report.balanceEvidence.historicalDeltas && parentBlock !== null && beforeBlock < parentBlock && parentBlock <= afterBlock) {
      const childBlocks = report.children.map((child) => blockNumber(child.transaction?.value));
      if (childBlocks.every((block) => block !== null && beforeBlock < block && block <= afterBlock)) {
        report.balanceEvidence.historicalAttribution = { supported: false, attributable: false, reason: 'Block boundaries are present, but beneficiary activity and gas attribution are not independently enumerated.' };
      }
    }
  }
  const evaluated = evaluateEvidence(report, args);
  report.contradictions = evaluated.contradictions;
  report.allocationCheck = evaluated.allocationCheck;
  report.historicalEvidence = evaluated.history;
  report.operation = evaluated.operation;
  report.verdict = evaluated.verdict;
  report.limitations = [
    'EMITTED_UNVERIFIED remains the contract settlement label.',
    'value_credited=true is recorded separately from child execution success.',
    report.parent.triggeredTransactionIds?.supported ? 'Child provenance was checked against the official GenLayerJS getTriggeredTransactionIds result.' : 'Child provenance could not be independently established because getTriggeredTransactionIds was unavailable.',
    report.balanceEvidence.historicalDeltas ? 'Historical balance deltas were calculated, but they remain unattributed unless beneficiary activity and gas evidence are also authoritative.' : 'No exact beneficiary balance delta is claimed without caller-supplied historical block tags.',
  ];
  console.log(JSON.stringify(jsonSafe(report), null, 2));
  process.exitCode = report.verdict === 'INCONCLUSIVE_OR_CONTRADICTED' ? 2 : 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exitCode = 1;
});
