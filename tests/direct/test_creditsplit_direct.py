"""GenLayer Testing Suite Direct Mode smoke/regression entry.

This suite is intentionally separate from the mocked offline harness.
It MUST run in the actual pinned genlayer-test environment before deployment.
"""
import json
import hashlib
import pytest
from datetime import datetime, timezone

CONTRACT = "contracts/Creditsplit.py"


def _assessment(slot, effect, refs=None, relevance="direct", distinct=True,
                correctness=True, attribution_consistent=True):
    refs = [f"{slot}:1"] if refs is None and effect != "none" else (refs or [])
    return {
        "relevance": relevance if effect != "none" else "none",
        "distinct": distinct,
        "correctness": correctness,
        "material_effect": effect,
        "attribution_consistent": attribution_consistent,
        "evidence_ids": refs,
        "justification": f"Slot {slot} was assessed from the registered passage.",
    }


def _decision(effects=("foundational", "substantial", "supporting"), complete=True,
             refs=None, criteria_status=None):
    refs = refs or [["0:1"], ["1:1"], ["2:1"]]
    return {
        "complete": complete,
        "criteria_status": criteria_status or (["met", "met", "met"] if complete else ["not_met", "partial", "not_met"]),
        "assessments": [_assessment(slot, effects[slot], refs=refs[slot]) for slot in range(3)],
        "reason": "Frozen passages were assessed against the registered criteria.",
    }


def _decision_json(**kwargs):
    return json.dumps(_decision(**kwargs), separators=(",", ":"))


def _hex_address(address):
    return "0x" + bytes(address).hex()


def _create(contract, direct_vm, sponsor, contributors, value=90, assembler_slot=0):
    direct_vm.sender = sponsor
    direct_vm.value = value
    return contract.create_project(
        "Technical report",
        "Build a technical report from attributable evidence",
        *(_hex_address(address) for address in contributors),
        assembler_slot,
    )


def _join_all(contract, direct_vm, contributors, project_id):
    for address in contributors:
        direct_vm.sender = address
        direct_vm.value = 0
        contract.join_project(project_id)


def _warp_after(direct_vm, timestamp, seconds):
    direct_vm.warp(datetime.fromtimestamp(timestamp + seconds, timezone.utc).isoformat())


def _fully_frozen(contract, direct_vm, sponsor, contributors):
    project_id = _create(contract, direct_vm, sponsor, contributors)
    _join_all(contract, direct_vm, contributors, project_id)
    for index, address in enumerate(contributors):
        direct_vm.sender = address
        contract.submit_contribution(project_id, [
            "The threat model distinguishes replayed attestations from reentrancy and explains the exploitable state transition.",
            "Correction: the review must reject stale packet references and preserve the contributor slot from the signed wallet.",
            "The integration section turns the two technical passages into a concise, attributed remediation guide.",
        ][index])
        contract.finish_contributing(project_id)
    direct_vm.sender = contributors[0]
    contract.submit_final_artifact(
        project_id,
        "A complete remediation guide grounded in the threat model, the stale-reference correction and the integrated editorial passage.",
        '["0:1","1:1","2:1"]',
    )
    for address in contributors:
        direct_vm.sender = address
        contract.respond_attribution(project_id, "I confirm the frozen attribution.")
    direct_vm.sender = sponsor
    contract.freeze_project(project_id)
    return project_id


def test_deploy_clean_storage(direct_deploy):
    contract = direct_deploy(CONTRACT)
    assert int(contract.get_project_count()) == 0
    accounting = json.loads(contract.get_accounting())
    assert accounting["active_escrow_wei"] == "0"
    assert accounting["total_dispatched_wei"] == "0"


