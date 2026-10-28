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
  if(typeof window==='undefined') return [];
  const records:ConfirmedTransaction[]=[];
  const seen=new Set<string>();
  for(let index=0;index<window.localStorage.length;index++){
    const key=window.localStorage.key(index);
    if(!key?.startsWith(CONFIRMED_TX_PREFIX)) continue;
    const record=parseConfirmedTransaction(window.localStorage.getItem(key));
    if(record&&!seen.has(record.hash.toLowerCase())){seen.add(record.hash.toLowerCase());records.push(record);}
  }
  return records.sort((a,b)=>b.confirmedAt-a.confirmedAt);
}

export function rememberConfirmedTransaction(record:ConfirmedTransaction):void {
  if(typeof window==='undefined') return;
  window.localStorage.setItem(confirmedTransactionStorageKey(record),JSON.stringify(record));
}

export function readSubmittedTransactions():SubmittedTransaction[] {
  if(typeof window==='undefined') return [];
  const records:SubmittedTransaction[]=[];
  const seen=new Set<string>();
  const add=(raw:string|null)=>{
    const record=parseSubmittedTransaction(raw);
    if(record&&!seen.has(record.hash.toLowerCase())){seen.add(record.hash.toLowerCase());records.push(record);}
  };
  add(window.localStorage.getItem(SUBMITTED_TX_KEY));
  for(let index=0;index<window.localStorage.length;index++){
    const key=window.localStorage.key(index);
    if(key?.startsWith(SUBMITTED_TX_PREFIX)) add(window.localStorage.getItem(key));
  }
  return records;
}

export function rememberSubmittedTransaction(record:SubmittedTransaction):void {
  if(typeof window==='undefined') return;
  window.localStorage.setItem(submittedTransactionStorageKey(record),JSON.stringify(record));
  const legacy=parseSubmittedTransaction(window.localStorage.getItem(SUBMITTED_TX_KEY));
  if(legacy?.hash.toLowerCase()===record.hash.toLowerCase()) window.localStorage.removeItem(SUBMITTED_TX_KEY);
}

export function forgetSubmittedTransaction(record:SubmittedTransaction):void {
  if(typeof window==='undefined') return;
  window.localStorage.removeItem(submittedTransactionStorageKey(record));
  const legacy=parseSubmittedTransaction(window.localStorage.getItem(SUBMITTED_TX_KEY));
  if(legacy?.hash.toLowerCase()===record.hash.toLowerCase()) window.localStorage.removeItem(SUBMITTED_TX_KEY);
}

export function recoveryMatchesWallet(record:SubmittedTransaction|null,wallet:string):boolean {
  if(!record) return false;
  if(record.legacy) return true;
  return record.chainId===NETWORK_ID && (!configured || record.contract===CONTRACT_ADDRESS.toLowerCase()) && record.wallet===wallet.toLowerCase();
}

export function isFinalizedExecutionFailure(error:unknown):boolean {
  return error instanceof FinalizedExecutionFailure;
}

class FinalizedExecutionFailure extends Error {
  constructor(public readonly hash:string,public readonly receipt:unknown) {
    const details=receipt as {statusName?:string;status_name?:string;txExecutionResultName?:string;tx_execution_result_name?:string;resultName?:string;result_name?:string};
    super(`Transaction finalized without successful execution: ${details.statusName ?? details.status_name ?? 'unknown'} / ${details.txExecutionResultName ?? details.tx_execution_result_name ?? details.resultName ?? details.result_name ?? 'unknown'}. Inspect ${hash}.`);
    this.name='FinalizedExecutionFailure';
  }
}

type ReceiptRecord=Record<string,unknown>;
function asReceiptRecord(value:unknown):ReceiptRecord|null {
  return typeof value==='object'&&value!==null?value as ReceiptRecord:null;
}

function isBenignQuorumCancellation(value:ReceiptRecord|null):boolean {
  if(!value||value.execution_result!=='ERROR'||value.vote!=='idle') return false;
  const genvmResult=asReceiptRecord(value.genvm_result);
  const errorCodes=[value.error_code,genvmResult?.error_code]
    .filter((code):code is string=>typeof code==='string');
  if(!errorCodes.includes('CONSENSUS_VALIDATOR_QUORUM_REACHED')) return false;

  // The full genlayer-js receipt nests this diagnostic under genvm_result.
  // If a raw error is present, require it to independently identify the
  // same quorum cancellation; arbitrary validator errors stay failures.
  const rawErrors=[value.raw_error,genvmResult?.raw_error]
    .map(asReceiptRecord)
    .filter((error):error is ReceiptRecord=>!!error);
  if(!rawErrors.length) return true;
  return rawErrors.some(error=>Array.isArray(error.causes)&&error.causes.includes('VALIDATOR_QUORUM_REACHED'));
}

/**
 * StudioNet's genlayer-js 1.1.8 simplified receipt omits txExecutionResultName.
 * In that shape, the authoritative successful parent signal is FINALIZED plus
 * MAJORITY_AGREE and a successful leader execution. Never treat finalization
 * alone as proof of a successful contract write.
 */
