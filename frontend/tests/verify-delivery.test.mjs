import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateEvidence, parseArgs } from '../scripts/verify-delivery.mjs';

const CONTRACT = '0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D';
const SPONSOR = '0xb845a69860ba4CDf19CfDC5AfbAF2e20b6bE86b0';
const RECIPIENTS = [
  '0x951e6B75530774fF82321a5ae54e14F778F0C855',
  '0xac3AC69dC0Bde389256dD6748C75817ead9286D9',
  '0xA7EeAE0E93793e3146Cb14b0700251B8b0EBADFB',
];
const CHILDREN = [
  '0xa787662d35adba760b0c133ab7f903381723d74ad5312276be5e3c8c1f009a09',
  '0x2ac4419cf1fa360c678e003c7c1bb9a1538f89898a5fe8f46293a0ea3a46b261',
  '0x6617691d6d893b2efb8111d24724efdd0a1cfc021bf587738590859bf9c82aff',
];
const PARENT = '0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972';
const AMOUNTS = ['909090909090910', '545454545454545', '545454545454545'];
const POOL = '2000000000000000';

function parentRecord(method = 'evaluate_contributions', project = 2) {
  return {
    hash: PARENT,
    from: SPONSOR,
    to: CONTRACT,
    data: { calldata: { readable: `{"args":[${project},]"method":"${method}"}` } },
    triggeredTransactions: CHILDREN,
    blockNumber: '0x10',
  };
}

function childRecord(index, {from = CONTRACT, to = RECIPIENTS[index], value = AMOUNTS[index], result = 'NO_MAJORITY', credited = true, blockNumber = `0x${12 + index}`, triggeredBy = PARENT} = {}) {
  return {
    hash: CHILDREN[index],
    from,
    to,
    value,
    triggeredBy,
    blockNumber,
    result,
    valueCredited: credited,
  };
}

function projectRecord({refund = false, reason = 'COMPLETED_DELIVERABLE'} = {}) {
  if (refund) return {
    id: 2,
    sponsor: SPONSOR,
    contributors: RECIPIENTS,
    joined: [true, true, true],
    pool_wei: POOL,
    status: 'REFUND_EMITTED',
    completion: false,
    criteria_status: ['partial', 'not_met', 'not_met'],
    settlement: 'EMITTED_UNVERIFIED',
    settlement_reason: reason,
    unresolved_refund_approvals: reason === 'UNRESOLVED_UNANIMOUS_EXIT' ? [true, true, true, true] : [false, false, false, false],
  };
  return {
    id: 2,
    sponsor: SPONSOR,
    contributors: RECIPIENTS,
    joined: [true, true, true],
    pool_wei: POOL,
    status: 'SETTLEMENT_EMITTED',
    completion: true,
    criteria_status: ['met', 'met', 'met'],
    settlement: 'EMITTED_UNVERIFIED',
    settlement_reason: reason,
    weights: [5, 3, 3],
    amounts_wei: AMOUNTS,
    decision: { complete: true },
  };
}

function report({
  project = projectRecord(),
  parent = parentRecord(),
  children = CHILDREN.map((_, index) => childRecord(index)),
  chainId = '0xf22f',
  triggered = CHILDREN,
  balanceEvidence = { historicalDeltas: null },
} = {}) {
  return {
    chainId: { supported: true, value: chainId },
    parent: {
      transaction: { supported: true, value: parent },
      triggeredTransactionIds: { supported: true, value: triggered },
      summary: { status: 'FINALIZED', result: 'MAJORITY_AGREE', leaderExecution: 'SUCCESS', execution: undefined, issues: [] },
    },
    children: children.map((value, index) => ({
      hash: value.hash ?? CHILDREN[index],
      transaction: { supported: true, value },
      summary: { status: 'FINALIZED', result: value.result, valueCredited: value.valueCredited, issues: [] },
      evmReceipt: { supported: true, value: { receiptStatus: 'SUCCESS' } },
      code: { supported: true, value: '0x' },
    })),
    readback: { supported: true, value: project },
    balanceEvidence,
  };
}

function args(recipients = RECIPIENTS, children = CHILDREN, mode = 'auto') {
  return { contract: CONTRACT, project: 2, parent: PARENT, recipient: recipients, child: children, mode };
}

function verdictFor(overrides = {}, argsOverride = args()) {
  return evaluateEvidence(report(overrides), argsOverride);
}

