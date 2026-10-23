"""Offline state-machine and adversarial leader harness; NOT a substitute for GenVM Direct Mode."""
import importlib.util
import json
import sys
import types
import pytest
from pathlib import Path

ADDR = ['0x'+str(i)*40 for i in range(1,6)]

class Map(dict):
    @classmethod
    def __class_getitem__(cls, _): return cls

class Address:
    def __init__(self, value):
        if not isinstance(value,str) or len(value)!=42 or not value.startswith('0x') or any(c not in '0123456789abcdefABCDEF' for c in value[2:]): raise ValueError('address')
        self.value=value.lower()
    def __str__(self):return self.value

class Return:
    def __init__(self,calldata):self.calldata=calldata

class UserError(Exception):pass

class FakeWrite:
    def __call__(self,method):return method
    @property
    def payable(self):return self

class FakeRecipient:
    def __init__(self,address):self.address=str(address)
    def emit_transfer(self, value, on='finalized'):
        if on != 'finalized': raise AssertionError('transfers must finalize')
        FAKE.transfers.append((self.address,int(value)))

FAKE = types.SimpleNamespace(
    Contract=object,
    vm=types.SimpleNamespace(UserError=UserError,Return=Return),
    message=types.SimpleNamespace(sender_address=ADDR[0],value=0),
    public=types.SimpleNamespace(write=FakeWrite(),view=lambda method:method),
    evm=types.SimpleNamespace(contract_interface=lambda cls:cls),
    nondet=types.SimpleNamespace(exec_prompt=lambda prompt, **kwargs: '{}'),
    transfers=[],
)

def load_contract():
    global FAKE
    FAKE.transfers.clear();FAKE.message.sender_address=ADDR[0];FAKE.message.value=0
    module=types.ModuleType('genlayer')
    module.__dict__.update(gl=FAKE,TreeMap=Map,u256=int,u32=int,u8=int,Address=Address)
    sys.modules['genlayer']=module
    path=Path(__file__).resolve().parents[1]/'contracts'/'Creditsplit.py'
    spec=importlib.util.spec_from_file_location('creditsplit_under_test',path)
    imported=importlib.util.module_from_spec(spec);spec.loader.exec_module(imported)
    imported._NativeRecipient=FakeRecipient
    chain=imported.Creditsplit()
    # The real GenVM creates annotated persistent fields automatically. The
    # offline harness supplies ordinary in-memory equivalents explicitly.
    chain.projects=Map()
    chain.profiles=Map()
    clock=[1_700_000_000]
    chain._now=lambda:clock[0]
    FAKE.vm.run_nondet_unsafe=lambda leader,validator:_consensus(leader,validator)
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps({'complete':True,'weights':[5,3,1], 'evidence_ids':[['0:1'],['1:1'],['2:1']], 'reason':'Assess registered sources'})
    return chain,clock

def _consensus(leader,validator):
    answer=leader()
    if not validator(Return(answer)):raise UserError('validators rejected leader')
    return answer

def acting(address, value=0):
    FAKE.message.sender_address=address;FAKE.message.value=value

def create(chain,value=90):
    acting(ADDR[0],value)
    return chain.create_project('Technical report','Build a technical report',ADDR[1],ADDR[2],ADDR[3],0)

def recruited(chain):
    id=create(chain)
    for a in ADDR[1:4]:acting(a);chain.join_project(id)
    return id

def fully_submitted(chain):
    id=recruited(chain)
    for i,a in enumerate(ADDR[1:4]):
        acting(a);chain.submit_contribution(id,['Core research','Correctness review','Editing support'][i]);chain.finish_contributing(id)
    acting(ADDR[1]);chain.submit_final_artifact(id,'A complete technical report on bridges.','["0:1","1:1","2:1"]')
    for a in ADDR[1:4]:acting(a);chain.respond_attribution(id,'')
    acting(ADDR[0]);chain.freeze_project(id)
    return id

@pytest.fixture
def fixture():
    previous= sys.modules.get('genlayer')
    value=load_contract()
    try:
        yield value
    finally:
        if previous is None:
            sys.modules.pop('genlayer',None)
        else:
            sys.modules['genlayer']=previous

def test_create_escrow_and_reject_sponsor_invite(fixture):
    c,_=fixture;id=create(c)
    assert id==1 and c.active_escrow==90
    acting(ADDR[0],10)
    with pytest.raises(UserError):c.create_project('Title','Brief',ADDR[0],ADDR[2],ADDR[3],0)
    assert c.active_escrow==90

def test_payment_required(fixture):
    c,_=fixture;acting(ADDR[0],0)
    with pytest.raises(UserError):c.create_project('Title','Brief',ADDR[1],ADDR[2],ADDR[3],0)

def test_distinct_wallets(fixture):
    c,_=fixture;acting(ADDR[0],10)
    with pytest.raises(UserError):c.create_project('Title','Brief',ADDR[1],ADDR[1],ADDR[3],0)

def test_join_and_permissions(fixture):
    c,_=fixture;id=create(c);acting(ADDR[4]);
    with pytest.raises(UserError):c.join_project(id)
    acting(ADDR[1]);c.join_project(id)
    with pytest.raises(UserError):c.join_project(id)
    for a in ADDR[2:4]:acting(a);c.join_project(id)
    assert json.loads(c.get_project(id))['status']=='ACTIVE'

def test_immutable_revisions_and_limits(fixture):
    c,_=fixture;id=recruited(c);acting(ADDR[1]);c.submit_contribution(id,'Original')
    c.submit_contribution(id,'Revised')
    with pytest.raises(UserError):c.submit_contribution(id,'Third')
    packets=json.loads(c.get_project(id))['packets'][0]
    assert packets[0]['text']=='Original' and packets[1]['revision_of']=='0:1'

