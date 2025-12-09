# Use official Node.js runtime as a parent image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies with npm install (ignore lockfile)
RUN npm install --force

# Copy all files
COPY . .

# Create environment file for build
#get thsi file from me 
# Generate Prisma client
RUN npx prisma generate

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]