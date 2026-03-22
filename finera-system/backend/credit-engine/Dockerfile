FROM node:20-alpine
WORKDIR /app

COPY database/package*.json ./database/
COPY database/prisma ./database/prisma/
WORKDIR /app/database
RUN npm ci --omit=dev
RUN npx prisma generate

WORKDIR /app
COPY backend/credit-engine/package*.json ./
RUN npm ci --omit=dev

COPY backend/credit-engine ./backend/credit-engine
COPY database ./database

WORKDIR /app/backend/credit-engine
RUN npm run build

EXPOSE 4003
CMD ["node", "dist/index.js"]
