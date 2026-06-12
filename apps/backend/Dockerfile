FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++ vips-dev ffmpeg
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --include=dev

FROM deps AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY apps/backend apps/backend
RUN npm run build -w @vyntra/backend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl wget ffmpeg vips
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --omit=dev -w @vyntra/backend && npm cache clean --force
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma && npm run start -w @vyntra/backend"]
