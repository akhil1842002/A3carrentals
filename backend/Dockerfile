# Production Dockerfile for Google Cloud Run
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose default port (Cloud Run sets PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