test('genuine parent-child payout provenance is accepted but delivery remains conservative', () => {
  const result = verdictFor();
  assert.equal(result.verdict, 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
  assert.deepEqual(result.contradictions, []);
});

test('zero-weight contributor slots do not require zero-value child transfers', () => {
  const variants = [
    [[5, 0, 3], ['5', '0', '3']],
    [[0, 0, 5], ['0', '0', '5']],
    [[5, 3, 0], ['5', '3', '0']],
    [[0, 3, 5], ['0', '3', '5']],
    [[5, 3, 3], ['5', '3', '3']],
  ];
  for (const [weights, amounts] of variants) {
    const positive = amounts.map((value, index) => BigInt(value) > 0n ? index : -1).filter((index) => index >= 0);
    const childHashes = positive.map((index) => CHILDREN[index]);
    const project = projectRecord();
    project.pool_wei = amounts.reduce((sum, value) => sum + BigInt(value), 0n).toString();
    project.weights = weights;
    project.amounts_wei = amounts;
    const children = positive.map((index) => childRecord(index, { value: amounts[index] }));
    const parent = parentRecord();
    parent.triggeredTransactions = childHashes;
    const result = verdictFor({ project, parent, children, triggered: childHashes }, args(RECIPIENTS, childHashes));
    assert.equal(result.contradictions.length, 0, `${weights.join(',')} should verify: ${result.contradictions.join('; ')}`);
    assert.equal(result.verdict, 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
  }
});

test('missing positive-allocation children cannot verify a partial payout', () => {
  const cases = [
    { weights: [5, 3, 3], amounts: AMOUNTS, suppliedSlots: [0, 1] },
    { weights: [5, 0, 3], amounts: ['5', '0', '3'], suppliedSlots: [0] },
    { weights: [5, 3, 3], amounts: AMOUNTS, suppliedSlots: [] },
  ];
  for (const { weights, amounts, suppliedSlots } of cases) {
    const project = projectRecord();
    project.weights = weights;
    project.amounts_wei = amounts;
    project.pool_wei = amounts.reduce((sum, value) => sum + BigInt(value), 0n).toString();
    const hashes = suppliedSlots.map((slot) => CHILDREN[slot]);
    const parent = parentRecord();
    parent.triggeredTransactions = hashes;
    const children = suppliedSlots.map((slot) => childRecord(slot, { value: amounts[slot] }));
    const result = verdictFor({ project, parent, triggered: hashes, children }, args(RECIPIENTS, hashes));
    assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
    assert.match(result.contradictions.join(' '), /transfer children for positive allocations/);
  }
});

test('a zero-value child supplied for a zero allocation is rejected', () => {
  const project = projectRecord();
  project.pool_wei = '8';
  project.weights = [5, 0, 3];
  project.amounts_wei = ['5', '0', '3'];
  const childHashes = CHILDREN;
  const parent = parentRecord();
  parent.triggeredTransactions = childHashes;
  const children = CHILDREN.map((_, index) => childRecord(index, { value: index === 1 ? '0' : project.amounts_wei[index] }));
  const result = verdictFor({ project, parent, children, triggered: childHashes }, args(RECIPIENTS, childHashes));
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.ok(result.contradictions.length > 0);
});

test('authoritative child processing order may differ while allocation-slot binding remains exact', () => {
  const parent = parentRecord();
  const processingOrder = [CHILDREN[1], CHILDREN[2], CHILDREN[0]];
  parent.triggeredTransactions = processingOrder;
  const verdict = verdictFor({parent, triggered: processingOrder}, args());
  assert.equal(verdict.verdict, 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
  assert.deepEqual(verdict.contradictions, []);
});

test('child records supplied in the wrong allocation order fail closed', () => {
  const swappedChildren = [childRecord(1), childRecord(0), childRecord(2)];
  const verdict = verdictFor({children: swappedChildren}, args());
  assert.equal(verdict.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.ok(verdict.contradictions.length > 0);
});

test('an unrelated successful parent cannot verify a payout', () => {
  const result = verdictFor({ parent: parentRecord() }, { ...args(), contract: '0x1111111111111111111111111111111111111111' });
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /does not target/);
});

test('wrong sender, beneficiary, amount, missing amount and wrong project fail closed', () => {
  for (const mutation of [
    { children: CHILDREN.map((_, index) => childRecord(index, index === 0 ? { from: SPONSOR } : {})) },
    { children: CHILDREN.map((_, index) => childRecord(index, index === 0 ? { to: SPONSOR } : {})) },
    { children: CHILDREN.map((_, index) => childRecord(index, index === 0 ? { value: '1' } : {})) },
    { children: CHILDREN.map((_, index) => childRecord(index, index === 0 ? { value: null } : {})) },
    { parent: parentRecord('evaluate_contributions', 99) },
  ]) {
    const result = verdictFor(mutation);
    assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
    assert.ok(result.contradictions.length > 0);
  }
});

test('duplicate caller child hashes are rejected before any read', () => {
  assert.throws(() => parseArgs([
    '--contract', CONTRACT, '--project', '2', '--parent', PARENT,
    '--recipient', `${RECIPIENTS[0]},${RECIPIENTS[1]}`,
    '--child', `${CHILDREN[0]},${CHILDREN[0]}`,
  ]), /Duplicate child transaction hashes/);
});

test('different network and unsupported child discovery cannot produce a positive result', () => {
  const differentNetwork = verdictFor({ chainId: '0xf21d' });
  assert.equal(differentNetwork.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  const unavailable = report({});
  unavailable.parent.triggeredTransactionIds = { supported: false, error: 'unsupported' };
  const result = evaluateEvidence(unavailable, args());
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
});

test('valid EOA NO_MAJORITY child with protocol credit is not treated as failed', () => {
  const result = verdictFor({ children: CHILDREN.map((_, index) => childRecord(index, { result: 'NO_MAJORITY', credited: true })) });
  assert.equal(result.contradictions.length, 0);
  assert.equal(result.verdict, 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
});

test('uncredited or unresolved child is rejected', () => {
  const result = verdictFor({ children: CHILDREN.map((_, index) => childRecord(index, index === 1 ? { credited: false } : {})) });
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /value_credited/);
});

test('valid unanimous sponsor refund requires the sponsor and exact pool amount', () => {
  const refundChild = childRecord(0, { to: SPONSOR, value: POOL });
  const refundParent = parentRecord('approve_unresolved_refund');
  refundParent.triggeredTransactions = [CHILDREN[0]];
  const result = verdictFor({
    project: projectRecord({ refund: true, reason: 'UNRESOLVED_UNANIMOUS_EXIT' }),
    parent: refundParent,
    children: [refundChild],
    triggered: [CHILDREN[0]],
  }, args([SPONSOR], [CHILDREN[0]], 'refund'));
  assert.equal(result.verdict, 'REFUND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
  assert.deepEqual(result.contradictions, []);
});

test('unresolved refund requires exactly four explicit true approvals', () => {
  const malformedApprovals = [
    undefined,
    [],
    [true, true, true],
    [true, true, true, true, true],
    [true, true, false, true],
    [true, true, true, 'true'],
    [true, true, true, 1],
    [true, true, true, null],
  ];
  for (const approvals of malformedApprovals) {
    const project = projectRecord({ refund: true, reason: 'UNRESOLVED_UNANIMOUS_EXIT' });
    if (approvals === undefined) delete project.unresolved_refund_approvals;
    else project.unresolved_refund_approvals = approvals;
    const result = verdictFor({
      project,
      parent: parentRecord('approve_unresolved_refund'),
      children: [childRecord(0, { to: SPONSOR, value: POOL })],
    }, args([SPONSOR], [CHILDREN[0]], 'refund'));
    assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
    assert.match(result.contradictions.join(' '), /exactly four explicit true/);
  }
});

test('recruitment refund requires three boolean join slots with an unjoined contributor', () => {
  const malformedJoinStates = [
    undefined,
    [],
    [false],
    [false, true],
    [false, true, true, false],
    [false, 'true', true],
    [true, true, true],
  ];
  for (const joined of malformedJoinStates) {
    const project = projectRecord({ refund: true, reason: 'RECRUITMENT_EXPIRED' });
    if (joined === undefined) delete project.joined;
    else project.joined = joined;
    const result = verdictFor({
      project,
      parent: parentRecord('refund_unstarted_project'),
      children: [childRecord(0, { to: SPONSOR, value: POOL })],
    }, args([SPONSOR], [CHILDREN[0]], 'refund'));
    assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
    assert.match(result.contradictions.join(' '), /exactly three boolean join slots/);
  }
});

test('wrong refund beneficiary and refund method fail closed', () => {
  const result = verdictFor({
    project: projectRecord({ refund: true, reason: 'UNRESOLVED_UNANIMOUS_EXIT' }),
    parent: parentRecord('approve_unresolved_refund'),
    children: [childRecord(0, { to: RECIPIENTS[0], value: POOL })],
  }, args([RECIPIENTS[0]], [CHILDREN[0]], 'refund'));
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /sponsor/);
});

test('a correct historical delta is reported as observed but not attributed without activity proof', () => {
  const result = verdictFor({
    balanceEvidence: {
      beforeBlock: '1',
      afterBlock: '20',
      historicalDeltas: AMOUNTS.map((delta, index) => ({ address: RECIPIENTS[index], before: '100', after: (100n + BigInt(delta)).toString(), deltaWei: delta })),
      historicalAttribution: { supported: false, attributable: false, reason: 'activity unavailable' },
    },
  });
  assert.equal(result.verdict, 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_OBSERVED_UNATTRIBUTED');
  assert.equal(result.history.status, 'OBSERVED_UNATTRIBUTED');
});

test('historical delta differing from the allocation is a contradiction', () => {
  const deltas = AMOUNTS.map((delta, index) => ({ address: RECIPIENTS[index], before: '100', after: (100n + BigInt(delta)).toString(), deltaWei: delta }));
  deltas[1].deltaWei = '1';
  const result = verdictFor({
    balanceEvidence: {
      beforeBlock: '1', afterBlock: '20', historicalDeltas: deltas,
      historicalAttribution: { supported: true, attributable: true, unrelatedActivity: false, gasWei: '0' },
    },
  });
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /does not equal/);
});

test('unrelated intervening activity blocks balance attribution', () => {
  const result = verdictFor({
    balanceEvidence: {
      beforeBlock: '1', afterBlock: '20',
      historicalDeltas: AMOUNTS.map((delta, index) => ({ address: RECIPIENTS[index], before: '100', after: (100n + BigInt(delta)).toString(), deltaWei: delta })),
      historicalAttribution: { supported: true, attributable: false, unrelatedActivity: true, gasWei: '0' },
    },
  });
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /unrelated/);
});

test('caller-supplied historical attribution cannot establish a balance delta', () => {
  const result = verdictFor({
    balanceEvidence: {
      beforeBlock: '1', afterBlock: '20',
      historicalDeltas: AMOUNTS.map((delta, index) => ({ address: RECIPIENTS[index], before: '100', after: (100n + BigInt(delta)).toString(), deltaWei: delta })),
      historicalAttribution: { supported: true, attributable: true, unrelatedActivity: false, gasWei: '0' },
    },
  });
  assert.equal(result.verdict, 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_OBSERVED_UNATTRIBUTED');
  assert.equal(result.history.status, 'OBSERVED_UNATTRIBUTED');
});

test('unsupported historical queries and contradictory RPC evidence remain non-positive', () => {
  const unsupported = verdictFor({ balanceEvidence: { historicalDeltas: null, historicalError: 'unsupported' } });
  assert.equal(unsupported.verdict, 'ALLOCATION_AND_PROTOCOL_CREDIT_VERIFIED_DELIVERY_UNCONFIRMED');
  const missing = report({});
  missing.chainId = { supported: false, error: 'missing' };
  missing.parent.summary = { status: 'FINALIZED', result: 'MAJORITY_DISAGREE', leaderExecution: 'SUCCESS', issues: ['Contradictory consensus indicators'] };
  const contradictory = evaluateEvidence(missing, args());
  assert.equal(contradictory.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
});

test('malformed child provenance fails closed instead of throwing', () => {
  const result = verdictFor({ children: CHILDREN.map((_, index) => childRecord(index, index === 0 ? { triggeredBy: 123 } : {})) });
  assert.equal(result.verdict, 'INCONCLUSIVE_OR_CONTRADICTED');
  assert.match(result.contradictions.join(' '), /provenance parent is malformed/);
});

test('raw RPC block boundaries still do not authorize caller-supplied attribution', () => {
  const fixture = report({
    parent: { ...parentRecord(), blockNumber: '0x10' },
    balanceEvidence: {
      beforeBlock: '1', afterBlock: '20',
      historicalDeltas: AMOUNTS.map((delta, index) => ({ address: RECIPIENTS[index], before: '100', after: (100n + BigInt(delta)).toString(), deltaWei: delta })),
      historicalAttribution: { supported: true, attributable: true, unrelatedActivity: false, gasWei: '0' },
    },
  });
  fixture.parent.sdkTransaction = { supported: true, value: { to: CONTRACT, data: { calldata: { readable: '{"args":[2,]"method":"evaluate_contributions"}' } }, status: 'FINALIZED', result: 'MAJORITY_AGREE', execution: 'SUCCESS' } };
  const result = evaluateEvidence(fixture, args());
  assert.equal(result.verdict, 'ALLOCATION_AND_HISTORICAL_BALANCE_DELTA_OBSERVED_UNATTRIBUTED');
});
