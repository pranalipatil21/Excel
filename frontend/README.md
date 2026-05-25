# Excel Analytics Platform

Excel Analytics Platform is a full-stack dashboard application for uploading Excel files, exploring the data visually, building custom dashboards, and generating AI-driven insights from the uploaded rows.

The project is split into two parts:

- Frontend: React single-page application for upload, visualization, dashboard building, and AI insight views.
- Backend: Express and MongoDB API for authentication, file persistence, dashboard storage, sharing, and Gemini-powered analysis.

## What This Project Does

The app lets a user:

- Sign up, log in, and access protected analytics pages.
- Upload `.xls` or `.xlsx` files and store the file metadata in MongoDB.
- Parse spreadsheet rows in the browser with `xlsx` and keep a working dataset in local storage.
- Generate charts from uploaded data using several visualization libraries.
- Ask the AI layer for summaries, chart explanations, dependency analysis, and period comparisons.
- Build and save custom dashboards from the uploaded dataset.
- Share dashboards with other users through the backend sharing workflow.

## Project Flow

### 1. Authentication and entry

Users start at the public landing flow and move into the authenticated experience through login or registration. Protected pages are guarded by a `ProtectedRoute` wrapper so the analytics views are only available after authentication.

### 2. Excel file upload

The upload screen accepts Excel files only. On submit, the frontend:

- Validates the file extension.
- Reads the workbook in the browser with `xlsx`.
- Converts the first sheet into JSON rows.
- Stores a trimmed preview of the dataset in local storage for the chart pages.
- Sends the raw file to the backend with `axios` and `multipart/form-data`.

The backend upload route uses `multer` memory storage, validates the file type, stores the file in MongoDB, and returns a file id that the frontend keeps as the current upload reference.

### 3. Visualization and spreadsheet editing

After upload, the charts page loads the stored dataset and offers multiple ways to work with it:

- Bar, line, pie, doughnut, radar, and table-based views.
- Spreadsheet-style editing of the uploaded data.
- Formula evaluation for simple cell expressions.
- Export and capture workflows using `html2canvas` and `jspdf`.

### 4. AI insight generation

The AI insights panel sends dataset slices or chart metadata to backend endpoints under `/api/dashboard/insights`.
The service layer calls Google Gemini through `@google/generative-ai` when the `GEMINI_API` environment variable is available.
If the key is missing or the model fails, the service falls back to mock responses so the UI can still render insight text.

### 5. Dashboard creation and sharing

The dashboard builder lets users compose a dashboard from chart, table, and KPI widgets. Dashboards can be stored in MongoDB and later shared through the dashboard sharing workflow. The backend protects these operations with JWT authentication and owner checks.

## Technology Stack

### Frontend

- React 19 with `react-scripts`
- `react-router-dom` for routing and protected pages
- `axios` for API calls
- `xlsx` for reading Excel files in the browser
- `chart.js` and `react-chartjs-2` for chart rendering
- `recharts` and `react-plotly.js` for additional visualization options
- `@react-three/fiber`, `@react-three/drei`, and `three` for 3D rendering utilities
- `framer-motion` for motion and UI transitions
- `html2canvas` and `jspdf` for canvas capture and PDF export
- `react-icons` for UI icons
- `tailwindcss`, `postcss`, and `autoprefixer` for styling

### Backend

- Node.js with Express 5
- MongoDB with Mongoose
- `multer` for file uploads
- `bcrypt` and `bcryptjs` for password hashing
- `jsonwebtoken` for authentication tokens
- `cors` and `dotenv` for API configuration
- `uuid` for identifiers where needed
- `@google/generative-ai` for Gemini-powered analysis

## Main Modules

### Frontend pages

- `Home` and `Gate` handle public entry points.
- `Login`, `Register`, and `AdminLogin` handle authentication.
- `Upload` handles Excel upload, validation, preview, and persistence.
- `Charts` handles charting, spreadsheet editing, AI insights, dashboard creation, and sharing.
- `History`, `Profile`, and `Settings` handle user account and activity flows.

### Frontend components

- `NavbarMain`, `NavbarAuth`, `SidebarDrawer`, and `Footer` provide application shell UI.
- `ProtectedRoute` blocks unauthenticated access.
- `AIInsightsPanel` talks to the AI insight endpoints.
- `DashboardBuilder` creates and configures reusable dashboard widgets.
- `DashboardSharing` handles dashboard sharing interactions.

### Backend routes

- `auth` and `authRoutes` handle login and registration logic.
- `user` handles user-related data.
- `upload` handles file ingestion and upload history.
- `dashboard` handles dashboard CRUD plus AI insight endpoints.

## Data Flow

1. A user uploads an Excel file.
2. The frontend reads the first sheet and keeps a JSON preview in local storage.
3. The file is posted to `/api/upload/excel` for storage and tracking.
4. The charts page reuses the cached rows to build charts and worksheet-style views.
5. The AI panel sends the dataset or chart metadata to `/api/dashboard/insights/*`.
6. The backend service formats the rows, calls Gemini, and returns natural-language analysis.
7. Dashboard definitions and share metadata are saved in MongoDB.

## API Summary

### Upload

- `POST /api/upload/excel` uploads an Excel file and stores the file record.
- `GET /api/upload/history` returns recent uploads.

### AI insights

- `POST /api/dashboard/insights/analyze` generates a dataset summary.
- `POST /api/dashboard/insights/explain-chart` explains a chart.
- `POST /api/dashboard/insights/compare` compares two periods.
- `POST /api/dashboard/insights/dependencies` explains dependencies in the data.

### Dashboards

- `GET /api/dashboard/:uploadId` lists dashboards for a file.
- `POST /api/dashboard` creates a dashboard.
- `PATCH /api/dashboard/:dashboardId` updates a dashboard.
- `DELETE /api/dashboard/:dashboardId` deletes a dashboard.
- Sharing endpoints live under `/api/dashboard/:dashboardId/share`.

## Environment Variables

Frontend:

- `REACT_APP_API_URL` sets the API base URL.

Backend:

- `PORT` sets the server port.
- `MONGO_URI` points to MongoDB.
- `GEMINI_API` enables AI analysis.
- `GEMINI_MODEL` optionally selects the Gemini model.

## Local Development

Install dependencies in both folders:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm start
```

Run the frontend:

```bash
cd frontend
npm start
```

The frontend expects the backend API at `http://localhost:5000/api` unless `REACT_APP_API_URL` is set.

## Build

```bash
cd frontend
npm run build
```

This produces the production bundle in the `build` directory.

## Notes

- The upload flow currently uses the first worksheet in the workbook for analysis.
- The frontend caches a limited preview of the uploaded rows so the visualization pages load quickly.
- Gemini responses are fallback-safe, so the app can still show analysis text even when the API key is unavailable.
