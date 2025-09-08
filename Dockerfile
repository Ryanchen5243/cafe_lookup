# Base image for AWS Lambda Python 3.11
FROM public.ecr.aws/lambda/python:3.11

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only what’s needed for inference
COPY src/data_collection.py ./src/
COPY src/ReviewClassifier.py ./src/
COPY models/ ./models/

# Add src/ to PYTHONPATH so imports work
ENV PYTHONPATH=/var/task/src

# Lambda handler entry point
CMD ["src.data_collection.lambda_handler"]
