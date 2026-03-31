FROM node:20-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/typescript-config ./packages/typescript-config
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter @hyperz/web...
RUN pnpm --filter @hyperz/web build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "@hyperz/web", "start"]
