# Suitora VTON Worker — CUDA image for diffusion-based virtual try-on.
# Base: official PyTorch CUDA image (swap version to match the chosen model).
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# System deps for OpenCV / onnxruntime / image ops
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# RunPod serverless default entrypoint
CMD ["python", "-u", "handler.py"]
