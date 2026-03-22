FROM node:20-alpine
WORKDIR /app

COPY database/package*.json ./database/
COPY database/prisma ./database/prisma/
WORKDIR /app/database
RUN npm ci --omit=dev
RUN npx prisma generate

WORKDIR /app
COPY backend/user-service/package*.json ./
RUN npm ci --omit=dev

COPY backend/user-service ./backend/user-service
COPY database ./database

WORKDIR /app/backend/user-service
RUN npm run build

EXPOSE 4002
CMD ["node", "dist/index.js"]
