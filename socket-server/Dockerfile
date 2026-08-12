# Image for the Socket.IO server (Railway). The Next.js app ships to Vercel,
# so this build only carries the socket entrypoint and the `src/` modules it
# imports — there is no `next build` step here.
FROM node:22-slim

WORKDIR /app

# The socket entrypoint runs through tsx and loads dotenv, both devDependencies,
# so dev deps must be installed. Cypress' binary is the only heavy one that is
# never used at runtime.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
COPY socket-server ./socket-server

ENV NODE_ENV=production

EXPOSE 4001

CMD ["npm", "run", "start:socket"]
