# Suitora VTON Worker (RunPod)

Model-agnostic GPU container that implements the Fotor-style try-on pipeline
(pre-processing → garment warping → diffusion → post-processing) and exposes it
as an HTTP service consumed by the Suitora app.

> ⚠️ **Licensing gate** — see `docs/vton_licensing_research.md`. The open VTON
> models (IDM-VTON, CatVTON) are non-commercial. Wire the model of your choice
> into `pipeline.py`; the HTTP contract below is model-agnostic.

## Structure

```
worker/vton-worker/
├── Dockerfile          # CUDA PyTorch base image
├── requirements.txt
├── handler.py          # RunPod Serverless handler (recommended)
├── app.py              # FastAPI alternative (on-demand pod)
├── pipeline.py         # Fotor pipeline wrapper — THE model wiring goes here
├── contract_test.py    # HTTP contract smoke tests (health, 400s, valid 200)
└── README.md
```

## Tests (contract smoke tests)

```bash
pip install -r requirements.txt
python smoke_test.py       # pipeline unit check (no server)
python contract_test.py    # HTTP contract: health, invalid → 400, valid → 200
```

## API contract (Suitora side)

```jsonc
POST /tryon            // FastAPI mode, or runpod handler job input
{
  "person_image_url": "https://…",
  "garment_image_url": "https://…",
  "category": "upper_body",          // upper_body | lower_body | dresses
  "text_prompt": "optional",
  "options": { "width": 768, "height": 1024, "steps": 30, "seed": 42 }
}
// 200 →
{ "image_url": "https://…", "provider": "vton-worker", "latency_ms": 42000 }
```

## Build & run locally (CPU smoke test — pipeline is a stub)

```bash
docker build -t suitora-vton-worker ./worker/vton-worker
docker run --rm -p 8000:8000 suitora-vton-worker python app.py
curl -X POST localhost:8000/tryon -H 'content-type: application/json' \
  -d '{"person_image_url":"https://example.com/person.jpg","garment_image_url":"https://example.com/shirt.jpg","category":"upper_body"}'
```

## Deploy to RunPod Serverless

1. Push the image to a registry (Docker Hub / GHCR).
2. RunPod Console → Serverless → Create Endpoint:
   - Template image = your pushed image, `handler.py` runs via `runpod.serverless.start`.
   - GPU: RTX 4090 (24 GB) for IDM-VTON/CatVTON; L40S if batching/4K upscale.
   - Max workers per your queue volume; `min_workers=0` to save cost (accept 15–60 s cold starts).
3. Suitora calls:
   - `POST https://api.runpod.ai/v2/{endpointId}/runs` (Bearer key) to submit.
   - `GET  https://api.runpod.ai/v2/{endpointId}/status/{runId}` to poll.
   - Optional `webhook` field in the submit payload for completion callbacks.

See `docs/virtual_tryon_engine_plan.md` §6 for the full RunPod contract and cost math.