def test_nonexistent_project_cannot_join(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("project not found"):
        contract.join_project(1)


def test_invalid_title_precedes_escrow_deposit(direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    fourth = direct_accounts[4]
    with direct_vm.expect_revert("title length invalid"):
        contract.create_project("", "Brief", str(direct_bob), str(direct_charlie), str(fourth), 0)


def test_missing_project_not_refundable(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("project not found"):
        contract.refund_unstarted_project(1)


def test_invalid_page_size_rejected(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("page must contain 1-20 items"):
        contract.list_projects(1, 21)


def test_payable_creation_records_escrow_and_rejects_invalid_wallet(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _create(contract, direct_vm, direct_alice, contributors, value=123)
    assert int(contract.active_escrow) == 123
    project = json.loads(contract.get_project(project_id))
    assert project["pool_wei"] == "123"
    assert project["status"] == "RECRUITING"
    direct_vm.sender = direct_alice
    direct_vm.value = 123
    with direct_vm.expect_revert("invalid contributor address"):
        contract.create_project("Title", "Brief", "not-an-address", str(direct_charlie), str(direct_accounts[4]), 0)


def test_three_wallet_recruitment_and_wrong_wallet_submission(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _create(contract, direct_vm, direct_alice, contributors)
    direct_vm.sender = direct_accounts[5]
    with direct_vm.expect_revert("wallet is not invited"):
        contract.join_project(project_id)
    _join_all(contract, direct_vm, contributors, project_id)
    direct_vm.sender = direct_accounts[5]
    with direct_vm.expect_revert("wallet is not invited"):
        contract.submit_contribution(project_id, "forged packet")
    assert json.loads(contract.get_project(project_id))["status"] == "ACTIVE"


def test_direct_lifecycle_reconstructs_amounts_and_blocks_replay(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    decision = _decision_json()
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", decision)
    contract.evaluate_contributions(project_id)
    project = json.loads(contract.get_project(project_id))
    assert project["status"] == "SETTLEMENT_EMITTED"
    assert project["amounts_wei"] == ["50", "30", "10"]
    assert int(contract.active_escrow) == 0
    assert direct_vm._captured_validators
    forged = _decision()
    forged["assessments"][0]["evidence_ids"] = []
    assert direct_vm.run_validator(leader_result=forged) is False
    assert direct_vm.run_validator(leader_error=RuntimeError("validator timeout")) is False
    with direct_vm.expect_revert("frozen evidence required"):
        contract.evaluate_contributions(project_id)


def test_deadline_fallback_freezes_and_incomplete_judgment_refunds(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _create(contract, direct_vm, direct_alice, contributors, value=77)
    _join_all(contract, direct_vm, contributors, project_id)
    direct_vm.sender = direct_bob
    contract.submit_contribution(project_id, "Only one contributor delivered.")
    created_at = json.loads(contract.get_project(project_id))["created_at"]
    _warp_after(direct_vm, created_at, 259201)
    contract.advance_project(project_id)
    assembly_due = json.loads(contract.get_project(project_id))["assemble_due"]
    _warp_after(direct_vm, assembly_due, 1)
    contract.advance_project(project_id)
    project = json.loads(contract.get_project(project_id))
    assert project["fallback_assembly"] is True
    assert project["status"] == "REVIEW"
    review_due = json.loads(contract.get_project(project_id))["review_due"]
    _warp_after(direct_vm, review_due, 1)
    contract.freeze_project(project_id)
    direct_vm.mock_llm(
        r"EVIDENCE_DIGEST=.*",
        _decision_json(complete=False, effects=("none", "none", "none"), refs=[[], [], []]),
    )
    contract.evaluate_contributions(project_id)
    project = json.loads(contract.get_project(project_id))
    assert project["status"] == "REFUND_EMITTED"
    assert project["amounts_wei"] == ["0", "0", "0"]
    assert int(contract.active_escrow) == 0


def test_permissionless_recruitment_refund_after_deadline(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    project_id = _create(contract, direct_vm, direct_alice, [direct_bob, direct_charlie, direct_accounts[4]], value=41)
    recruit_due = json.loads(contract.get_project(project_id))["recruit_due"]
    _warp_after(direct_vm, recruit_due, 1)
    direct_vm.sender = direct_accounts[7]
    contract.refund_unstarted_project(project_id)
    project = json.loads(contract.get_project(project_id))
    assert project["status"] == "REFUND_EMITTED"
    assert int(contract.active_escrow) == 0


def test_direct_revision_bounds_and_utf8_limits(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _create(contract, direct_vm, direct_alice, contributors)
    _join_all(contract, direct_vm, contributors, project_id)
    direct_vm.sender = direct_bob
    contract.submit_contribution(project_id, "first immutable version")
    contract.submit_contribution(project_id, "second immutable version")
    with direct_vm.expect_revert("maximum two revisions"):
        contract.submit_contribution(project_id, "third version")
    with direct_vm.expect_revert("contribution length invalid"):
        contract.submit_contribution(project_id, "🦄" * 301)


def test_direct_digest_tampering_fails_closed(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    project = json.loads(contract.get_project(project_id))
    project["brief"] = "tampered after the evidence digest was recorded"
    contract.projects[project_id] = json.dumps(project, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    with direct_vm.expect_revert("evidence integrity failure"):
        contract.evaluate_contributions(project_id)


def test_direct_validator_rejects_a_different_substantive_answer(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    good = _decision_json()
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", good)
    contract.evaluate_contributions(project_id)
    direct_vm.clear_mocks()
    direct_vm.mock_llm(
        r"EVIDENCE_DIGEST=.*",
        _decision_json(effects=("none", "substantial", "foundational"), refs=[[], ["1:1"], ["2:1"]]),
    )
    assert direct_vm.run_validator(leader_result=json.loads(good)) is False


def test_direct_extra_payment_fields_cannot_control_settlement(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    direct_vm.mock_llm(
        r"EVIDENCE_DIGEST=.*",
        json.dumps({**_decision(), "amounts_wei": ["90", "0", "0"]}, separators=(",", ":")),
    )
    with direct_vm.expect_revert("invalid validator-agreed judgment"):
        contract.evaluate_contributions(project_id)
    assert json.loads(contract.get_project(project_id))["status"] == "FROZEN"


def test_direct_multiple_projects_keep_escrow_isolated(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    first = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    second = _create(contract, direct_vm, direct_alice, contributors, value=16)
    assert int(contract.active_escrow) == 106
    direct_vm.mock_llm(
        r"EVIDENCE_DIGEST=.*",
        _decision_json(),
    )
    contract.evaluate_contributions(first)
    assert int(contract.active_escrow) == 16
    assert json.loads(contract.get_project(second))["pool_wei"] == "16"


def test_direct_registered_correction_reference_and_fake_reference_rejection(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _create(contract, direct_vm, direct_alice, contributors)
    _join_all(contract, direct_vm, contributors, project_id)
    direct_vm.sender = direct_bob
    contract.submit_contribution(project_id, "The original passage identifies the replay failure mode.")
    direct_vm.sender = direct_charlie
    contract.submit_contribution_with_references(
        project_id,
        "This correction explains why the replay check must bind the signed packet slot.",
        '["0:1"]',
    )
    project = json.loads(contract.get_project(project_id))
    assert project["packets"][1][0]["references"] == ["0:1"]
    direct_vm.sender = direct_accounts[4]
    with direct_vm.expect_revert("unregistered packet reference"):
        contract.submit_contribution_with_references(project_id, "Fabricated evidence.", '["9:9"]')


def test_direct_benign_validator_reference_selection_does_not_disagree(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    good = _decision()
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", _decision_json())
    contract.evaluate_contributions(project_id)
    direct_vm.clear_mocks()
    independent = _decision(refs=[["0:1", "1:1"], ["1:1", "0:1"], ["2:1"]])
    independent["reason"] = "Different explanation, same independently justified bands."
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", json.dumps(independent, separators=(",", ":")))
    assert direct_vm.run_validator(leader_result=good) is True


def test_direct_duplicate_substantive_passages_are_rejected(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    contributors = [direct_bob, direct_charlie, direct_accounts[4]]
    project_id = _fully_frozen(contract, direct_vm, direct_alice, contributors)
    project = json.loads(contract.get_project(project_id))
    project["packets"][1][0]["text"] = project["packets"][0][0]["text"]
    contract.projects[project_id] = json.dumps(project, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    project["evidence_digest"] = hashlib.sha256(contract._evidence(project).encode("utf-8")).hexdigest()
    contract.projects[project_id] = json.dumps(project, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", _decision_json())
    with direct_vm.expect_revert("invalid validator-agreed judgment"):
        contract.evaluate_contributions(project_id)


def test_direct_custom_acceptance_criteria_are_immutable_project_evidence(
    direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = 33
    project_id = contract.create_project_with_criteria(
        "Correction brief",
        "Produce a bounded security correction note.",
        '["Identify the defect.","Give a reproducible correction.","Integrate and attribute the result."]',
        _hex_address(direct_bob), _hex_address(direct_charlie), _hex_address(direct_accounts[4]), 0,
    )
    project = json.loads(contract.get_project(project_id))
    assert project["criteria"] == ["Identify the defect.", "Give a reproducible correction.", "Integrate and attribute the result."]
