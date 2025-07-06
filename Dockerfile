FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS dev
COPY . .
RUN bun add @next/swc-linux-arm64-gnu && \
	bun install 
EXPOSE 3000
CMD ["bun", "run", "dev"]

FROM base AS prod
COPY . .
RUN bun add @next/swc-linux-arm64-gnu && \
	bun install --frozen-lockfile -p && \
	bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]