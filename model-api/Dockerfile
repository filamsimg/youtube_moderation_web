# Use an official lightweight Python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/hf_cache

# Set working directory inside the container
WORKDIR /app

# Install system dependencies if any (none needed for standard wheel installs)
# RUN apt-get update && apt-get install -y --no-install-recommends ... && rm -rf /var/lib/apt/lists/*

# Copy requirements and download helper first to optimize Docker layer caching
COPY requirements.txt download_models.py /app/

# Install PyTorch CPU-only version (saves ~2GB of CUDA binaries, crucial for CPU VPS)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the download script to pre-cache the Hugging Face models at build time
RUN python download_models.py

# Copy the rest of the application files (e.g. app.py)
# This is done AFTER downloading models so editing app.py doesn't re-download 1GB of model weights
COPY app.py /app/

# Expose the Flask port
EXPOSE 5000

# Run the Flask app directly
CMD ["python", "app.py"]
