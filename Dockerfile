FROM node:24-bullseye-slim
RUN npm install -g pnpm
WORKDIR /app 
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["pnpm", "run", "dev"]