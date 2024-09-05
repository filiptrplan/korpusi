from node:18-alpine
WORKDIR /app
COPY yarn.lock .
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build
RUN find ./public/build -type f -name '*.map' -delete
RUN find ./build -type f -name '*.map' -delete
ENV PORT=3000

CMD ["yarn", "start"]
EXPOSE 3000