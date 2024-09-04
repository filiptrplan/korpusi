from node:18-alpine
WORKDIR /app
COPY yarn.lock .
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build
ENV PORT=3000

CMD ["yarn", "start"]
EXPOSE 3000