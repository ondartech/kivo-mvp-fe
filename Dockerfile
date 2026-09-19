FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 10001 ondar \
  && adduser --system --uid 10001 --ingroup ondar ondar

COPY --from=builder --chown=ondar:ondar /app/.next/standalone ./
COPY --from=builder --chown=ondar:ondar /app/.next/static ./.next/static

USER ondar
EXPOSE 3000

CMD ["node", "server.js"]
