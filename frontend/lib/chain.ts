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
function receiptString(receipt:ReceiptRecord,camel:string,snake:string):string|undefined {
  const value=receipt[camel]??receipt[snake];
  return typeof value==='string'?value:undefined;
}
function receiptNumber(receipt:ReceiptRecord,key:string):number|undefined {
  const value=receipt[key];
  return typeof value==='number'?value:typeof value==='string'?Number(value):undefined;
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
  const status=receiptString(receipt,'statusName','status_name');
  const finalized=status==='FINALIZED'||receiptNumber(receipt,'status')===7;
  if(!finalized) return false;
  const execution=receiptString(receipt,'txExecutionResultName','tx_execution_result_name');
  if(execution) return execution===ExecutionResult.FINISHED_WITH_RETURN;
  const result=receiptString(receipt,'resultName','result_name');
  const consensus=asReceiptRecord(receipt.consensusData??receipt.consensus_data);
  const leaderReceipts=consensus?.leader_receipt;
  const leader=Array.isArray(leaderReceipts)?asReceiptRecord(leaderReceipts[0]):null;
  const leaderExecution=leader&&typeof leader.execution_result==='string'?leader.execution_result:undefined;
  return result==='MAJORITY_AGREE'&&leaderExecution==='SUCCESS';
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
