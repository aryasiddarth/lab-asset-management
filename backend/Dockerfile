FROM node:20

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
