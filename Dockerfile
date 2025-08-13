# n8n + Bitwarden Secrets Manager (bws) on a current Debian base
FROM node:20-bookworm-slim

# Install system deps
USER root
RUN apt-get update \
 && apt-get install -y curl unzip ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install n8n globally
RUN npm install -g n8n@latest

# Install Bitwarden Secrets Manager CLI (glibc build)
ARG BWS_VERSION=1.0.0
RUN curl -fsSL -o /tmp/bws.zip \
  "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-gnu-${BWS_VERSION}.zip" \
 && unzip /tmp/bws.zip -d /usr/local/bin \
 && chmod +x /usr/local/bin/bws \
 && rm /tmp/bws.zip

# n8n expects this directory to exist & be writable by 'node'
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Drop privileges
USER node

# Expose n8n default port (Render maps it)
ENV N8N_PORT=5678
EXPOSE 5678
