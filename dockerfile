# Use an official Node runtime as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for both frontend and backend
COPY package*.json ./
COPY observation-backend/package*.json ./observation-backend/

# Install dependencies for both frontend and backend
RUN npm install
RUN cd observation-backend && npm install

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Change to the backend directory
WORKDIR /usr/src/app/observation-backend

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]