FROM node:20-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/typescript-config ./packages/typescript-config
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter @hyperz/api...
RUN pnpm --filter @hyperz/api build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "pnpm --filter @hyperz/api migration:run:dist && pnpm --filter @hyperz/api start"]
