FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build step is optional for dev, but let's just use dev server for now or build
# RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
