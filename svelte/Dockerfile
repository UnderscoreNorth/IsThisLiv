# Svelte Frontend Dockerfile for Development
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start the development server with --host to allow external connections
CMD ["npm", "run", "dev"]
