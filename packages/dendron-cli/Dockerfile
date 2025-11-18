FROM node:16-alpine
RUN npm install -g @sxltd/dendron-cli --omit=dev
RUN npm cache clean --force
ENTRYPOINT ["npx", "@sxltd/dendron-cli"]