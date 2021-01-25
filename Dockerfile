FROM node:14 as builder
WORKDIR /usr/src/app
COPY . .

RUN yarn install --pure-lock-file
RUN yarn build

CMD yarn prod
