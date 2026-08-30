# Express Backend Dockerfile for Development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create cache and uploads directories
RUN mkdir -p cache uploads

# Expose port
EXPOSE 3000

# Start the application in dev mode with hot-reload
CMD ["npm", "run", "dev"]
