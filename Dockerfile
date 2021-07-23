FROM node:alpine
RUN apk update && apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python3 bash

WORKDIR /app
COPY package.json .
RUN npm install --only=prod
COPY . .

CMD ["npm", "start"]