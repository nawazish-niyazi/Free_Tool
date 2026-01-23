# N.A.I.R Solutions – One-Stop Solution

Your all-in-one destination for documents, images, and tools. One place to find everything you need to get the job done. Built with the MERN stack + Python AI.

## 🚀 Features

### 📄 PDF Tools (The Hub)
A consolidated center for all your document needs:
- **Compress PDF**: Reduce file size while maintaining high quality.
- **Conversion Hub**: Convert Word, Excel, PPT, and Images to/from PDF.
- **Security**: Protect with passwords or unlock restricted PDFs.
- **Annotate**: Add text/image watermarks and electronically sign (eSign) documents.

### 🖼️ Image Tools
- **AI Background Removal**: Automatically remove image backgrounds using machine learning.
- **Resize & Compress**: Change dimensions and optimize file sizes (JPEG, PNG, WebP).
- **Format Converter**: Instant conversion between common image formats.

### 🔗 QR Code Generator
- **Instant Preview**: Live generation of QR codes as you customize settings.
- **Customization**: Change colors and resolution (size) to match your brand.
- **Secure Download**: Download in PNG or SVG formats (Protected for members).

### 🏪 Local Help Line (Exclusive)
Find verified, high-quality local professionals in your area:
- **Categorized Search**: Browse through categories like House Needs, Health & Care, Freelancers, Automobile, and more.
- **Sub-services**: Drill down into specific needs (e.g., House Needs -> Plumber or Electrician).
- **Verified Pros**: Access names, verified contact numbers, and experience levels.
- **Review System**: Rate professionals and share your experience with the community.

### 💰 Financial Tools
- **Invoice Generator**: Create professional PDF invoices with custom branding, INR support, and unique numbering.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Main Backend**: Node.js, Express, MongoDB (Mongoose).
- **AI Service**: Python 3.10+, Flask, Rembg (AI Model), ONNX Runtime.
- **Processing Libraries**: `sharp`, `pdf-lib`, `libreoffice-convert`, `qrcode`, `puppeteer`.
- **Deployment**: Docker & Docker Compose.

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Python 3.10+](https://www.python.org/) (for AI Background Removal)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or via Docker)
- **External Tools** (Required for PDF features):
    - [LibreOffice](https://www.libreoffice.org/download/download/) (for document conversion)
    - [Ghostscript](https://www.ghostscript.com/download/) (for PDF compression)
    - [QPDF](https://github.com/qpdf/qpdf/releases) (for PDF protection/unlocking)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd "NAIR solution"
    ```

2.  **Install all dependencies** (Node & Python):
    ```bash
    npm run install-all
    ```

### Configuration

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nair_solutions
JWT_SECRET=your_jwt_secret
```

---

## 💻 Usage

### Quick Start (Recommended)

To start the **Frontend**, **Backend**, and **AI Service** simultaneously:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Main Backend**: [http://localhost:5000](http://localhost:5000)
- **AI Service**: [http://localhost:5001](http://localhost:5001)

### Manual Start

1.  **Backend**: `npm run server`
2.  **Frontend**: `npm run client`
3.  **AI Server**: `npm run ai-server`

---

## 📁 Project Structure

```text
.
├── ai-service/         # Python Flask service for AI tasks (BG Removal)
├── backend/            # Node.js Express server & API logic
│   ├── src/
│   │   ├── models/     # Database Schemas (User, Invoice, Professional)
│   │   ├── services/   # Business logic (PDF, Invoices, eSign)
│   │   └── routes/     # API endpoints (qr, local-help, etc.)
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── pages/      # Dashboards & Tools (LocalHelp, QrGenerator, etc.)
│   │   └── components/ # Reusable UI pieces (Navbar, ToolCard, etc.)
├── temp/               # Storage for processed files (auto-cleanup)
└── docker-compose.yml  # Docker multi-container setup
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
