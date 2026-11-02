# Backend image for Hugging Face Spaces (or any Docker host): the chatbot and contact-form API.
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build the search index now, so the embedding model is downloaded and cached inside the image.
RUN npm run ingest && npm run build && mkdir -p logs && chmod -R a+rwX /app
ENV PORT=7860 NODE_ENV=production
EXPOSE 7860
CMD ["node", "dist/server.js"]
