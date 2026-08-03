"""FastAPI alternative for the Suitora VTON worker.

Use this on an on-demand RunPod pod (always-on GPU) instead of Serverless:
    python app.py   # serves on :8000

HTTP contract (see worker/vton-worker/README.md):
    GET  /health → 200 {"status": "ok"}
    POST /tryon  → 200 {image_url, provider, latency_ms}
                → 400 on invalid payload / broken input images
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from starlette.responses import JSONResponse

from pipeline import generate_try_on

app = FastAPI(title="Suitora VTON Worker", version="0.1.0")


class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    category: str = "upper_body"
    text_prompt: Optional[str] = None
    options: Optional[dict[str, Any]] = None


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Malformed payloads → 400 (the documented Suitora-side contract)."""
    return JSONResponse(status_code=400, content={"error": "invalid request"})


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
    """Broken input images / bad categories → 400, not a 500."""
    return JSONResponse(status_code=400, content={"error": str(exc)})


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/tryon")
def tryon(req: TryOnRequest) -> dict:
    return generate_try_on(
        person_image_url=req.person_image_url,
        garment_image_url=req.garment_image_url,
        category=req.category,
        text_prompt=req.text_prompt,
        options=req.options,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
