import {describe,it,expect} from 'vitest';
import {isSuccessfulFinalizedReceipt,makeSubmittedTransaction,parseSubmittedTransaction,recoveryMatchesWallet,submittedTransactionStorageKey} from '../lib/chain';
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
  it('accepts the pinned SDK simplified StudioNet success receipt',()=>expect(isSuccessfulFinalizedReceipt({status_name:'FINALIZED',result_name:'MAJORITY_AGREE',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}})).toBe(true));
  it('rejects finalized disagreement even when the status is final',()=>expect(isSuccessfulFinalizedReceipt({status_name:'FINALIZED',result_name:'MAJORITY_DISAGREE',consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}})).toBe(false));
  it('accepts an explicit successful execution result when present',()=>expect(isSuccessfulFinalizedReceipt({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_RETURN'})).toBe(true));
});
