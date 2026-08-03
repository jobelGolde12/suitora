"""
Smoke test for the VTON worker placeholder pipeline (no GPU/model needed).

Creates two tiny PNGs on disk, runs `generate_try_on` against them using
file:// URLs, and asserts the placeholder contract
(`image_url == garment url`, provider, latency). This validates the input
download/validation path end-to-end before the real model is wired in.

Usage: python smoke_test.py
"""

import base64
import os
import sys
import tempfile

# Add this directory to path so `pipeline` resolves.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline import generate_try_on  # noqa: E402

# Minimal 1x1 PNG
PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def main() -> int:
    tmp = tempfile.mkdtemp(prefix="vton_smoke_")
    person_path = os.path.join(tmp, "person.png")
    garment_path = os.path.join(tmp, "garment.png")
    for path in (person_path, garment_path):
        with open(path, "wb") as fh:
            fh.write(PNG_1PX)

    person_url = f"file://{person_path}"
    garment_url = f"file://{garment_path}"

    result = generate_try_on(
        person_image_url=person_url,
        garment_image_url=garment_url,
        category="upper_body",
    )

    assert result["image_url"] == garment_url, f"unexpected: {result}"
    assert result["provider"] == "vton-worker", f"unexpected: {result}"
    assert result["latency_ms"] >= 0, f"unexpected: {result}"

    print("smoke_test PASS:", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
