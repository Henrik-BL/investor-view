FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY backend/_local_hcnb_stock_data /tmp/local_hcnb_stock_data
RUN echo "Installing local hcnb_stock_data if present" && \
    if [ -d /tmp/local_hcnb_stock_data ] && { [ -f /tmp/local_hcnb_stock_data/setup.py ] || [ -f /tmp/local_hcnb_stock_data/pyproject.toml ]; }; then \
        pip install --no-cache-dir -e /tmp/local_hcnb_stock_data; \
    fi

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=backend.app
ENV MONGODB_URI=mongodb://host.docker.internal:27017

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:app", "--workers", "4", "--threads", "2"]
