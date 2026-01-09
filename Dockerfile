FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Create uploads directory and fonts directory for production
# Create directory structure for fonts and try to copy if they exist (handled by COPY . . but explicit check is good)
RUN mkdir -p server/uploads && mkdir -p server/fonts
# Ensure permissions
RUN chmod 777 server/uploads

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "server"]
