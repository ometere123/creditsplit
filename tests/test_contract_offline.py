"""Offline state-machine and adversarial leader harness; NOT a substitute for GenVM Direct Mode."""
import importlib.util
import hashlib
import json
import sys
import types
import pytest
from pathlib import Path

ADDR = ['0x'+str(i)*40 for i in range(1,6)]
SOURCE_URL = 'https://raw.githubusercontent.com/ometere123/creditsplit/' + 'a'*40 + '/docs/CONSENSUS.md'
SOURCE_BODY = b'GenLayer consensus validates registered work against a frozen reference.'
SOURCE_DIGEST = hashlib.sha256(SOURCE_BODY).hexdigest()
ANCHORS = {
    '0:1': 'threat model separates replayed attestations',
    '1:1': 'packet references must bind to the signed contributor slot',
    '1:2': 'deterministic packet-specific duplicate rule',
    '2:1': 'editorial passage integrates the threat model',
}


def _assessment(slot, effect, refs=None, relevance="direct", distinct=True,
                correctness=True, attribution_consistent=True, factual_status="not_applicable",
                justification=None, anchors=None):
    refs = [f"{slot}:1"] if refs is None and effect != "none" else (refs or [])
    anchors = ([ANCHORS[ref] for ref in refs] if anchors is None else anchors)
    return {
        "relevance": relevance if effect != "none" else "none",
        "distinct": distinct,
        "correctness": correctness,
        "material_effect": effect,
        "factual_status": factual_status,
        "attribution_consistent": attribution_consistent,
        "evidence_ids": refs,
        "evidence_anchors": anchors,
        "justification": justification or f"Registered passage for slot {slot} was assessed from its text.",
    }


def _decision(effects=("foundational", "substantial", "supporting"), complete=True,
             refs=None, criteria_status=None):
    refs = refs or [["0:1"], ["1:1"], ["2:1"]]
    return {
        "complete": complete,
        "criteria_status": criteria_status or (["met", "met", "met"] if complete else ["not_met", "partial", "not_met"]),
        "source_status": "not_used",
        "source_digest": "",
        "assessments": [_assessment(slot, effects[slot], refs=refs[slot]) for slot in range(3)],
        "reason": "The frozen passages and final artifact were assessed against the registered criteria.",
    }

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

class FakeWeb:
    def get(self, url):
        if FAKE.web_body is None:
            raise RuntimeError('source unavailable')
        return types.SimpleNamespace(status=FAKE.web_status, body=FAKE.web_body)


FAKE = types.SimpleNamespace(
    Contract=object,
    vm=types.SimpleNamespace(UserError=UserError,Return=Return),
    message=types.SimpleNamespace(sender_address=ADDR[0],value=0),
    public=types.SimpleNamespace(write=FakeWrite(),view=lambda method:method),
    evm=types.SimpleNamespace(contract_interface=lambda cls:cls),
    nondet=types.SimpleNamespace(exec_prompt=lambda prompt, **kwargs: '{}', web=FakeWeb()),
    transfers=[],
    web_status=200,
    web_body=None,
)

def load_contract():
    global FAKE
    FAKE.transfers.clear();FAKE.message.sender_address=ADDR[0];FAKE.message.value=0
    FAKE.web_status=200;FAKE.web_body=None
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
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(_decision())
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


def create_verified(chain, value=90):
    acting(ADDR[0], value)
    return chain.create_project_with_verified_source(
        'Verified technical report', 'Build a report against a frozen public reference.',
        '["State the verified fact.","Provide an attributable correction.","Integrate the supported result."]',
        SOURCE_URL, SOURCE_DIGEST, ADDR[1], ADDR[2], ADDR[3], 0,
    )

def recruited(chain):
    id=create(chain)
    for a in ADDR[1:4]:acting(a);chain.join_project(id)
    return id

def fully_submitted(chain):
    id=recruited(chain)
    for i,a in enumerate(ADDR[1:4]):
        acting(a);chain.submit_contribution(id,[
            'The threat model separates replayed attestations from reentrancy and identifies the vulnerable state transition.',
            'Correction: packet references must bind to the signed contributor slot and reject stale evidence.',
            'The editorial passage integrates the threat model and correction into an attributed remediation note.',
        ][i]);chain.finish_contributing(id)
    acting(ADDR[1]);chain.submit_final_artifact(id,'A complete remediation note grounded in the threat model, correction and integrated editorial passage.','["0:1","1:1","2:1"]')
    for a in ADDR[1:4]:acting(a);chain.respond_attribution(id,'')
    acting(ADDR[0]);chain.freeze_project(id)
    return id


