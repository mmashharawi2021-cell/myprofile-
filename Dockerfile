FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY app ./app
COPY shared ./shared
COPY tsconfig.json vite.config.ts ./
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data PUBLIC_DIR=/app/public SEED_PATH=/app/default-content.json EDITOR_CREDENTIALS_FILE=/run/secrets/editor_credentials
WORKDIR /app
COPY --from=build /app/docs ./public
COPY app/src/content/default.json ./default-content.json
COPY server ./server
COPY shared ./shared
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "server/index.mjs"]
