FROM node:17-alpine
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY ./dist/out-tsc /app
EXPOSE 4199
CMD ["node", "main-app.js"]
