# Use Node.js 16 as the base image
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Start a new stage for a smaller production image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app .

# Set environment variables
ENV NODE_ENV production

# Start the application
CMD ["npm", "start"]