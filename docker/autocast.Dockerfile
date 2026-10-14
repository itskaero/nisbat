# Keeps Nisbat on the Chromecast (scripts/autocast.py). Runs with host
# networking so Chromecast discovery (mDNS) works.
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir "pychromecast>=14,<15"
WORKDIR /app
COPY scripts/autocast.py ./autocast.py
USER nobody
CMD ["python", "autocast.py"]
