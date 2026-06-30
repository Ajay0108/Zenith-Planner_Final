# Use the official Node.js 20 image.
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (only production dependencies to save space)
RUN npm ci --omit=dev

# Copy the pre-built dist folder (which contains the frontend and the compiled server.cjs)
# Note: You MUST run `npm run build` locally before deploying so the dist folder exists!
COPY dist ./dist

# Set the environment to production
ENV NODE_ENV=production

# The port that Cloud Run will listen on (Cloud Run sets the PORT environment variable)
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Run the compiled backend server
CMD ["node", "dist/server.cjs"]
