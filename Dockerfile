# n8n with Bitwarden Secrets Manager (bws) CLI
FROM n8nio/n8n:latest

USER root

# Install curl/unzip and pick the right bws binary for the base image
ARG BWS_VERSION=1.0.0
RUN set -eux; \
  if command -v apt-get >/dev/null 2>&1; then \
    apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*; \
    BWS_PKG="bws-x86_64-unknown-linux-gnu-${BWS_VERSION}.zip"; \
  elif command -v apk >/dev/null 2>&1; then \
    apk add --no-cache curl unzip; \
    BWS_PKG="bws-x86_64-unknown-linux-musl-${BWS_VERSION}.zip"; \
  else \
    echo "Unsupported base image (need apt-get or apk)"; exit 1; \
  fi; \
  curl -L -o /tmp/bws.zip "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/${BWS_PKG}"; \
  unzip /tmp/bws.zip -d /usr/local/bin; \
  chmod +x /usr/local/bin/bws; \
  rm /tmp/bws.zip

# drop back to non-root as n8n expects
USER node
