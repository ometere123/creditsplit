import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {ExecutionResult, TransactionHashVariant, TransactionStatus, type CalldataEncodable, type Hash} from 'genlayer-js/types';

export const NETWORK_ID = 61999;
export const NETWORK_HEX = '0xf22f';
export const RPC_URL = 'https://studio.genlayer.com/api';
export const EXPLORER = 'https://explorer-studio.genlayer.com';
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
export const configured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);
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
    if(typeof parsed.hash==='string' && /^0x[a-fA-F0-9]{64}$/.test(parsed.hash) &&
       parsed.chainId===NETWORK_ID && typeof parsed.wallet==='string' &&
       typeof parsed.contract==='string' && typeof parsed.method==='string' &&
       typeof parsed.submittedAt==='number') {
      return {...parsed,hash:parsed.hash,wallet:parsed.wallet.toLowerCase(),contract:parsed.contract.toLowerCase()} as SubmittedTransaction;
    }
  } catch { /* A legacy or corrupt record is handled below. */ }
  if(/^0x[a-fA-F0-9]{64}$/.test(raw)) {
    return {hash:raw,chainId:NETWORK_ID,wallet:'',contract:CONTRACT_ADDRESS.toLowerCase(),method:'legacy',submittedAt:0,legacy:true};
  }
  return null;
}

export function recoveryMatchesWallet(record:SubmittedTransaction|null,wallet:string):boolean {
  if(!record) return false;
  if(record.legacy) return true;
  return record.chainId===NETWORK_ID && record.contract===CONTRACT_ADDRESS.toLowerCase() && record.wallet===wallet.toLowerCase();
}

export function isFinalizedExecutionFailure(error:unknown):boolean {
  return error instanceof FinalizedExecutionFailure;
}

class FinalizedExecutionFailure extends Error {
  constructor(public readonly hash:string,public readonly receipt:unknown) {
    const details=receipt as {statusName?:string;txExecutionResultName?:string};
    super(`Transaction finalized without successful execution: ${details.statusName ?? 'unknown'} / ${details.txExecutionResultName ?? 'unknown'}. Inspect ${hash}.`);
    this.name='FinalizedExecutionFailure';
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
  if(receipt.txExecutionResultName!==ExecutionResult.FINISHED_WITH_RETURN){
    throw new FinalizedExecutionFailure(hash,receipt);
  }
  return receipt;
}
export async function writeAndConfirm(method:string,args:unknown[],value:bigint,wallet:string,onHash:(hash:string)=>void) {
  if(!configured) throw new Error('Set NEXT_PUBLIC_CONTRACT_ADDRESS to a source-matched StudioNet deployment.');
  const live = await connectWallet();
  if(live.toLowerCase()!==wallet.toLowerCase()) throw new Error('Wallet changed; reconnect before signing.');
  const client = createClient({chain:studionet,account:wallet as `0x${string}`,provider:window.ethereum});
  const call={address:CONTRACT_ADDRESS as `0x${string}`,functionName:method,args:args as CalldataEncodable[],value};
  const hash=await client.writeContract(call);
  onHash(String(hash));
  const receipt=await waitForSuccessfulFinalization(String(hash));
  return {hash:String(hash),receipt};
}
