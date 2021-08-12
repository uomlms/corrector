FROM node:14-alpine

RUN apk --no-cache add \
      bash \
      g++ \
      gcc \
      libc-dev \
      ca-certificates \
      lz4-dev \
      musl-dev \
      cyrus-sasl-dev \
      openssl-dev \
      make \
      python \
      python3

WORKDIR /app
COPY package.json .
RUN npm install --only=prod
COPY . .

CMD ["npm", "start"]