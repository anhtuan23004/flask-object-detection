# Use Python slim base image (no CUDA)
FROM python:3.8-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    g++ \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements.txt and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY backend/ ./backend/
COPY static/ ./static/
COPY templates/ ./templates/

# Copy YOLOv8 model file
COPY models/yolov8n.pt /root/.cache/ultralytics/yolov8n.pt

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run the application with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]