FROM node:22-alpine  AS base

WORKDIR /app

COPY package.json .

RUN npm i

FROM base AS dev

EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]