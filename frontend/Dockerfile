# Build the Next.js app as a standalone server, then run only what it needs.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Rewrites are fixed at build time, so the backend address has to be known here.
ARG BACKEND_URL=http://backend:8080
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static .next/static
COPY --from=build --chown=node:node /app/public public
COPY --from=build --chown=node:node /app/scripts/client-address.cjs scripts/

USER node
EXPOSE 3000
# client-address.cjs tells the backend which address each request came from, for its sign-in rate limits.
CMD ["node", "--require", "./scripts/client-address.cjs", "server.js"]
