FROM node:20-alpine
WORKDIR /app

COPY database/package*.json ./database/
COPY database/prisma ./database/prisma/
WORKDIR /app/database
RUN npm ci --omit=dev
RUN npx prisma generate

WORKDIR /app
COPY backend/ledger-service/package*.json ./
RUN npm ci --omit=dev

COPY backend/ledger-service ./backend/ledger-service
COPY database ./database

WORKDIR /app/backend/ledger-service
RUN npm run build

EXPOSE 4004
CMD ["node", "dist/index.js"]
