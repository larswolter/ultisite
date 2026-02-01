FROM node:22.22 as builder
RUN apt-get update && apt-get install -y curl git python-is-python3 build-essential
USER node
WORKDIR /home/node
RUN npx meteor@3.4

# Base image done, pulling sources for build
RUN mkdir appsrc
COPY . /home/node/appsrc
USER root
RUN chown -R node:node /home/node/appsrc
USER node

# Building meteor application
RUN cd appsrc && /home/node/.meteor/meteor npm install
RUN cd appsrc && /home/node/.meteor/meteor build --directory ../bundle

# final stage for running the container, only needs node
FROM node:22.22-slim as final 

RUN mkdir /app
COPY --from=builder /home/node/bundle /app
WORKDIR /app/bundle
RUN cd programs/server && npm install --omit=dev
EXPOSE 8080

ENTRYPOINT [ "node", "main.js" ]
