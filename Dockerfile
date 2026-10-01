# Laya decision model on CPU (Railway has no GPUs). English checkpoint only: ~1.8 GB RAM.
FROM python:3.12-slim
RUN pip install --no-cache-dir "laya[serve]" --extra-index-url https://download.pytorch.org/whl/cpu
ENV LAYA_DEVICE=cpu LAYA_MODELS=english LAYA_PRELOAD=1
# Bake the weights into the image so a restart doesn't re-download them.
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('convaiinnovations/laya')"
WORKDIR /app
COPY server.py index.html cases.json ./
# laya-serve's API plus the playground page at /. Railway injects PORT.
CMD ["python", "server.py"]