def test_unicode_bytes_rejected(fixture):
    c,_=fixture;id=recruited(c);acting(ADDR[1])
    with pytest.raises(UserError):c.submit_contribution(id,'🦄'*301)

def test_assembler_only_and_reference_authenticity(fixture):
    c,_=fixture;id=recruited(c)
    for a in ADDR[1:4]:acting(a);c.submit_contribution(id,'Text');c.finish_contributing(id)
    acting(ADDR[2]);
    with pytest.raises(UserError):c.submit_final_artifact(id,'Final','["0:1"]')
    acting(ADDR[1]);
    with pytest.raises(UserError):c.submit_final_artifact(id,'Final','["0:2"]')
    c.submit_final_artifact(id,'Final','["0:1"]')

def test_frozen_evidence_and_payout_split(fixture):
    c,_=fixture;id=fully_submitted(c);p=json.loads(c.get_project(id));assert len(p['evidence_digest'])==64
    c.evaluate_contributions(id)
    settled=json.loads(c.get_project(id))
    assert settled['amounts_wei']==['50','30','10'] and sum(x[1] for x in FAKE.transfers)==90
    assert c.active_escrow==0 and c.total_dispatched==90
    assert settled['settlement']=='EMITTED_UNVERIFIED'
    assert json.loads(c.get_profile(ADDR[1]))['points']==5
    with pytest.raises(UserError):c.evaluate_contributions(id)

def test_rounding_residue_highest_band(fixture):
    c,_=fixture
    assert c._allocate(100,[5,3,1])==[56,33,11]
    assert c._allocate(10,[5,5,1])==[6,4,0]

def test_forged_leader_weight_rejected(fixture):
    c,_=fixture;id=fully_submitted(c)
    outputs=[{'complete':True,'weights':[5,3,1],'evidence_ids':[['0:1'],['1:1'],['2:1']],'reason':'leader'},
             {'complete':True,'weights':[0,3,5],'evidence_ids':[[],['1:1'],['2:1']],'reason':'validator'}]
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(outputs.pop(0))
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status']=='FROZEN'

def test_validator_must_agree_on_evidence_attribution(fixture):
    c,_=fixture;id=fully_submitted(c)
    outputs=[
        {'complete':True,'weights':[5,3,1],'evidence_ids':[['0:1'],['1:1'],['2:1']],'reason':'leader'},
        {'complete':True,'weights':[5,3,1],'evidence_ids':[['0:1'],['1:1'],[]],'reason':'validator'},
    ]
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(outputs.pop(0))
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status']=='FROZEN'

def test_decision_with_uncontrolled_payment_fields_rejected(fixture):
    c,_=fixture;id=fully_submitted(c)
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps({
        'complete':True,'weights':[5,3,1],'evidence_ids':[['0:1'],['1:1'],['2:1']],
        'reason':'leader','amounts_wei':['90','0','0'],
    })
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers

def test_malformed_llm_output_fails_closed(fixture):
    c,_=fixture;id=fully_submitted(c)
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:'not-json'
    with pytest.raises(UserError, match=r'\[LLM_ERROR\]'):
        c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status']=='FROZEN'

def test_incomplete_report_refunds_sponsor(fixture):
    c,_=fixture;id=fully_submitted(c)
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps({'complete':False,'weights':[0,0,0], 'evidence_ids':[[],[],[]], 'reason':'Not completed'})
    c.evaluate_contributions(id)
    assert FAKE.transfers==[(ADDR[0],90)] and json.loads(c.get_project(id))['status']=='REFUND_EMITTED'

def test_missing_recruit_refund_after_deadline(fixture):
    c,clock=fixture;id=create(c)
    with pytest.raises(UserError):c.refund_unstarted_project(id)
    clock[0]+=172801;c.refund_unstarted_project(id)
    assert FAKE.transfers==[(ADDR[0],90)]
    with pytest.raises(UserError):c.refund_unstarted_project(id)

def test_timeout_fallback_and_freeze(fixture):
    c,clock=fixture;id=recruited(c);acting(ADDR[1]);c.submit_contribution(id,'Core research')
    clock[0]+=259201;c.advance_project(id)
    clock[0]+=86401;c.advance_project(id)
    p=json.loads(c.get_project(id));assert p['fallback_assembly'] and p['source_refs']==['0:1']
    clock[0]+=86401;c.freeze_project(id)
    assert json.loads(c.get_project(id))['status']=='FROZEN'

def test_invalid_result_is_never_paid(fixture):
    c,_=fixture;id=fully_submitted(c)
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps({'complete':True,'weights':[100,0,0],'evidence_ids':[['0:1'],[],[]],'reason':'fake'})
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers

def test_digest_integrity_detects_mutation(fixture):
    c,_=fixture;id=fully_submitted(c)
    p=json.loads(c.get_project(id));p['packets'][0][0]['text']='TAMPERED';c._save(id,p)
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers

def test_full_pool_per_project_without_cross_spend(fixture):
    c,_=fixture;one=fully_submitted(c);two=create(c,value=16)
    assert c.active_escrow==106
    c.evaluate_contributions(one)
    assert c.active_escrow==16 and json.loads(c.get_project(two))['pool_wei']=='16'

def test_project_list_page(fixture):
    c,_=fixture;create(c);create(c,20)
    assert len(json.loads(c.list_projects(1,2)))==2
    with pytest.raises(UserError):c.list_projects(1,21)
