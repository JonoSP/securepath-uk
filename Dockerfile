# Stage 1: pull the official Bitwarden bws CLI
FROM bitwarden/bws:latest AS bws

# Stage 2: n8n app image
FROM n8nio/n8n:latest

USER root
# Copy the bws binary
COPY --from=bws /bin/bws /usr/local/bin/bws
# Copy cert bundle used by bws
COPY --from=bws /etc/ssl/certs /etc/ssl/certs
# Copy bws runtime libs into a safe path and expose via LD_LIBRARY_PATH
COPY --from=bws /lib /opt/bws-lib
ENV LD_LIBRARY_PATH="/opt/bws-lib:${LD_LIBRARY_PATH}"

# Drop back to non-root (n8n expects this)
USER node
