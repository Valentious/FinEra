FROM node:20-alpine
WORKDIR /app

COPY database/package*.json ./database/
COPY database/prisma ./database/prisma/
WORKDIR /app/database
RUN npm ci --omit=dev
RUN npx prisma generate

WORKDIR /app
COPY backend/auth-service/package*.json ./
RUN npm ci --omit=dev

COPY backend/auth-service ./backend/auth-service
COPY database ./database

WORKDIR /app/backend/auth-service
RUN npm run build

EXPOSE 4001
CMD ["node", "dist/index.js"]
