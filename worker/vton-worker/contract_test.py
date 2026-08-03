"""
Contract tests for the Suitora VTON worker HTTP service.

Exercises the documented Suitora-side contract (worker/vton-worker/README.md)
against the FastAPI app in-process:
    - GET /health  → 200
    - POST /tryon  invalid payload → 400
    - POST /tryon  valid file:// inputs → 200 with {image_url, provider, latency_ms}

Usage: pip install fastapi httpx  (requirements.txt includes both)
       python contract_test.py
"""

import base64
import os
import sys
import tempfile

# Add this directory to path so `pipeline` and `app` resolve.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

from app import app  # noqa: E402

# Minimal 1x1 PNG
PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def _write_png(tmp: str, name: str) -> str:
    path = os.path.join(tmp, name)
    with open(path, "wb") as fh:
        fh.write(PNG_1PX)
    return f"file://{path}"


def main() -> int:
    tmp = tempfile.mkdtemp(prefix="vton_contract_")
    person_url = _write_png(tmp, "person.png")
    garment_url = _write_png(tmp, "garment.png")

    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, res.text
    assert res.json() == {"status": "ok"}, res.text

    # 2. Invalid payload → 400
    res = client.post("/tryon", json={})
    assert res.status_code == 400, f"expected 400, got {res.status_code}: {res.text}"

    res = client.post("/tryon", json={"person_image_url": person_url})
    assert res.status_code == 400, f"expected 400, got {res.status_code}: {res.text}"

    # 3. Broken input image → 400 (not a 500)
    res = client.post(
        "/tryon",
        json={
            "person_image_url": "https://example.com/does-not-exist.jpg",
            "garment_image_url": garment_url,
        },
    )
    assert res.status_code == 400, f"expected 400, got {res.status_code}: {res.text}"

    # 4. Valid inputs → 200 with the output contract
    res = client.post(
        "/tryon",
        json={
            "person_image_url": person_url,
            "garment_image_url": garment_url,
            "category": "upper_body",
        },
    )
    assert res.status_code == 200, f"expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["image_url"] == garment_url, body
    assert body["provider"] == "vton-worker", body
    assert body["latency_ms"] >= 0, body

    print("contract_test PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
