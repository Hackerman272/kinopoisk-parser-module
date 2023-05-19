FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2  libcairo2 libpango-1.0-0 libxshmfence1 libglu1

COPY . .

COPY ./dist ./dist

CMD ["npm", "run", "start:dev"]
