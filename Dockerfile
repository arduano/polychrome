FROM node:13.12.0 as builder
WORKDIR /usr/src/app
COPY . .
RUN npm install -g typescript@3.7.5 ts-node

RUN yarn install
RUN rm -rf build
RUN cd server && yarn build
RUN cd client && yarn build
RUN cp server/package.json build/package.json
RUN cp server/yarn.lock build/yarn.lock
RUN cd build && yarn

FROM node:13.12.0 as app
EXPOSE 3000
WORKDIR /usr/src/app
USER node
COPY --from=builder /usr/src/app/build .
COPY .env .env
CMD node server.js
