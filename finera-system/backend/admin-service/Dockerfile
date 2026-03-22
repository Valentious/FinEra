FROM node:20-alpine
WORKDIR /app

COPY database/package*.json ./database/
COPY database/prisma ./database/prisma/
WORKDIR /app/database
RUN npm ci --omit=dev
RUN npx prisma generate

WORKDIR /app
COPY backend/admin-service/package*.json ./
RUN npm ci --omit=dev

COPY backend/admin-service ./backend/admin-service
COPY database ./database

WORKDIR /app/backend/admin-service
RUN npm run build

EXPOSE 4006
CMD ["node", "dist/index.js"]
