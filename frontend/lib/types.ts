export type Status = 'RECRUITING'|'ACTIVE'|'ASSEMBLY'|'REVIEW'|'FROZEN'|'SETTLEMENT_EMITTED'|'REFUND_EMITTED';
export type CriterionStatus = 'met'|'partial'|'not_met';
export type MaterialEffect = 'foundational'|'substantial'|'supporting'|'none';
export type Packet = { id: string; text: string; at: number; revision_of: string; references: string[] };
export type Assessment = {
  relevance: 'direct'|'supporting'|'none';
  distinct: boolean;
  correctness: boolean;
  material_effect: MaterialEffect;
  factual_status: 'supported'|'contradicted'|'unverifiable'|'not_applicable';
  attribution_consistent: boolean;
  evidence_ids: string[];
  evidence_anchors: string[];
  justification: string;
};
export type Decision = { complete: boolean; criteria_status: CriterionStatus[]; source_status: 'verified'|'not_used'; source_digest: string; assessments: Assessment[]; informational_weights: number[]; reason: string };
export type Project = {
  id: number; title: string; brief: string; criteria: string[]; sponsor: string; contributors: string[];
  assembler_slot: number; joined: boolean[]; complete: boolean[];
  packets: Packet[][]; final_text: string; source_refs: string[];
  responses: string[]; acknowledged: boolean[]; pool_wei: string; created_at: number;
  recruit_due: number; contribute_due: number; assemble_due: number; review_due: number;
  frozen_at: number; evidence_digest: string; fallback_assembly: boolean;
  verified_source_url?: string; verified_source_digest?: string; verified_source_status?: 'PENDING'|'VERIFIED'|'NOT_CONFIGURED'|'NOT_USED';
  status: Status; completion: null|boolean; criteria_status: CriterionStatus[]; weights: number[]; amounts_wei: string[];
  decision: Decision|null;
  settlement: string; settlement_at: number;
};
export type ProjectPreview = Pick<Project,'id'|'title'|'brief'|'status'|'pool_wei'|'sponsor'|'joined'>;
export type Profile = { projects: number; points: number; earned_wei: string };
export const EMPTY_PROFILE: Profile = {projects:0,points:0,earned_wei:'0'};
export const MAX_WEI = 10n**26n;
export function parseGen(input: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(input.trim())) throw new Error('Use a positive GEN amount with up to 18 decimals.');
  const [whole, part = ''] = input.trim().split('.');
  const amount = BigInt(whole)*10n**18n + BigInt((part+'0'.repeat(18)).slice(0,18));
  if (amount <= 0n || amount > MAX_WEI) throw new Error('Reward must be greater than zero and at most 100,000,000 GEN.');
  return amount;
}
export function formatGen(wei: string | bigint): string {
  const amount = BigInt(wei || '0');
  const major = amount/10n**18n;
  const fraction = (amount%10n**18n).toString().padStart(18,'0').slice(0,4).replace(/0+$/,'');
  return major.toLocaleString('en-US')+(fraction?'.'+fraction:'');
}
export function shortAddress(a: string): string { return a ? a.slice(0,6)+'…'+a.slice(-4):'—'; }
export function formatDate(value: number): string { return value ? new Date(value*1000).toLocaleString() : 'Not scheduled'; }
export function bytes(s: string): number {return new TextEncoder().encode(s).length;}
export function isAddress(s: string): boolean {return /^0x[a-fA-F0-9]{40}$/.test(s)&& !/^0x0{40}$/i.test(s);}
export function getSlot(p: Project, wallet: string): number {return p.contributors.findIndex(a=>a.toLowerCase()===wallet.toLowerCase());}
export function currentDeadline(p: Project): number {
  switch(p.status){case 'RECRUITING':return p.recruit_due; case 'ACTIVE':return p.contribute_due;case 'ASSEMBLY':return p.assemble_due;case 'REVIEW':return p.review_due;default:return 0;}
}
export function validateProjectInput(title: string, brief: string, addresses: string[], sponsor: string): void {
  if(bytes(title)===0||bytes(title)>80)throw new Error('Title: 1–80 UTF-8 bytes.');
  if(bytes(brief)===0||bytes(brief)>1500)throw new Error('Brief: 1–1500 UTF-8 bytes.');
  if(addresses.length!==3||!addresses.every(isAddress)||new Set(addresses.map(s=>s.toLowerCase())).size!==3) throw new Error('Enter three distinct valid invitee wallets.');
  if(addresses.some(s=>s.toLowerCase()===sponsor.toLowerCase())) throw new Error('Sponsor cannot be a contributor.');
}
export function validateCriteria(criteria: string[]): void {
  if(criteria.length!==3||criteria.some(value=>bytes(value)===0||bytes(value)>360)) {
    throw new Error('Add exactly three non-empty acceptance criteria, each no more than 360 UTF-8 bytes.');
  }
}
export function validateVerifiedSource(url: string, digest: string): void {
  if (!url && !digest) return;
  const parts=url.split('/');
  const commit=parts[5] ?? '';
  const path=parts.slice(6).join('/');
  if (!url.startsWith('https://raw.githubusercontent.com/') || parts.length<7 ||
      !/^[a-fA-F0-9]{40}$/.test(commit) || !path || path.includes('..') ||
      !/\.(md|txt|json|csv)$/i.test(path) || !/^[a-fA-F0-9]{64}$/.test(digest)) {
    throw new Error('Verified source must be a raw GitHub text/JSON file pinned to a 40-character commit SHA with its 64-character SHA-256 digest.');
  }
}
