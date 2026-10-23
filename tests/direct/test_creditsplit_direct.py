"""GenLayer Testing Suite Direct Mode smoke/regression entry.

This suite is intentionally separate from the mocked offline harness.
It MUST run in the actual pinned genlayer-test environment before deployment.
"""
import json
import pytest
from datetime import datetime, timezone

CONTRACT = "contracts/Creditsplit.py"


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
            "Foundational research",
            "Independent correctness review",
            "Editing and synthesis",
        ][index])
        contract.finish_contributing(project_id)
    direct_vm.sender = contributors[0]
    contract.submit_final_artifact(
        project_id,
        "A complete technical report grounded in the submitted packets.",
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
    decision = '{"complete":true,"weights":[5,3,1],"evidence_ids":[["0:1"],["1:1"],["2:1"]],"reason":"Evidence supports the completed report."}'
    direct_vm.mock_llm(r"EVIDENCE_DIGEST=.*", decision)
    contract.evaluate_contributions(project_id)
    project = json.loads(contract.get_project(project_id))
    assert project["status"] == "SETTLEMENT_EMITTED"
    assert project["amounts_wei"] == ["50", "30", "10"]
    assert int(contract.active_escrow) == 0
    assert direct_vm._captured_validators
    assert direct_vm.run_validator(leader_result={"complete": True, "weights": [5, 3, 1], "evidence_ids": [[], [], []], "reason": "forged"}) is False
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
        '{"complete":false,"weights":[0,0,0],"evidence_ids":[[],[],[]],"reason":"The deliverable is incomplete."}',
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
