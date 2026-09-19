# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=https://api.getondar.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 10001 ondar \
    && adduser --system --uid 10001 --ingroup ondar ondar

COPY --from=builder --chown=ondar:ondar /app/.next/standalone ./
COPY --from=builder --chown=ondar:ondar /app/.next/static ./.next/static

USER ondar
EXPOSE 3000

CMD ["node", "server.js"]
