"""Host compatibility for genlayer-test Direct Mode on Windows.

genlayer-test 0.29.2 replaces fd 0 with a temporary file while importing the
contract. On Windows, the SDK keeps that descriptor open, so its immediate
unlink raises ``PermissionError`` before the contract can load. This shim only
defers that cleanup until the Direct Mode VM restores stdin; it does not mock
or alter contract execution.
"""

from __future__ import annotations

import os

if os.name == "nt":
    from gltest.direct import loader
    from gltest.direct.vm import VMContext

    _original_inject = loader._inject_message_to_fd0
    _original_cleanup = VMContext._cleanup_after_deactivate

    def _inject_with_deferred_windows_cleanup(vm):
        deferred: list[str] = []
        original_unlink = os.unlink

        def unlink(path, *args, **kwargs):
            try:
                original_unlink(path, *args, **kwargs)
            except PermissionError:
                deferred.append(os.fspath(path))

        os.unlink = unlink
        try:
            _original_inject(vm)
        finally:
            os.unlink = original_unlink
        paths = getattr(vm, "_direct_temp_paths", [])
        paths.extend(deferred)
        vm._direct_temp_paths = paths

    def _cleanup_with_deferred_windows_cleanup(vm):
        _original_cleanup(vm)
        for path in getattr(vm, "_direct_temp_paths", []):
            try:
                os.unlink(path)
            except FileNotFoundError:
                pass
        vm._direct_temp_paths = []

    loader._inject_message_to_fd0 = _inject_with_deferred_windows_cleanup
    VMContext._cleanup_after_deactivate = _cleanup_with_deferred_windows_cleanup

