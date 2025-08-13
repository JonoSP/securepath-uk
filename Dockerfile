# n8n with Bitwarden Secrets Manager (bws) CLI
FROM n8nio/n8n:latest-debian

USER root
RUN apt-get update \
 && apt-get install -y curl unzip ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install the GNU/glibc build of bws
ARG BWS_VERSION=1.0.0
RUN curl -fsSL -o /tmp/bws.zip \
  "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-x86_64-unknown-linux-gnu-${BWS_VERSION}.zip" \
 && unzip /tmp/bws.zip -d /usr/local/bin \
 && chmod +x /usr/local/bin/bws \
 && rm /tmp/bws.zip

# Drop back to non-root
USER node
