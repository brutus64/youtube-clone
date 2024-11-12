FROM python:3.8-slim

WORKDIR /app

# Install system dependencies required for building scikit-surprise
RUN apt-get update && \
    apt-get install -y \
    curl \
    gcc \
    g++ \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 5001
CMD ["python", "app.py"]