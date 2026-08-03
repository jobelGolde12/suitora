"""
Fotor-style Virtual Try-On pipeline wrapper.

THE MODEL WIRING POINT. This module maps the Todo.md Fotor pipeline stages to
the chosen VTON model. Currently a stub: it validates inputs and returns the
garment image URL so the container can be smoke-tested end-to-end before the
real model is wired in.

Stages to implement (see docs/virtual_tryon_engine_plan.md §4):
  1. Pre-processing  : SCHP human parsing, DWPose/OpenPose pose, agnostic mask
  2. Garment warping : flow/attention-based alignment to the person pose
  3. Diffusion       : dual-UNet / DiT latent inpainting + cross-attention
  4. Post-processing : VAE decode, Poisson/alpha blending, optional 4K upscale
"""

from __future__ import annotations

import os
import tempfile
import time
import urllib.request
import uuid
from typing import Any, Optional


def _download(url: str) -> str:
    """Download a remote image to a unique temp file and return its path.

    Any fetch failure (DNS, 404, timeout, corrupt stream) surfaces as a
    ValueError so the HTTP layer can return 400 for bad client inputs.
    """
    ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
    path = os.path.join(tempfile.gettempdir(), f"vton_{uuid.uuid4().hex}{ext}")
    try:
        urllib.request.urlretrieve(url, path)
    except Exception as err:  # noqa: BLE001 — every fetch failure is a client error
        raise ValueError(f"could not fetch image: {url}") from err
    return path


def generate_try_on(
    person_image_url: str,
    garment_image_url: str,
    category: str = "upper_body",
    text_prompt: Optional[str] = None,
    options: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Run the try-on pipeline and return the output descriptor.

    Returns {"image_url": ..., "provider": ..., "latency_ms": ...}.
    """
    options = options or {}

    # Stage 0: pull inputs so any URL/broken-image failures surface early
    person_path = _download(person_image_url)
    garment_path = _download(garment_image_url)

    # Validate a person is actually present (cheap check, placeholder)
    if os.path.getsize(person_path) == 0:
        raise ValueError("person image could not be fetched")

    started = time.time()

    # ── TODO(Phase 1): implement stages 1-4 with the chosen model ──────────
    #   result_url = model.predict(person_path, garment_path, category, ...)
    #
    # Placeholder: mirror the Suitora mock behavior (return garment image URL)
    # so the container can be deployed and smoke-tested before the model lands.
    result_url = garment_image_url

    return {
        "image_url": result_url,
        "provider": "vton-worker",
        "latency_ms": int((time.time() - started) * 1000),
    }
