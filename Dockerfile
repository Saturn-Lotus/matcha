FROM oven/bun:latest AS base

WORKDIR /app

RUN apt-get update && apt-get install -y npm

COPY package.json .
COPY bun.lock .

RUN bun install --frozen-lockfile && \
	bun add @next/swc-linux-arm64-gnu

FROM base AS dev

EXPOSE 3000
CMD ["bun", "run", "dev"]

FROM base AS prod

COPY . .

RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]