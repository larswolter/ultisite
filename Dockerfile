FROM node:8.11 as builder
RUN apt-get update && apt-get install -y curl git python build-essential
RUN curl https://install.meteor.com/?release=1.7.0.5 | sh

# Base image done, pulling sources for build
ENV METEOR_ALLOW_SUPERUSER 1
WORKDIR /build
RUN mkdir appsrc
COPY . /build/appsrc

# Building meteor application
RUN cd appsrc && meteor npm install --production
RUN cd appsrc && meteor build --directory ../bundle

# final stage for running the container, only needs node
FROM node:8.11 as final 
RUN apt-get update && apt-get install -y curl git python build-essential

RUN mkdir /app
COPY --from=builder /build/bundle /app
WORKDIR /app/bundle
RUN cd programs/server && npm install --production
EXPOSE 8080

ENTRYPOINT [ "node", "main.js" ]
