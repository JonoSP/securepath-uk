FROM n8nio/n8n:latest

USER root

# Install additional packages if needed
RUN apk add --update --no-cache \
    python3 \
    py3-pip \
    g++ \
    make

# Create data directory
RUN mkdir -p /home/node/.n8n && \
    chown -R node:node /home/node/.n8n

USER node

# Set environment
ENV NODE_ENV=production
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https

EXPOSE 5678

# Start n8n
CMD ["n8n", "start"]