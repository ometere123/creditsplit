# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class DeploymentDiagnostic(gl.Contract):
    value: u256

    def __init__(self):
        self.value = u256(7)

    @gl.public.view
    def get_value(self) -> u256:
        return self.value
