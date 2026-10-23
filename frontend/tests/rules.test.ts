import {describe,it,expect} from 'vitest';
import {parseGen,formatGen,bytes,validateProjectInput} from '../lib/types';
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
});
