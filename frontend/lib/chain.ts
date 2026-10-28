import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {ExecutionResult, TransactionHashVariant, TransactionStatus, type CalldataEncodable, type Hash} from 'genlayer-js/types';

export const NETWORK_ID = 61999;
export const NETWORK_HEX = '0xf22f';
export const RPC_URL = 'https://studio.genlayer.com/api';
export const EXPLORER = 'https://explorer-studio.genlayer.com';
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
export const configured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);
const SUBMITTED_TX_PREFIX = 'creditsplit:submitted-tx:';
const CONFIRMED_TX_PREFIX = 'creditsplit:confirmed-tx:';
const SIGNING_TX_PREFIX = 'creditsplit:signing-tx:';
export const SUBMITTED_TX_KEY = 'creditsplit:submitted-tx';
function asHash(value:string): Hash {
  if(!/^0x[a-fA-F0-9]{64}$/.test(value)) throw new Error(`Invalid transaction hash: ${value}`);
  return value as Hash;
}

export type SubmittedTransaction = {
  hash:string;
  chainId:number;
  wallet:string;
  contract:string;
  method:string;
  submittedAt:number;
  legacy?:boolean;
};

export type SigningTransaction = {
  id:string;
  chainId:number;
  wallet:string;
  contract:string;
  method:string;
  startedAt:number;
};

export type ConfirmedTransaction = SubmittedTransaction & {
  outcome:'CONFIRMED_SUCCESS';
  confirmedAt:number;
  syncStatus:'PENDING'|'SYNCED';
};

export function makeSubmittedTransaction(hash:string,wallet:string,method:string,submittedAt=Date.now()):SubmittedTransaction {
  return {hash,chainId:NETWORK_ID,wallet:wallet.toLowerCase(),contract:CONTRACT_ADDRESS.toLowerCase(),method,submittedAt};
}

export function parseSubmittedTransaction(raw:string|null):SubmittedTransaction|null {
  if(!raw) return null;
  try {
    const parsed=JSON.parse(raw) as Partial<SubmittedTransaction>;
    const contract=parsed.contract;
    if(typeof parsed.hash==='string' && /^0x[a-fA-F0-9]{64}$/.test(parsed.hash) &&
       parsed.chainId===NETWORK_ID && typeof parsed.wallet==='string' &&
       typeof contract==='string' && /^0x[a-fA-F0-9]{40}$/.test(contract) && typeof parsed.method==='string' &&
       typeof parsed.submittedAt==='number') {
      return {...parsed,hash:parsed.hash,wallet:parsed.wallet.toLowerCase(),contract:contract.toLowerCase()} as SubmittedTransaction;
    }
  } catch { /* A legacy or corrupt record is handled below. */ }
  if(/^0x[a-fA-F0-9]{64}$/.test(raw)) {
    return {hash:raw,chainId:NETWORK_ID,wallet:'',contract:CONTRACT_ADDRESS.toLowerCase(),method:'legacy',submittedAt:0,legacy:true};
  }
  return null;
}

export function submittedTransactionStorageKey(record:SubmittedTransaction):string {
  return `${SUBMITTED_TX_PREFIX}${record.chainId}:${record.wallet.toLowerCase()}:${record.contract.toLowerCase()}:${encodeURIComponent(record.method)}:${record.hash.toLowerCase()}`;
}

export function confirmedTransactionStorageKey(record:SubmittedTransaction):string {
  return `${CONFIRMED_TX_PREFIX}${record.chainId}:${record.wallet.toLowerCase()}:${record.contract.toLowerCase()}:${encodeURIComponent(record.method)}:${record.hash.toLowerCase()}`;
}

