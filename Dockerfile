# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate
RUN npm run build

# Stage 2: Run the application
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install Prisma CLI for migrations
RUN npm install prisma

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma

# Copy any additional necessary files (if needed)
# COPY --from=builder /app/tsconfig.json ./

# Expose the API port
EXPOSE 3000

# Start the application (run migrations first, then start server)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"] 