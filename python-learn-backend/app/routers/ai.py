from fastapi import APIRouter, Depends, HTTPException
import asyncio
import httpx
import logging

from app import schemas, auth, models
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]
MAX_RETRIES = 2
RETRY_DELAY = 1.0
_cached_model_name = None


def _build_prompt(task_description: str, student_code: str, question: str | None) -> str:
    q = (question or "").strip()

    # If student asked a specific question, answer it directly (still in guidance mode).
    if q:
        return f"""You are an AI Python mentor for a beginner/intermediate student.

Answer the student's specific question directly and clearly.

Rules:
1) Focus on the exact question the student asked.
2) Use the task description and current code for context.
3) Do NOT provide a full ready-to-submit solution.
4) Small examples are allowed only if necessary.
5) Reply in the same language as the student's question.

Task description:
{task_description}

Student code:
```python
{student_code}
```

Student question:
{q}

Give a concise practical answer (3-7 lines)."""

    return f"""You are an AI Python mentor for a beginner/intermediate student in an adaptive learning platform.

Your main goal is to evaluate whether the student understood the TASK REQUIREMENT (not only code syntax), then give concise coaching feedback.

Rules:
1) First understand the task intent from the task description.
2) Analyze the student's code against task intent, expected behavior, edge cases, and Python best practices.
3) Never provide a full ready-to-submit solution.
4) Do not write full final code blocks. Small illustrative snippets (1-3 lines) are allowed only if essential.
5) Keep feedback practical and actionable for this exact attempt.
6) Reply in the same language as the student's question. If language is unclear, use Russian.

Task description:
{task_description}

Student code:
```python
{student_code}
```

Return response in this exact structure:
1. Task understanding: one sentence describing what must be implemented.
2. What is good: 1 short bullet about what student did correctly.
3. What to fix now: 1-2 short bullets with the most important issues, and add one light logical hint (where to start / first step).
4. Next step hint: one concrete next action the student should do now (without full solution).

Keep total response short: about 4-8 lines."""


async def _pick_gemini_model(client, refresh=False):
    global _cached_model_name

    if _cached_model_name and not refresh:
        return _cached_model_name

    resp = await client.get(f"{GEMINI_API_BASE}/models?key={settings.GEMINI_API_KEY}")
    if resp.status_code != 200:
        logger.error(f"Failed to list models: {resp.status_code}")
        raise HTTPException(status_code=502, detail="Cannot connect to AI service.")

    models_list = resp.json().get("models", [])

    # Collect models that support generateContent
    available = []
    for m in models_list:
        methods = m.get("supportedGenerationMethods") or []
        if "generateContent" in methods:
            name = m.get("name", "").replace("models/", "")
            if name:
                available.append(name)

    if not available:
        raise HTTPException(status_code=502, detail="No AI models available for this API key.")

    # Try preferred models in order
    for preferred in PREFERRED_MODELS:
        if preferred in available:
            _cached_model_name = preferred
            logger.info(f"Using model: {_cached_model_name}")
            return _cached_model_name

    # Fallback: use any flash model
    for m in available:
        if "flash" in m:
            _cached_model_name = m
            logger.info(f"Using fallback model: {_cached_model_name}")
            return _cached_model_name

    _cached_model_name = available[0]
    logger.info(f"Using first available model: {_cached_model_name}")
    return _cached_model_name


async def call_gemini(prompt: str) -> str:
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not configured")
        return "AI feedback is not configured. Please add GEMINI_API_KEY to .env"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    attempt = 0
    while attempt <= MAX_RETRIES:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                model_name = await _pick_gemini_model(client)
                resp = await client.post(
                    f"{GEMINI_API_BASE}/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}",
                    json=payload,
                )

            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text

            # Model not found — refresh model list and retry
            if resp.status_code == 404 and attempt < MAX_RETRIES:
                logger.warning(f"Model {model_name} not found, refreshing...")
                async with httpx.AsyncClient(timeout=30) as c:
                    await _pick_gemini_model(c, refresh=True)
                await asyncio.sleep(RETRY_DELAY)
                attempt += 1
                continue

            # Temporary errors — retry
            if resp.status_code in (503, 429) and attempt < MAX_RETRIES:
                logger.warning(f"Gemini returned {resp.status_code}, retrying...")
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                attempt += 1
                continue

            logger.error(f"Gemini API error {resp.status_code}: {resp.text}")
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable. Please try again.")

        except httpx.TimeoutException:
            logger.warning(f"Gemini timeout on attempt {attempt + 1}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                attempt += 1
                continue
            raise HTTPException(status_code=504, detail="AI service timeout. Please try again.")
        except httpx.RequestError as e:
            logger.error(f"Gemini request error: {e}")
            raise HTTPException(status_code=502, detail="AI service connection error.")

    raise HTTPException(status_code=502, detail="AI service failed after retries.")


@router.post("/feedback", response_model=schemas.AIFeedbackResponse)
async def get_feedback(
    data: schemas.AIFeedbackRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    prompt = _build_prompt(data.task_description, data.student_code, data.question)
    feedback_text = await call_gemini(prompt)
    return schemas.AIFeedbackResponse(feedback=feedback_text, hint_type="hint")