def fully_submitted_verified(chain):
    id = create_verified(chain)
    for a in ADDR[1:4]:
        acting(a); chain.join_project(id)
    for i, a in enumerate(ADDR[1:4]):
        acting(a); chain.submit_contribution(id, [
            'The threat model separates replayed attestations from reentrancy and identifies the vulnerable state transition.',
            'Correction: packet references must bind to the signed contributor slot and reject stale evidence.',
            'The editorial passage integrates the threat model and correction into an attributed remediation note.',
        ][i]); chain.finish_contributing(id)
    acting(ADDR[1]); chain.submit_final_artifact(
        id,
        'A complete remediation note grounded in the verified fact, correction and integrated editorial passage.',
        '["0:1","1:1","2:1"]',
    )
    for a in ADDR[1:4]: acting(a); chain.respond_attribution(id, '')
    acting(ADDR[0]); chain.freeze_project(id)
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


def test_criteria_and_cross_contributor_reference_are_registered(fixture):
    c, _ = fixture
    id = recruited(c)
    acting(ADDR[1]); c.submit_contribution(id, 'Bridge threat model with concrete attack paths.')
    acting(ADDR[2]); c.submit_contribution_with_references(
        id, 'Correction: the threat model must separate replay from reentrancy.', '["0:1"]'
    )
    project = json.loads(c.get_project(id))
    assert len(project['criteria']) == 3
    assert project['packets'][1][0]['references'] == ['0:1']
    acting(ADDR[3])
    with pytest.raises(UserError):
        c.submit_contribution_with_references(id, 'Fabricated source link.', '["9:9"]')

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
    outputs=[_decision(), _decision(effects=('none', 'substantial', 'foundational'), refs=[[], ['1:1'], ['2:1']])]
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(outputs.pop(0))
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status']=='FROZEN'

def test_validator_must_agree_on_evidence_attribution(fixture):
    c,_=fixture;id=fully_submitted(c)
    outputs=[_decision(), _decision(refs=[['0:1'], ['1:1'], ['0:1']])]
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(outputs.pop(0))
    with pytest.raises(UserError):c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status']=='FROZEN'


def test_benign_explanation_and_reference_differences_are_allowed(fixture):
    c, _ = fixture; id = fully_submitted(c)
    leader = _decision()
    validator = _decision(refs=[['0:1', '1:1'], ['1:1', '0:1'], ['2:1']])
    validator['reason'] = 'An independently worded explanation reaches the same classifications.'
    outputs = [leader, validator]
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(outputs.pop(0))
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['weights'] == [5, 3, 1]


