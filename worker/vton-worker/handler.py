"""RunPod Serverless handler for the Suitora VTON worker.

Start: `python handler.py` (runpod.serverless.start handles queueing).
"""

import runpod  # type: ignore

from pipeline import generate_try_on


def handler(job: dict) -> dict:
    job_input = job.get("input", {})

    # NOTE: the RunPod SDK returns the handler's return value as the entire
    # job output, so this must be the flat result object (matching the README
    # contract `{image_url, provider, latency_ms}`) — not wrapped in {"output": …}.
    return generate_try_on(
        person_image_url=job_input["person_image_url"],
        garment_image_url=job_input["garment_image_url"],
        category=job_input.get("category", "upper_body"),
        text_prompt=job_input.get("text_prompt"),
        options=job_input.get("options"),
    )


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
