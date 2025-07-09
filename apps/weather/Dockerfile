FROM node:22.13.0-alpine as prunner

# turborepo deps
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY . .
RUN npx turbo prune --scope=@weather-subscription/weather --docker

FROM node:22.13.0-alpine as runner

# turborepo deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=prunner /app/out/json .
COPY --from=prunner /app/out/package-lock.json .

# turborepo copies node_modules dir to a prunned build
# because of that it doesn't make sense to split installing of dev and production deps
# --ignore-scripts to prevent @weather-subscription/root's "postinstall" hook calling
RUN npm ci --ignore-scripts

COPY --from=prunner /app/out/full .
RUN npx turbo run build --filter @weather-subscription/weather

ENV NODE_ENV=production

CMD ["node", "apps/weather/dist/index.js"]
