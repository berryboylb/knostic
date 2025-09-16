# Knostic CSV Management Web Application

    A full-stack **React + Node/Express** web application for uploading, editing, validating, and exporting CSV data, built by Olorunfemi Daramola

## ✨ Features

- **CSV Upload & Editing**
  - Upload `strings.csv` and `classifications.csv` (file names may vary).
  - Edit cells inline, add or remove rows.

- **Validation**
  - Ensures every `Topic + SubTopic + Industry` combination in `strings.csv`
    exists in `classifications.csv`.
  - Invalid rows are highlighted and saving is blocked until resolved.

- **Export**
  - Download the updated CSVs to your local machine.

- **API Docs**
  - Interactive Swagger UI available at `/api-docs`.

- **Production-ready**
  - TypeScript across frontend and backend.
  - Unit tests for critical logic.
  - Single Docker image for simple deployment.

---

## 🗂️ Project Structure

knostic-app/
│
├─ frontend/ # React + Vite SPA
│ ├─ src/
│ └─ ...
│
├─ backend/ # Express 5 API + CSV validation logic
│ ├─ src/
│ └─ ...
│
├─ package.json # Root workspace config & scripts
├─ Dockerfile # Multi-stage build for the full app
└─ .dockerignore
└─ .gitignore

## 🧑‍💻 Local Development

> Requires **Node 20+** and **npm 9+** (or pnpm if you prefer).

1. **Install dependencies**

   ```bash
   npm install:all 
   ```
2. Environment variables

    Create a backend/.env (see .env.example if provided):

    PORT=8080

3. Run in dev mode (in single command)
        ```bash
        npm run dev
        ```
    # Start backend on  http://localhost:8080
    # start frontend on http://localhost:5173

    Run in dev mode (two servers)

    # Start backend on http://localhost:8080
    npm run start:dev --workspace backend

    # In another terminal, start frontend Vite dev server on http://localhost:5173
    npm run dev --workspace frontend


4. 🧪 Testing
    # Backend tests
    npm test --workspace backend

    # Frontend tests (if any)
    npm test --workspace frontend


5. 🐳 Docker

    Build a single production image and run it:

    docker build -t knostic-app . --no-cache
    docker run -p 8080:8080 knostic-app

    The container serves:

    React SPA at http://localhost:8080/

    API endpoints under /*

    Swagger docs at http://localhost:8080/api-docs


6. 🏛️ Tech Stack

    Frontend: React 19, Vite, Tailwind CSS, TypeScript

    Backend: Node 20, Express 5, TypeScript

    CSV Parsing: csv-parser

    API Docs: OpenAPI + Swagger UI

    Testing: Vitest

    Containerization: Docker (multi-stage build)


7. 🚀 Deployment

    Build the Docker image: docker build -t knostic-app .

    Expose port 8080.