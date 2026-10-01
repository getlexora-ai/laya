# Laya decision model on CPU (Railway has no GPUs). English checkpoint only: ~1.8 GB RAM.
FROM python:3.12-slim
RUN pip install --no-cache-dir "laya[serve]" --extra-index-url https://download.pytorch.org/whl/cpu
ENV LAYA_DEVICE=cpu LAYA_MODELS=english LAYA_PRELOAD=1 LAYA_HOST=0.0.0.0
# Bake the weights into the image so a restart doesn't re-download them.
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('convaiinnovations/laya')"
# Railway injects PORT.
CMD LAYA_PORT=${PORT:-8000} laya-serve
