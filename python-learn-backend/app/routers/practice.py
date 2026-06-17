from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import subprocess
import sys
from .. import auth, models

router = APIRouter(prefix="/practice", tags=["practice"])


class CodeRunRequest(BaseModel):
    code: str


# Hard server-side limits — NOT controllable by the client.
EXECUTION_TIMEOUT = 5          # seconds
MAX_OUTPUT_CHARS = 10_000      # cap stdout/stderr to protect memory


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    success: bool


@router.post("/run", response_model=CodeRunResponse)
def run_code(
    data: CodeRunRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Execute Python code in a subprocess and return stdout/stderr.
    Only students can run code (or teachers for testing).
    """
    try:
        result = subprocess.run(
            [sys.executable, "-I", "-c", data.code],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT,
            cwd=None,
        )

        return CodeRunResponse(
            stdout=result.stdout[:MAX_OUTPUT_CHARS],
            stderr=result.stderr[:MAX_OUTPUT_CHARS],
            exit_code=result.returncode,
            success=result.returncode == 0
        )
    except subprocess.TimeoutExpired:
        return CodeRunResponse(
            stdout="",
            stderr=f"Execution timed out after {EXECUTION_TIMEOUT} seconds",
            exit_code=-1,
            success=False
        )
    except Exception as e:
        return CodeRunResponse(
            stdout="",
            stderr=f"Error executing code: {str(e)}",
            exit_code=-1,
            success=False
        )