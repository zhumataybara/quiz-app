FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/index.js"]
