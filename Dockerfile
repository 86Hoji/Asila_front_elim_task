# ASILA site: plain Node server (Nitro node-server preset) on port 3000.
#
#   docker build -t asila-site \
#     --build-arg VITE_USE_MOCK=false \
#     --build-arg VITE_API_BASE= \
#     .
#   docker run -p 3000:3000 asila-site
#
# VITE_* values are baked into the client bundle at build time.
# VITE_API_BASE="" means the demo API is served under /api on the same domain.

FROM node:22-slim AS build
WORKDIR /app

ARG VITE_USE_MOCK=true
ARG VITE_API_BASE=
ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE=$VITE_API_BASE \
    NITRO_PRESET=node-server

COPY package.json bun.lock ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# The node-server output is self-contained: server bundle + static assets.
COPY --from=build /app/.output ./.output

EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