def test_later_exact_duplicate_is_capped_without_denial_of_settlement(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['packets'][1][0]['text'] = project['packets'][0][0]['text']
    c._save(id, project)
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    duplicate_decision = _decision()
    duplicate_decision['assessments'][1]['evidence_anchors'] = [ANCHORS['0:1']]
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(duplicate_decision)
    c.evaluate_contributions(id)
    settled = json.loads(c.get_project(id))
    assert settled['status'] == 'SETTLEMENT_EMITTED'
    assert settled['weights'] == [5, 1, 1]
    assert sum(int(amount) for amount in settled['amounts_wei']) == 90
    assert FAKE.transfers and FAKE.transfers[0][0] == ADDR[1]


def test_duplicate_penalty_is_specific_to_the_supporting_packet(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['packets'][1][0]['text'] = project['packets'][0][0]['text']
    project['packets'][1].append({
        'id': '1:2',
        'text': 'Original correction adds a deterministic packet-specific duplicate rule.',
        'at': 1700000000,
        'revision_of': '1:1',
        'references': ['0:1'],
        'sequence': 4,
    })
    c._save(id, project)
    project = json.loads(c.get_project(id))
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    decision = _decision(effects=('foundational', 'foundational', 'supporting'), refs=[['0:1'], ['1:2'], ['2:1']])
    decision['assessments'][1]['evidence_anchors'] = ['deterministic packet-specific duplicate rule']
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['weights'] == [5, 5, 1]


def test_duplicate_cannot_be_hidden_by_citing_a_clean_packet(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['packets'][1][0]['text'] = project['packets'][0][0]['text']
    project['packets'][1].append({
        'id': '1:2',
        'text': 'Original correction adds a deterministic packet-specific duplicate rule.',
        'at': 1700000000,
        'revision_of': '1:1',
        'references': ['0:1'],
        'sequence': 4,
    })
    c._save(id, project)
    project = json.loads(c.get_project(id))
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    decision = _decision(effects=('foundational', 'foundational', 'supporting'), refs=[['0:1'], ['1:1', '1:2'], ['2:1']])
    decision['assessments'][1]['evidence_anchors'] = [ANCHORS['0:1'], 'deterministic packet-specific duplicate rule']
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['weights'] == [5, 1, 1]


def test_assembler_omission_is_not_an_economic_veto(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['source_refs'] = ['0:1', '2:1']
    c._save(id, project)
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    c.evaluate_contributions(id)
    settled = json.loads(c.get_project(id))
    assert settled['weights'] == [5, 3, 1]
    assert settled['amounts_wei'] == ['50', '30', '10']


def test_substantial_paraphrase_and_shared_terms_are_not_exact_duplicates(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['packets'][1][0]['text'] = 'The threat model separates replayed attestations from reentrancy and maps the exploitable transition.'
    c._save(id, project)
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    paraphrase = _decision()
    paraphrase['assessments'][1]['evidence_anchors'] = ['threat model separates replayed attestations']
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(paraphrase)
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['weights'] == [5, 3, 1]


def test_trivial_anchor_cannot_support_positive_merit(fixture):
    c, _ = fixture; id = fully_submitted(c)
    forged = _decision()
    forged['assessments'][0]['evidence_anchors'] = ['The']
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(forged)
    with pytest.raises(UserError):
        c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['status'] == 'FROZEN'


def test_failed_completion_keeps_informational_merit_but_refunds(fixture):
    c, _ = fixture; id = fully_submitted(c)
    decision = _decision(
        complete=False,
        effects=('foundational', 'substantial', 'none'),
        refs=[['0:1'], ['1:1'], []],
        criteria_status=['met', 'partial', 'not_met'],
    )
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    c.evaluate_contributions(id)
    settled = json.loads(c.get_project(id))
    assert settled['status'] == 'REFUND_EMITTED'
    assert settled['weights'] == [0, 0, 0]
    assert settled['amounts_wei'] == ['0', '0', '0']
    assert settled['decision']['informational_weights'] == [5, 3, 0]
    assert FAKE.transfers == [(ADDR[0], 90)]


def test_irrelevant_omitted_packet_does_not_gain_credit(fixture):
    c, _ = fixture; id = fully_submitted(c)
    project = json.loads(c.get_project(id))
    project['source_refs'] = ['0:1', '2:1']
    c._save(id, project)
    project['evidence_digest'] = hashlib.sha256(c._evidence(project).encode('utf-8')).hexdigest()
    c._save(id, project)
    decision = _decision(effects=('foundational', 'none', 'supporting'), refs=[['0:1'], [], ['2:1']])
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['weights'] == [5, 0, 1]


def test_contradictory_complete_flag_is_rejected(fixture):
    c, _ = fixture; id = fully_submitted(c)
    contradictory = _decision(complete=False, criteria_status=['met', 'met', 'met'])
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(contradictory)
    with pytest.raises(UserError):
        c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['status'] == 'FROZEN'


def test_inconclusive_consensus_is_retryable_without_state_change(fixture):
    c, _ = fixture; id = fully_submitted(c)
    before = json.loads(c.get_project(id))
    original = FAKE.vm.run_nondet_unsafe
    FAKE.vm.run_nondet_unsafe = lambda leader, validator: (_ for _ in ()).throw(UserError('consensus unavailable'))
    with pytest.raises(UserError, match='consensus unavailable'):
        c.evaluate_contributions(id)
    after_failure = json.loads(c.get_project(id))
    assert after_failure['status'] == 'FROZEN'
    assert after_failure['evidence_digest'] == before['evidence_digest']
    assert c.active_escrow == 90 and not FAKE.transfers
    FAKE.vm.run_nondet_unsafe = original
    c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['status'] == 'SETTLEMENT_EMITTED'


def test_exact_packet_anchor_is_required_for_positive_merit(fixture):
    c, _ = fixture; id = fully_submitted(c)
    forged = _decision()
    forged['assessments'][0]['evidence_anchors'] = ['not in packet']
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(forged)
    with pytest.raises(UserError):
        c.evaluate_contributions(id)
    assert json.loads(c.get_project(id))['status'] == 'FROZEN'


def test_materiality_flags_are_payment_controlling_not_leader_weights(fixture):
    c, _ = fixture; id = fully_submitted(c)
    decision = _decision(effects=('foundational', 'substantial', 'supporting'))
    decision['assessments'][1]['material_effect'] = 'foundational'
    validator = _decision(effects=('foundational', 'substantial', 'supporting'))
    outputs = [decision, validator]
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(outputs.pop(0))
    with pytest.raises(UserError):
        c.evaluate_contributions(id)
    assert not FAKE.transfers and json.loads(c.get_project(id))['status'] == 'FROZEN'


def test_custom_criteria_and_invalid_reference_fail_closed(fixture):
    c, _ = fixture
    acting(ADDR[0], 20)
    with pytest.raises(UserError):
        c.create_project_with_criteria('Title', 'Brief', '["one", "two"]', ADDR[1], ADDR[2], ADDR[3], 0)
    project_id = c.create_project_with_criteria(
        'Technical report', 'Assess the actual authored passages.',
        '["Address the threat model.","Include a reproducible correction.","Integrate and attribute the final text."]',
        ADDR[1], ADDR[2], ADDR[3], 0,
    )
    for address in ADDR[1:4]:
        acting(address); c.join_project(project_id)
    acting(ADDR[1])
    with pytest.raises(UserError):
        c.submit_contribution_with_references(project_id, 'Correction text', '["1:1"]')

def test_decision_with_uncontrolled_payment_fields_rejected(fixture):
    c,_=fixture;id=fully_submitted(c)
    forged = _decision()
    forged['amounts_wei'] = ['90', '0', '0']
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(forged)
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
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(_decision(complete=False, effects=('none', 'none', 'none'), refs=[[], [], []]))
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
    forged = _decision()
    forged['assessments'][0]['material_effect'] = 'bogus'
    FAKE.nondet.exec_prompt=lambda prompt, **kwargs:json.dumps(forged)
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


def test_verified_source_requires_commit_pinned_url_and_digest(fixture):
    c, _ = fixture
    acting(ADDR[0], 20)
    with pytest.raises(UserError):
        c.create_project_with_verified_source(
            'Title', 'Brief', '["one","two","three"]',
            'https://example.com/reference.md', SOURCE_DIGEST,
            ADDR[1], ADDR[2], ADDR[3], 0,
        )
    with pytest.raises(UserError):
        c.create_project_with_verified_source(
            'Title', 'Brief', '["one","two","three"]',
            SOURCE_URL, '0' * 63,
            ADDR[1], ADDR[2], ADDR[3], 0,
        )


def test_verified_source_is_fetched_by_the_assessment_and_recorded(fixture):
    c, _ = fixture
    FAKE.web_body = SOURCE_BODY
    project_id = fully_submitted_verified(c)
    decision = _decision()
    decision['source_status'] = 'verified'
    decision['source_digest'] = SOURCE_DIGEST
    for assessment in decision['assessments']:
        assessment['factual_status'] = 'supported'
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    c.evaluate_contributions(project_id)
    project = json.loads(c.get_project(project_id))
    assert project['verified_source_status'] == 'VERIFIED'
    assert project['decision']['source_status'] == 'verified'
    assert project['decision']['source_digest'] == SOURCE_DIGEST
    assert project['weights'] == [5, 3, 1]


def test_verified_source_substitution_or_unavailability_fails_closed(fixture):
    c, _ = fixture
    project_id = fully_submitted_verified(c)
    FAKE.web_body = b'substituted reference'
    with pytest.raises(UserError, match=r'\[EXTERNAL\]'):
        c.evaluate_contributions(project_id)
    project = json.loads(c.get_project(project_id))
    assert project['status'] == 'FROZEN' and c.active_escrow == 90 and not FAKE.transfers


def test_verified_source_contradicted_high_credit_cannot_settle(fixture):
    c, _ = fixture
    FAKE.web_body = SOURCE_BODY
    project_id = fully_submitted_verified(c)
    decision = _decision()
    decision['source_status'] = 'verified'
    decision['source_digest'] = SOURCE_DIGEST
    decision['assessments'][0]['factual_status'] = 'contradicted'
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    with pytest.raises(UserError):
        c.evaluate_contributions(project_id)
    assert json.loads(c.get_project(project_id))['status'] == 'FROZEN'


def test_closed_evidence_cannot_claim_external_support_without_reference(fixture):
    c, _ = fixture
    project_id = fully_submitted(c)
    decision = _decision()
    decision['assessments'][0]['factual_status'] = 'supported'
    FAKE.nondet.exec_prompt = lambda prompt, **kwargs: json.dumps(decision)
    with pytest.raises(UserError):
        c.evaluate_contributions(project_id)
    assert json.loads(c.get_project(project_id))['status'] == 'FROZEN'
