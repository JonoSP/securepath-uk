# n8n with Bitwarden Secrets Manager CLI
FROM n8nio/n8n:latest

USER root
# Tools to download/unzip bws
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# --- Install Bitwarden Secrets Manager CLI (bws) ---
# Pick a known-good version; update later when needed
ARG BWS_VERSION=1.0.0
RUN set -eux; \
  curl -L -o /tmp/bws.zip \
    "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-gnu-${BWS_VERSION}.zip"; \
  unzip /tmp/bws.zip -d /usr/local/bin; \
  chmod +x /usr/local/bin/bws; \
  rm /tmp/bws.zip

# Drop back to the non-root user n8n expects
USER node
