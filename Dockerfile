# Use a lightweight Node.js image as the base
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# RUN npm run prisma-generate
RUN npm run build
RUN npm prune --production

# Use a lightweight Node.js image for the production stage
FROM node:18-alpine AS production

ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy only the build output and necessary files
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/prisma ./prisma

# Expose the default port (adjust if necessary)
EXPOSE 3000

# Start the application
CMD ["node", "build"]
