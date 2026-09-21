# NewsGarden frontend.
# Build from the REPO ROOT so npm workspaces resolve:
#   docker build -f frontend/Dockerfile .
# (docker-compose.yml already uses the root as build context.)

# ---- dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Available to next.config.ts rewrites() when the build bakes them.
ARG BACKEND_INTERNAL_URL=http://localhost:4000
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
COPY --from=deps /app/node_modules ./node_modules
COPY shared ./shared
COPY frontend ./frontend
RUN npm run build --workspace=@newsgarden/shared \
 && npm run build --workspace=newsgarden-frontend

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=build /app/shared/dist ./shared/dist
EXPOSE 3000
WORKDIR /app/frontend
CMD ["npm", "start"]
