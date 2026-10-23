"""GenLayer Testing Suite Direct Mode smoke/regression entry.

This suite is intentionally separate from the mocked offline harness.
It MUST run in the actual pinned genlayer-test environment before deployment.
"""
import json
import pytest

CONTRACT = "contracts/Creditsplit.py"


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
