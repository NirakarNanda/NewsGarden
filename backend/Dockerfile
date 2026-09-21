# NewsGarden backend.
# Build from the REPO ROOT so npm workspaces resolve:
#   docker build -f backend/Dockerfile .
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
COPY --from=deps /app/node_modules ./node_modules
COPY shared ./shared
COPY backend ./backend
RUN npm run build --workspace=@newsgarden/shared \
 && npm run build --workspace=newsgarden-backend

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/shared/dist ./shared/dist
EXPOSE 4000
WORKDIR /app/backend
CMD ["node", "dist/server.js"]
