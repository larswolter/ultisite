FROM node:14.20 as builder
RUN apt-get update && apt-get install -y curl git python build-essential
RUN curl https://install.meteor.com/?release=2.8.0 | sh

# Base image done, pulling sources for build
ENV METEOR_ALLOW_SUPERUSER 1
WORKDIR /build
RUN mkdir appsrc
COPY . /build/appsrc

# Building meteor application
RUN cd appsrc && meteor npm install --production && meteor npm audit fix --only=prod
RUN cd appsrc && meteor build --directory ../bundle

# final stage for running the container, only needs node
FROM node:14.20-slim as final 

RUN mkdir /app
COPY --from=builder /build/bundle /app
WORKDIR /app/bundle
RUN cd programs/server && npm install --production && npm audit fix --only=prod
EXPOSE 8080

ENTRYPOINT [ "node", "main.js" ]
