# Base image with Node.js installed
FROM node:16 AS base

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install project dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Build the project
RUN yarn build

# Use a lightweight image for serving the built files
FROM nginx:alpine AS production

# Copy the built files to the NGINX web server
COPY --from=base /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