export function isSuccessfulFinalizedReceipt(value:unknown):boolean {
  const receipt=asReceiptRecord(value);
  if(!receipt) return false;
  const statusNames=[receipt.statusName,receipt.status_name].filter(value=>value!==undefined);
  const statusNumbers=[receipt.status].filter(value=>value!==undefined).map(value=>typeof value==='number'?value:Number(value));
  if(statusNames.some(value=>typeof value!=='string'||value!=='FINALIZED')||
     statusNumbers.some(value=>!Number.isFinite(value)||value!==7)||
     (!statusNames.length&&!statusNumbers.length)) return false;

  const executionNames=[receipt.txExecutionResultName,receipt.tx_execution_result_name].filter(value=>value!==undefined);
  const executionNumbers=[receipt.txExecutionResult].filter(value=>value!==undefined).map(value=>typeof value==='number'?value:Number(value));
  if(executionNames.some(value=>value!==ExecutionResult.FINISHED_WITH_RETURN&&value!==ExecutionResult.FINISHED_WITH_ERROR&&value!==ExecutionResult.NOT_VOTED)||
     executionNumbers.some(value=>!Number.isFinite(value)||!([0,1,2] as number[]).includes(value))||
     (executionNames.length===2&&executionNames[0]!==executionNames[1])||
     (executionNumbers.length===2&&executionNumbers[0]!==executionNumbers[1])||
     (executionNames.length&&executionNumbers.length&&
       ((executionNames[0]===ExecutionResult.FINISHED_WITH_RETURN&&executionNumbers[0]!==1)||
        (executionNames[0]===ExecutionResult.NOT_VOTED&&executionNumbers[0]!==0)||
        (executionNames[0]===ExecutionResult.FINISHED_WITH_ERROR&&executionNumbers[0]!==2)))) return false;
  const explicitExecutionSuccess=executionNames.includes(ExecutionResult.FINISHED_WITH_RETURN)||executionNumbers.includes(1);
  const explicitExecutionFailure=executionNames.some(value=>value!==ExecutionResult.FINISHED_WITH_RETURN)||executionNumbers.some(value=>value!==1);
  if(explicitExecutionFailure) return false;

  const resultNames=[receipt.resultName,receipt.result_name].filter(value=>value!==undefined);
  const resultNumbers=[receipt.result].filter(value=>value!==undefined).map(value=>typeof value==='number'?value:Number(value));
  const resultByNumber=['IDLE','AGREE','DISAGREE','TIMEOUT','DETERMINISTIC_VIOLATION','NO_MAJORITY','MAJORITY_AGREE','MAJORITY_DISAGREE'];
  if(resultNames.some(value=>typeof value!=='string'||!resultByNumber.includes(value))||
     resultNumbers.some(value=>!Number.isFinite(value)||value<0||value>7||!Number.isInteger(value))||
     (resultNames.length===2&&resultNames[0]!==resultNames[1])||
     (resultNumbers.length===2&&resultNumbers[0]!==resultNumbers[1])||
     (resultNames.length&&resultNumbers.length&&resultByNumber[resultNumbers[0]]!==resultNames[0])) return false;
  const consensusNames=resultNames.length?resultNames:[...resultNumbers.map(value=>resultByNumber[value])];
  if(consensusNames.some(value=>value!=='MAJORITY_AGREE')) return false;
  const explicitConsensusSuccess=consensusNames.includes('MAJORITY_AGREE');

  const consensusValues=[receipt.consensusData,receipt.consensus_data].filter(value=>value!==undefined);
  if(consensusValues.length===2&&JSON.stringify(consensusValues[0])!==JSON.stringify(consensusValues[1])) return false;
  const consensus=consensusValues.length?asReceiptRecord(consensusValues[0]):null;
  if(consensusValues.length&&!consensus) return false;
  if(consensus){
    const leaderRaw=consensus.leader_receipt;
    if(leaderRaw!==undefined){
      const leaders=Array.isArray(leaderRaw)?leaderRaw:[leaderRaw];
      if(!leaders.length) return false;
      for(const raw of leaders){
        const leader=asReceiptRecord(raw);
        const leaderExecution=leader?.execution_result;
        if(typeof leaderExecution!=='string'||!['SUCCESS','FINISHED_WITH_RETURN'].includes(leaderExecution)) return false;
      }
    }
    const validators=consensus.validators;
    if(validators!==undefined){
      if(!Array.isArray(validators)) return false;
      for(const raw of validators){
        const validator=asReceiptRecord(raw);
        if(!validator) return false;
        const executionResult=validator.execution_result;
        if(executionResult!==undefined&&
           (typeof executionResult!=='string'||
            (!['SUCCESS','FINISHED_WITH_RETURN'].includes(executionResult)&&!isBenignQuorumCancellation(validator)))) return false;
      }
    }
  }
  // A simplified receipt is accepted only when it contains the complete
  // FINALIZED + MAJORITY_AGREE + successful leader path. Full SDK receipts
  // may omit consensus fields, but must expose FINISHED_WITH_RETURN.
  return explicitExecutionSuccess || (explicitConsensusSuccess&&!!consensus&&Array.isArray(consensus.leader_receipt)&&consensus.leader_receipt.length>0);
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
  if(!isSuccessfulFinalizedReceipt(receipt)){
    throw new FinalizedExecutionFailure(hash,receipt);
  }
  return receipt;
}
export async function writeAndConfirm(method:string,args:unknown[],value:bigint,wallet:string,onHash:(hash:string)=>void) {
  if(!configured) throw new Error('Set NEXT_PUBLIC_CONTRACT_ADDRESS to a source-matched StudioNet deployment.');
  const live = await connectWallet();
  if(live.toLowerCase()!==wallet.toLowerCase()) throw new Error('Wallet changed; reconnect before signing.');
  const client = createClient({chain:studionet,account:wallet as `0x${string}`,provider:window.ethereum});
  // genlayer-js@1.1.8 builds the consensus-contract transaction, estimates gas,
  // and supplies the wallet-selected gas price before requesting the signature.
  // Keep the sponsor value separate from network fee selection.
  const call={address:CONTRACT_ADDRESS as `0x${string}`,functionName:method,args:args as CalldataEncodable[],value};
  const hash=await client.writeContract(call);
  onHash(String(hash));
  const receipt=await waitForSuccessfulFinalization(String(hash));
  return {hash:String(hash),receipt};
}
