FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app-server.mjs ./
COPY website ./website
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "app-server.mjs"]