export function makeSigningTransaction(wallet:string,method:string,startedAt=Date.now(),id?:string):SigningTransaction {
  const generatedId=id??(typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${startedAt}-${Math.random().toString(36).slice(2)}`);
  return {id:generatedId,chainId:NETWORK_ID,wallet:wallet.toLowerCase(),contract:CONTRACT_ADDRESS.toLowerCase(),method,startedAt};
}

export function parseSigningTransaction(raw:string|null):SigningTransaction|null {
  if(!raw) return null;
  try {
    const parsed=JSON.parse(raw) as Partial<SigningTransaction>;
    if(typeof parsed.id==='string'&&parsed.id.length>0&&parsed.chainId===NETWORK_ID&&typeof parsed.wallet==='string'&&
       /^0x[a-fA-F0-9]{40}$/.test(parsed.wallet)&&typeof parsed.contract==='string'&&/^0x[a-fA-F0-9]{40}$/.test(parsed.contract)&&
       typeof parsed.method==='string'&&parsed.method.length>0&&typeof parsed.startedAt==='number'&&Number.isFinite(parsed.startedAt)) {
      return {...parsed,wallet:parsed.wallet.toLowerCase(),contract:parsed.contract.toLowerCase()} as SigningTransaction;
    }
  } catch { /* Corrupt pre-broadcast records remain ignored and never authorize a write. */ }
  return null;
}

export function signingTransactionStorageKey(record:SigningTransaction):string {
  return `${SIGNING_TX_PREFIX}${record.chainId}:${record.wallet.toLowerCase()}:${record.contract.toLowerCase()}:${encodeURIComponent(record.method)}`;
}

function storage():Storage|null {
  if(typeof window==='undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function transactionStorageAvailable():boolean {
  const store=storage();
  if(!store) return false;
  const key=`${SIGNING_TX_PREFIX}probe`;
  try { store.setItem(key,'1');store.removeItem(key);return true; } catch { return false; }
}

export function readSigningTransactions():SigningTransaction[] {
  const store=storage();
  if(!store) return [];
  try {
    const records:SigningTransaction[]=[];
    const seen=new Set<string>();
    for(let index=0;index<store.length;index++){
      const key=store.key(index);
      if(!key?.startsWith(SIGNING_TX_PREFIX)) continue;
      const record=parseSigningTransaction(store.getItem(key));
      if(record&&!seen.has(record.id)){seen.add(record.id);records.push(record);}
    }
    return records.sort((a,b)=>b.startedAt-a.startedAt);
  } catch { return []; }
}

export function rememberSigningTransaction(record:SigningTransaction):void {
  const store=storage();
  if(!store) throw new Error('Durable browser storage is unavailable; refusing to request a wallet signature.');
  store.setItem(signingTransactionStorageKey(record),JSON.stringify(record));
}

export function forgetSigningTransaction(record:SigningTransaction):void {
  const store=storage();
  if(!store) return;
  try { store.removeItem(signingTransactionStorageKey(record)); } catch { /* Keep the conservative lock if storage cannot be updated. */ }
}

export function signingMatchesWallet(record:SigningTransaction|null,wallet:string):boolean {
  return !!record&&record.chainId===NETWORK_ID&&(!configured||record.contract===CONTRACT_ADDRESS.toLowerCase())&&record.wallet===wallet.toLowerCase();
}

export function isUserRejectedError(error:unknown):boolean {
  if(typeof error!=='object'||error===null) return false;
  const code=(error as {code?:unknown}).code;
  const message=String((error as {message?:unknown}).message??'').toLowerCase();
  return code===4001||message.includes('user rejected')||message.includes('rejected by user')||message.includes('user denied');
}

type WriteLockManager={request:<T>(name:string,options:{ifAvailable:true},callback:(lock:unknown|null)=>Promise<T>)=>Promise<T>};

export async function withWriteCoordination<T>(key:string,task:()=>Promise<T>):Promise<T> {
  const manager=(typeof navigator!=='undefined'?(navigator as Navigator&{locks?:WriteLockManager}).locks:undefined);
  if(!manager?.request) throw new Error('Safe cross-tab write coordination is unavailable; refusing to request a wallet signature.');
  let acquired=false;
  return manager.request(`creditsplit:write:${key}`,{ifAvailable:true},async lock=>{
    if(!lock) throw new Error('Another Creditsplit tab is already handling this wallet write. Reconcile it before signing again.');
    acquired=true;
    return task();
  }).then(result=>{
    if(!acquired) throw new Error('Safe cross-tab write coordination could not be established.');
    return result;
  });
}

export function makeConfirmedTransaction(record:SubmittedTransaction,confirmedAt=Date.now()):ConfirmedTransaction {
  return {...record,outcome:'CONFIRMED_SUCCESS',confirmedAt,syncStatus:'PENDING'};
}

export function parseConfirmedTransaction(raw:string|null):ConfirmedTransaction|null {
  if(!raw) return null;
  try {
    const parsed=JSON.parse(raw) as Partial<ConfirmedTransaction>;
    if(parsed.outcome!=='CONFIRMED_SUCCESS'||typeof parsed.confirmedAt!=='number') return null;
    const record=parseSubmittedTransaction(JSON.stringify(parsed));
    return record&&!record.legacy?{...record,outcome:'CONFIRMED_SUCCESS',confirmedAt:parsed.confirmedAt,syncStatus:parsed.syncStatus==='SYNCED'?'SYNCED':'PENDING'}:null;
  } catch { return null; }
}

export function markConfirmedTransactionSynchronized(record:ConfirmedTransaction):ConfirmedTransaction {
  return {...record,syncStatus:'SYNCED'};
}

export async function reconcileConfirmedRead(
  record:ConfirmedTransaction,
  read:()=>Promise<unknown>,
):Promise<{record:ConfirmedTransaction;synchronized:boolean;error?:string}> {
  try {
    await read();
    return {record:markConfirmedTransactionSynchronized(record),synchronized:true};
  } catch(error) {
    return {record,synchronized:false,error:error instanceof Error?error.message:String(error)};
  }
}

export function readConfirmedTransactions():ConfirmedTransaction[] {
  const store=storage();
  if(!store) return [];
  try {
    const records:ConfirmedTransaction[]=[];
    const seen=new Set<string>();
    for(let index=0;index<store.length;index++){
      const key=store.key(index);
      if(!key?.startsWith(CONFIRMED_TX_PREFIX)) continue;
      const record=parseConfirmedTransaction(store.getItem(key));
      if(record&&!seen.has(record.hash.toLowerCase())){seen.add(record.hash.toLowerCase());records.push(record);}
    }
    return records.sort((a,b)=>b.confirmedAt-a.confirmedAt);
  } catch { return []; }
}

export function rememberConfirmedTransaction(record:ConfirmedTransaction):void {
  const store=storage();
  if(!store) throw new Error('Durable browser storage is unavailable; cannot persist confirmed transaction state.');
  store.setItem(confirmedTransactionStorageKey(record),JSON.stringify(record));
}

export function readSubmittedTransactions():SubmittedTransaction[] {
  const store=storage();
  if(!store) return [];
  try {
    const records:SubmittedTransaction[]=[];
    const seen=new Set<string>();
    const add=(raw:string|null)=>{
      const record=parseSubmittedTransaction(raw);
      if(record&&!seen.has(record.hash.toLowerCase())){seen.add(record.hash.toLowerCase());records.push(record);}
    };
    add(store.getItem(SUBMITTED_TX_KEY));
    for(let index=0;index<store.length;index++){
      const key=store.key(index);
      if(key?.startsWith(SUBMITTED_TX_PREFIX)) add(store.getItem(key));
    }
    return records;
  } catch { return []; }
}

export function rememberSubmittedTransaction(record:SubmittedTransaction):void {
  const store=storage();
  if(!store) throw new Error('Durable browser storage is unavailable; cannot persist transaction recovery state.');
  store.setItem(submittedTransactionStorageKey(record),JSON.stringify(record));
  const legacy=parseSubmittedTransaction(store.getItem(SUBMITTED_TX_KEY));
  if(legacy?.hash.toLowerCase()===record.hash.toLowerCase()) store.removeItem(SUBMITTED_TX_KEY);
}

export function forgetSubmittedTransaction(record:SubmittedTransaction):void {
  const store=storage();
  if(!store) return;
  try {
    store.removeItem(submittedTransactionStorageKey(record));
    const legacy=parseSubmittedTransaction(store.getItem(SUBMITTED_TX_KEY));
    if(legacy?.hash.toLowerCase()===record.hash.toLowerCase()) store.removeItem(SUBMITTED_TX_KEY);
  } catch { /* Do not turn a confirmed result into a failure because storage is unavailable. */ }
}

export function recoveryMatchesWallet(record:SubmittedTransaction|null,wallet:string):boolean {
  if(!record) return false;
  if(record.legacy) return true;
  return record.chainId===NETWORK_ID && (!configured || record.contract===CONTRACT_ADDRESS.toLowerCase()) && record.wallet===wallet.toLowerCase();
}

export function isFinalizedExecutionFailure(error:unknown):boolean {
  return error instanceof FinalizedExecutionFailure;
}

type ReceiptRecord=Record<string,unknown>;
function asReceiptRecord(value:unknown):ReceiptRecord|null {
  return typeof value==='object'&&value!==null?value as ReceiptRecord:null;
}

const STATUS_BY_NUMBER:Record<number,string>={0:'UNINITIALIZED',1:'PENDING',2:'PROPOSING',3:'COMMITTING',4:'REVEALING',5:'ACCEPTED',6:'UNDETERMINED',7:'FINALIZED',8:'CANCELED',9:'APPEAL_REVEALING',10:'APPEAL_COMMITTING',11:'READY_TO_FINALIZE',12:'VALIDATORS_TIMEOUT',13:'LEADER_TIMEOUT'};
const RESULT_BY_NUMBER:Record<number,string>={0:'IDLE',1:'AGREE',2:'DISAGREE',3:'TIMEOUT',4:'DETERMINISTIC_VIOLATION',5:'NO_MAJORITY',6:'MAJORITY_AGREE',7:'MAJORITY_DISAGREE'};
const EXECUTION_BY_NUMBER:Record<number,string>={0:ExecutionResult.NOT_VOTED,1:ExecutionResult.FINISHED_WITH_RETURN,2:ExecutionResult.FINISHED_WITH_ERROR};

export type TransactionOutcome='SUCCESS'|'FAILED'|'PENDING'|'UNKNOWN';
export type ReceiptClassification={outcome:TransactionOutcome;status?:string;result?:string;execution?:string;reason:string};

function decodeEnum(record:ReceiptRecord, namedKeys:string[], numericKeys:string[], map:Record<number,string>):{value?:string;present:boolean;valid:boolean} {
  const named=namedKeys.flatMap(key=>record[key]===undefined?[]:[record[key]]);
  const numeric=numericKeys.flatMap(key=>record[key]===undefined?[]:[record[key]]);
  const decodedNamed=named.map(value=>typeof value==='string'?value:null);
  const decodedNumeric=numeric.map(value=>{
    if(typeof value==='number'&&Number.isInteger(value)) return map[value]??null;
    if(typeof value==='string') {
      if(/^\d+$/.test(value)) return map[Number(value)]??null;
      return Object.values(map).includes(value) ? value : null;
    }
    return null;
  });
  if(decodedNamed.some(value=>value===null)||decodedNumeric.some(value=>value===null)) return {present:true,valid:false};
  const values=[...decodedNamed,...decodedNumeric] as string[];
  return {present:values.length>0,value:values.length&&values.every(value=>value===values[0])?values[0]:undefined,valid:values.length===0||values.every(value=>value===values[0])};
}

function isBenignQuorumCancellation(value:ReceiptRecord|null):boolean {
  if(!value||value.execution_result!=='ERROR'||value.vote!=='idle') return false;
  const genvmResult=asReceiptRecord(value.genvm_result);
  const errorCodes=[value.error_code,genvmResult?.error_code].filter((code):code is string=>typeof code==='string');
  if(!errorCodes.includes('CONSENSUS_VALIDATOR_QUORUM_REACHED')) return false;
  const rawErrors=[value.raw_error,genvmResult?.raw_error].map(asReceiptRecord).filter((error):error is ReceiptRecord=>!!error);
  if(!rawErrors.length) return true;
  return rawErrors.some(error=>Array.isArray(error.causes)&&error.causes.includes('VALIDATOR_QUORUM_REACHED'));
}

function consensusRecord(receipt:ReceiptRecord):{record:ReceiptRecord|null;present:boolean;valid:boolean} {
  const values=[receipt.consensusData,receipt.consensus_data].filter(value=>value!==undefined);
  if(values.length===0) return {record:null,present:false,valid:true};
  if(values.length===2&&JSON.stringify(values[0])!==JSON.stringify(values[1])) return {record:null,present:true,valid:false};
  const record=asReceiptRecord(values[0]);
  return {record,present:true,valid:!!record};
}

function leaderSuccess(consensus:ReceiptRecord|null):{present:boolean;success:boolean;failed:boolean;valid:boolean} {
  if(!consensus||consensus.leader_receipt===undefined) return {present:false,success:false,failed:false,valid:true};
  const leaders=Array.isArray(consensus.leader_receipt)?consensus.leader_receipt:[consensus.leader_receipt];
  if(!leaders.length) return {present:true,success:false,failed:false,valid:false};
  let failed=false;
  for(const raw of leaders){
    const item=asReceiptRecord(raw);
    if(!item||typeof item.execution_result!=='string') return {present:true,success:false,failed:false,valid:false};
    if(['ERROR','FINISHED_WITH_ERROR','FAILED'].includes(item.execution_result)) failed=true;
    else if(!['SUCCESS','FINISHED_WITH_RETURN'].includes(item.execution_result)) return {present:true,success:false,failed:false,valid:false};
  }
  return {present:true,success:!failed,failed,valid:true};
}

function validatorsValid(consensus:ReceiptRecord|null):boolean {
  if(!consensus||consensus.validators===undefined) return true;
  if(!Array.isArray(consensus.validators)) return false;
  return consensus.validators.every(raw=>{
    const validator=asReceiptRecord(raw);
    if(!validator) return false;
    const execution=validator.execution_result;
    return execution===undefined || execution==='SUCCESS' || execution==='FINISHED_WITH_RETURN' || isBenignQuorumCancellation(validator);
  });
}

/** Classify only evidence exposed by the pinned genlayer-js 1.1.8 receipt shapes. */
export function classifyTransactionReceipt(value:unknown):ReceiptClassification {
  const receipt=asReceiptRecord(value);
  if(!receipt) return {outcome:'UNKNOWN',reason:'Receipt is not an object.'};
  const status=decodeEnum(receipt,['statusName','status_name'],['status'],STATUS_BY_NUMBER);
  if(!status.present||!status.valid||!status.value) return {outcome:'UNKNOWN',reason:'Missing or contradictory transaction status.'};
  if(status.value!=='FINALIZED') return {outcome:status.value==='CANCELED'?'FAILED':'PENDING',status:status.value,reason:`Transaction status is ${status.value}.`};
  const result=decodeEnum(receipt,['resultName','result_name'],['result'],RESULT_BY_NUMBER);
  if(!result.present||!result.valid||!result.value) return {outcome:'UNKNOWN',status:status.value,reason:'Finalized receipt has no authoritative consensus result.'};
  if(result.value!=='MAJORITY_AGREE') return {outcome:'FAILED',status:status.value,result:result.value,reason:`Finalized consensus result is ${result.value}.`};
  const execution=decodeEnum(receipt,['txExecutionResultName','tx_execution_result_name'],['txExecutionResult'],EXECUTION_BY_NUMBER);
  if(execution.present&&!execution.valid) return {outcome:'UNKNOWN',status:status.value,result:result.value,reason:'Execution fields contradict one another.'};
  if(execution.value===ExecutionResult.FINISHED_WITH_ERROR) return {outcome:'FAILED',status:status.value,result:result.value,execution:execution.value,reason:'Contract execution explicitly failed.'};
  if(execution.value===ExecutionResult.NOT_VOTED||(!execution.present&&!receipt.consensusData&&!receipt.consensus_data)) return {outcome:'UNKNOWN',status:status.value,result:result.value,execution:execution.value,reason:'Finalized receipt lacks successful execution evidence.'};
  const consensus=consensusRecord(receipt);
  if(!consensus.valid) return {outcome:'UNKNOWN',status:status.value,result:result.value,execution:execution.value,reason:'Consensus data is malformed or contradictory.'};
  const leader=leaderSuccess(consensus.record);
  if(!leader.valid||leader.failed||!validatorsValid(consensus.record)) return {outcome:leader.failed?'FAILED':'UNKNOWN',status:status.value,result:result.value,execution:execution.value,reason:leader.failed?'Leader execution explicitly failed.':'Validator execution evidence is malformed or unsuccessful.'};
  if(!leader.present) return {outcome:'UNKNOWN',status:status.value,result:result.value,execution:execution.value,reason:'No successful leader execution record was established.'};
  if(!leader.success) return {outcome:'UNKNOWN',status:status.value,result:result.value,execution:execution.value,reason:'No successful contract or leader execution was established.'};
  return {outcome:'SUCCESS',status:status.value,result:result.value,execution:execution.value,reason:'FINALIZED, MAJORITY_AGREE and successful execution are all established.'};
}

export function isSuccessfulFinalizedReceipt(value:unknown):boolean { return classifyTransactionReceipt(value).outcome==='SUCCESS'; }

class FinalizedExecutionFailure extends Error {
  constructor(public readonly hash:string,public readonly receipt:unknown) {
    super(`Transaction finalized without successful execution. Inspect ${hash}.`);
    this.name='FinalizedExecutionFailure';
  }
}

class UnknownTransactionOutcome extends Error {
  constructor(public readonly hash:string,public readonly receipt:unknown) {
    super(`Transaction outcome is unresolved; keep the recovery lock and reconcile ${hash}.`);
    this.name='UnknownTransactionOutcome';
  }
}

export interface Provider { request(args:{method:string;params?:unknown[]}):Promise<unknown>;on?(event:string, callback:(...args:unknown[])=>void):void;removeListener?(event:string,callback:(...args:unknown[])=>void):void; }
declare global { interface Window { ethereum?: Provider } }

export function readClient() { return createClient({chain:studionet}); }
export async function readContract<T>(method: string, args: unknown[] = []): Promise<T> {
  if(!configured) throw new Error('Contract address not configured. Source is prepared but no deployment is claimed.');
  const result = await readClient().readContract({
    address:CONTRACT_ADDRESS as `0x${string}`,functionName:method,args:args as CalldataEncodable[],
    transactionHashVariant:TransactionHashVariant.LATEST_FINAL,
  });
  return result as T;
}
export async function connectWallet(): Promise<string> {
  const ethereum = window.ethereum;
  if(!ethereum) throw new Error('Install or enable an injected MetaMask wallet to participate.');
  const accounts = await ethereum.request({method:'eth_requestAccounts'}) as string[];
  if(!accounts?.[0]) throw new Error('No wallet account selected.');
  let chain = (await ethereum.request({method:'eth_chainId'})) as string;
  if(parseInt(chain,16)!==NETWORK_ID){
    try {await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:NETWORK_HEX}]});}
    catch(error){
      if(typeof error==='object' && error!==null && 'code' in error && error.code===4902){
        await ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:NETWORK_HEX,chainName:'GenLayer StudioNet',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},rpcUrls:[RPC_URL],blockExplorerUrls:[EXPLORER]}]});
      }else{throw error;}
    }
  }
  chain = (await ethereum.request({method:'eth_chainId'})) as string;
  if(parseInt(chain,16)!==NETWORK_ID) throw new Error('Wallet is not connected to StudioNet 61999.');
  return accounts[0];
}
export async function waitForSuccessfulFinalization(hash:string) {
  const receipt=await readClient().waitForTransactionReceipt({hash:asHash(hash),status:TransactionStatus.FINALIZED});
  const classification=classifyTransactionReceipt(receipt);
  if(classification.outcome==='FAILED') throw new FinalizedExecutionFailure(hash,receipt);
  if(classification.outcome!=='SUCCESS') throw new UnknownTransactionOutcome(hash,receipt);
  return receipt;
}
export async function writeAndConfirm(method:string,args:unknown[],value:bigint,wallet:string,onHash:(hash:string)=>void) {
  if(!configured) throw new Error('Set NEXT_PUBLIC_CONTRACT_ADDRESS to a source-matched StudioNet deployment.');
  const operationKey=`${NETWORK_ID}:${wallet.toLowerCase()}:${CONTRACT_ADDRESS.toLowerCase()}:${method}`;
  return withWriteCoordination(operationKey,async()=>{
    const live = await connectWallet();
    if(live.toLowerCase()!==wallet.toLowerCase()) throw new Error('Wallet changed; reconnect before signing.');
    const signing=makeSigningTransaction(wallet,method);
    // This write-ahead record is durable before the injected provider can ask
    // for a signature. If it cannot be stored, no signature is requested.
    rememberSigningTransaction(signing);
    let submittedHash='';
    try {
      const client = createClient({chain:studionet,account:wallet as `0x${string}`,provider:window.ethereum});
      const call={address:CONTRACT_ADDRESS as `0x${string}`,functionName:method,args:args as CalldataEncodable[],value};
      const hash=String(await client.writeContract(call));
      submittedHash=hash;
      const submitted=makeSubmittedTransaction(hash,wallet,method);
      rememberSubmittedTransaction(submitted);
      onHash(hash);
      const receipt=await waitForSuccessfulFinalization(hash);
      // Persist the authoritative success before clearing the unresolved
      // record. A later UI read failure must never erase this fact.
      rememberConfirmedTransaction(makeConfirmedTransaction(submitted));
      forgetSubmittedTransaction(submitted);
      forgetSigningTransaction(signing);
      return {hash,receipt};
    } catch(error) {
      if(!submittedHash || (!isFinalizedExecutionFailure(error)&&error instanceof UnknownTransactionOutcome)) {
        // Keep the signing record for rejection/timeout/unknown outcomes until
        // the caller can reconcile or explicitly establish that no hash exists.
        if(!submittedHash&&isUserRejectedError(error)) forgetSigningTransaction(signing);
      } else if(isFinalizedExecutionFailure(error)) {
        forgetSubmittedTransaction(makeSubmittedTransaction(submittedHash,wallet,method));
        forgetSigningTransaction(signing);
      }
      throw error;
    }
  });
}
