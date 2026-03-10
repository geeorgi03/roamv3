FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile --filter=@roam/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY packages/db/ packages/db/
COPY apps/api/ apps/api/
RUN pnpm --filter=@roam/types build && \
    pnpm --filter=@roam/db build && \
    pnpm --filter=@roam/api build

FROM base AS runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/package.json ./packages/db/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY pnpm-workspace.yaml package.json ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
