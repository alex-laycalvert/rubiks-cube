FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./server.js ./

EXPOSE 8888

CMD [ "node", "server.js" ]
