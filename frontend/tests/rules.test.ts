import {describe,it,expect} from 'vitest';
import {confirmedTransactionStorageKey,isSuccessfulFinalizedReceipt,makeConfirmedTransaction,makeSubmittedTransaction,markConfirmedTransactionSynchronized,parseConfirmedTransaction,parseSubmittedTransaction,reconcileConfirmedRead,recoveryMatchesWallet,submittedTransactionStorageKey} from '../lib/chain';
import {parseGen,formatGen,bytes,validateCriteria,validateProjectInput,validateVerifiedSource} from '../lib/types';
const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),c='0x'+'3'.repeat(40),s='0x'+'4'.repeat(40);
describe('funding and input invariants',()=>{
  it('preserves exact wei',()=>expect(parseGen('1.000000000000000001')).toBe(1000000000000000001n));
  it('rejects zero and scientific notation',()=>{expect(()=>parseGen('0')).toThrow();expect(()=>parseGen('1e9')).toThrow();});
  it('rejects excessive precision',()=>expect(()=>parseGen('0.0000000000000000001')).toThrow());
  it('formats values',()=>expect(formatGen('1250000000000000000')).toBe('1.25'));
  it('counts UTF-8 bytes',()=>expect(bytes('🎨')).toBe(4));
  it('accepts three distinct invitees',()=>expect(()=>validateProjectInput('A','B',[a,b,c],s)).not.toThrow());
  it('blocks sponsor self invitation',()=>expect(()=>validateProjectInput('A','B',[a,b,s],s)).toThrow());
  it('blocks duplicate invitees',()=>expect(()=>validateProjectInput('A','B',[a,b,a],s)).toThrow());
  it('requires three bounded acceptance criteria',()=>{expect(()=>validateCriteria(['requirements','correction','integration'])).not.toThrow();expect(()=>validateCriteria(['one','two'])).toThrow();expect(()=>validateCriteria(['x','y','z'.repeat(361)])).toThrow();});
  it('accepts only commit-pinned verified source metadata',()=>{const url='https://raw.githubusercontent.com/ometere123/creditsplit/'+'a'.repeat(40)+'/docs/CONSENSUS.md';expect(()=>validateVerifiedSource('', '')).not.toThrow();expect(()=>validateVerifiedSource(url,'b'.repeat(64))).not.toThrow();expect(()=>validateVerifiedSource('https://example.com/reference.md','b'.repeat(64))).toThrow();expect(()=>validateVerifiedSource(url,'bad')).toThrow();});
});
describe('transaction recovery scope',()=>{
  it('round-trips a chain, wallet, contract and method scoped record',()=>{
    const record={...makeSubmittedTransaction('0x'+'a'.repeat(64),'0x'+'1'.repeat(40),'create_project',123),contract:'0x'+'9'.repeat(40)};
    expect(parseSubmittedTransaction(JSON.stringify(record))).toEqual(record);
    expect(submittedTransactionStorageKey(record)).toContain(':61999:');
    expect(submittedTransactionStorageKey(record)).toContain(':create_project:');
    expect(submittedTransactionStorageKey(record)).toContain(record.hash);
    expect(recoveryMatchesWallet(record,'0x'+'1'.repeat(40))).toBe(true);
    expect(recoveryMatchesWallet(record,'0x'+'2'.repeat(40))).toBe(false);
  });
  it('keeps legacy hashes fail-closed until they are reconciled',()=>{
    const record=parseSubmittedTransaction('0x'+'b'.repeat(64));
    expect(record?.legacy).toBe(true);
    expect(recoveryMatchesWallet(record,'0x'+'1'.repeat(40))).toBe(true);
  });
  it('rejects malformed recovery records',()=>expect(parseSubmittedTransaction('{"hash":"not-a-hash"}')).toBeNull());
  it('persists confirmed-success outcome separately from unresolved recovery',()=>{
    const record=makeConfirmedTransaction({...makeSubmittedTransaction('0x'+'c'.repeat(64),a,'create_project',123),contract:'0x'+'9'.repeat(40)},456);
    expect(parseConfirmedTransaction(JSON.stringify(record))).toEqual(record);
    expect(confirmedTransactionStorageKey(record)).toContain(':61999:');
    expect(confirmedTransactionStorageKey(record)).toContain(':create_project:');
    expect(record.outcome).toBe('CONFIRMED_SUCCESS');
    expect(record.syncStatus).toBe('PENDING');
    expect(markConfirmedTransactionSynchronized(record).syncStatus).toBe('SYNCED');
  });
  it('keeps a finalized write successful when read-back fails and retries read-only',async()=>{
    const record=makeConfirmedTransaction({...makeSubmittedTransaction('0x'+'d'.repeat(64),a,'create_project',123),contract:'0x'+'9'.repeat(40)},456);
    const failed=await reconcileConfirmedRead(record,async()=>{throw new Error('temporary RPC failure');});
    expect(failed.synchronized).toBe(false);
    expect(failed.record.outcome).toBe('CONFIRMED_SUCCESS');
    expect(failed.record.hash).toBe(record.hash);
    expect(failed.record.syncStatus).toBe('PENDING');
    expect(failed.error).toContain('temporary RPC failure');
    const retried=await reconcileConfirmedRead(failed.record,async()=>({project_count:1}));
    expect(retried.synchronized).toBe(true);
    expect(retried.record.syncStatus).toBe('SYNCED');
  });
  it('accepts the pinned SDK simplified StudioNet success receipt',()=>expect(isSuccessfulFinalizedReceipt({status_name:'FINALIZED',result_name:'MAJORITY_AGREE',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(true));
  it('accepts a complete explicit successful StudioNet receipt',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN',consensusData:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(true));
  it('accepts quorum-cancelled validator work after an agreed successful execution',()=>expect(isSuccessfulFinalizedReceipt({
    status:7,
    result:6,
    consensus_data:{
      leader_receipt:[{execution_result:'SUCCESS'}],
      validators:[
        {execution_result:'SUCCESS',vote:'agree'},
        {execution_result:'ERROR',vote:'idle',error_code:'CONSENSUS_VALIDATOR_QUORUM_REACHED',raw_error:{causes:['VALIDATOR_QUORUM_REACHED']}}
      ]
    }
  })).toBe(true));
  it('accepts the full genlayer-js nested quorum-cancellation receipt shape',()=>expect(isSuccessfulFinalizedReceipt({
    status:7,
    result:6,
    consensus_data:{
      leader_receipt:[{execution_result:'SUCCESS'}],
      validators:[
        {execution_result:'SUCCESS',vote:'agree'},
        {execution_result:'ERROR',vote:'idle',genvm_result:{
          error_code:'CONSENSUS_VALIDATOR_QUORUM_REACHED',
          raw_error:{fatal:false,causes:['VALIDATOR_QUORUM_REACHED']}
        }}
      ]
    }
  })).toBe(true));
  it('rejects a validator error that is not the protocol quorum cancellation',()=>expect(isSuccessfulFinalizedReceipt({
    statusName:'FINALIZED',
    resultName:'MAJORITY_AGREE',
    consensusData:{leader_receipt:[{execution_result:'SUCCESS'}],validators:[{execution_result:'ERROR',vote:'idle',error_code:'MODEL_ERROR'}]}
  })).toBe(false));
  it('rejects a quorum error when the validator did not idle',()=>expect(isSuccessfulFinalizedReceipt({
    statusName:'FINALIZED',
    resultName:'MAJORITY_AGREE',
    consensusData:{leader_receipt:[{execution_result:'SUCCESS'}],validators:[{execution_result:'ERROR',vote:'agree',error_code:'CONSENSUS_VALIDATOR_QUORUM_REACHED',raw_error:{causes:['VALIDATOR_QUORUM_REACHED']}}]}
  })).toBe(false));
  it('rejects finalized disagreement even when the status is final',()=>expect(isSuccessfulFinalizedReceipt({status_name:'FINALIZED',result_name:'MAJORITY_DISAGREE',consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}})).toBe(false));
  it('rejects FINISHED_WITH_RETURN when consensus disagrees',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',resultName:'MAJORITY_DISAGREE',txExecutionResultName:'FINISHED_WITH_RETURN',consensusData:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(false));
  it('rejects FINISHED_WITH_RETURN when the leader failed',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN',consensusData:{leader_receipt:[{execution_result:'ERROR'}]}})).toBe(false));
  it('rejects MAJORITY_AGREE when explicit execution failed',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_ERROR',consensusData:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(false));
  it('rejects finality without successful execution evidence',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED'})).toBe(false));
  it('rejects unknown or contradictory receipt fields',()=>{
    expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',txExecutionResultName:'UNKNOWN'})).toBe(false);
    expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',status_name:'CANCELED',txExecutionResultName:'FINISHED_WITH_RETURN'})).toBe(false);
    expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',result:7,txExecutionResultName:'FINISHED_WITH_RETURN',txExecutionResult:2})).toBe(false);
  });
  it('rejects finalized unsuccessful and nonfinalized transactions',()=>{
    expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_ERROR'})).toBe(false);
    expect(isSuccessfulFinalizedReceipt({statusName:'PENDING',resultName:'MAJORITY_AGREE',consensusData:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(false);
  });
  it('accepts an explicit successful execution result when present',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_RETURN'})).toBe(true));
});
