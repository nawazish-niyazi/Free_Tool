FROM node:18-bullseye-slim

# Install system dependencies for file processing
# libreoffice: for document to PDF conversion
# ghostscript: for PDF compression/manipulation
# poppler-utils: for pdfinfo etc
RUN apt-get update && apt-get install -y \
    libreoffice \
    ghostscript \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create temp directory
RUN mkdir -p temp

EXPOSE 5000

CMD ["npm", "start"]
