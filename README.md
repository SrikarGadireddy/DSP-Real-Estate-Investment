# DSP Real Estate Investment Platform

A full-stack real estate investment platform built with React and Node.js. Manage properties, track investments, analyze portfolios, and integrate with external real estate APIs through an easy-to-use developer onboarding portal.

## Features

### Property Management
- Browse, search, and filter properties by type, status, price range, location
- Full CRUD operations for property listings
- Property detail pages with investment options
- Support for residential, commercial, industrial, land, and mixed-use properties

### Investment Tracking
- Create and manage real estate investments
- Track investment amount, ownership percentage, ROI, and monthly income
- Investment status management (active, sold, pending)

### Investor Dashboard
- Portfolio summary: total invested, property value, monthly income, ROI
- Investment analytics by property type, status, and monthly trend
- Recent investment activity feed

### Advanced Search
- Multi-criteria search: keyword, city, state, property type, price range, bedrooms, bathrooms
- Save and manage search criteria for quick access
- Search notification preferences

### API Onboarding Portal (Developer Hub)
- Self-service API key generation and management
- Key permissions configuration (read, write, delete)
- Key expiration management
- Interactive code examples (cURL, JavaScript, Python)
- API authentication guide
- Rate limiting documentation

### External API Integrations
- Pre-configured connectors for 6 real estate APIs:
  - **Zillow API** — Property data, Zestimates, comparable sales
  - **Realtor.com API** — Listings, property details, market trends
  - **Walk Score API** — Walk Score, Transit Score, Bike Score
  - **Google Maps Geocoding** — Address-to-coordinate conversion
  - **Census Bureau API** — Demographic and housing data
  - **Mortgage Rates API** — Current and historical mortgage rates
- One-click connect/disconnect per integration
- Per-user configuration management
- Organized by category: Property Data, Market Analysis, Mortgage, Demographics, Mapping

### Security
- JWT-based authentication with role-based authorization
- Password hashing with bcrypt (cost factor 12)
- API key authentication for programmatic access
- Helmet security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation on all endpoints

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 18, React Router v6, Axios, Vite       |
| Backend   | Node.js, Express 5, Swagger/OpenAPI           |
| Database  | SQLite (better-sqlite3) with WAL mode         |
| Auth      | JWT (jsonwebtoken), bcryptjs                  |
| Docs      | Swagger UI at `/api/docs`                     |

## Project Structure

```
DSP-Real-Estate-Investment/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Swagger configuration
│   │   ├── middleware/       # Auth, API key auth, validators
│   │   ├── models/           # Database schema and seed data
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.js       # Registration, login, profile
│   │   │   ├── properties.js # Property CRUD
│   │   │   ├── investments.js# Investment CRUD
│   │   │   ├── search.js     # Search and saved searches
│   │   │   ├── dashboard.js  # Portfolio dashboard
│   │   │   ├── apiKeys.js    # API key management
│   │   │   └── integrations.js # External API integrations
│   │   ├── utils/            # Helper functions
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, PropertyCard, LoadingSpinner, ProtectedRoute
│   │   ├── context/          # AuthContext (JWT state management)
│   │   ├── pages/            # All application pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Properties.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Investments.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── ApiOnboarding.jsx    # Developer API portal
│   │   │   └── ApiIntegrations.jsx  # External API management
│   │   ├── services/         # API client modules
│   │   ├── App.jsx           # Router and layout
│   │   ├── App.css           # Complete application styles
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json              # Root scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/SrikarGadireddy/DSP-Real-Estate-Investment.git
cd DSP-Real-Estate-Investment

# Install all dependencies
npm run install:all
```

### Configuration

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit backend/.env and set your JWT secret
# (change JWT_SECRET to a strong random string in production)
```

### Running the Application

```bash
# Terminal 1 — Start the backend API server
npm run dev:backend
# Backend runs at http://localhost:5000
# API docs at http://localhost:5000/api/docs

# Terminal 2 — Start the frontend dev server
npm run dev:frontend
# Frontend runs at http://localhost:3000
```

### Production Build & Deploy

The backend can serve the complete application (React SPA + API) as a single HTML deployment from one port.

```bash
# 1. Install all dependencies and build the React frontend into static files
npm run build

# 2. Configure the backend for production
cp backend/.env.example backend/.env
# Edit backend/.env:
#   - Set JWT_SECRET to a strong random string
#   - Set NODE_ENV=production  (enables frontend serving + production error handling)
#   - Set CORS_ORIGIN to your deployment URL (e.g. https://your-app.com)
#   - Optionally set OPENAI_API_KEY for AI features

# 3. Start the server — serves both the API and the React frontend on port 5000
npm start
# Application available at http://localhost:5000
# API docs available at http://localhost:5000/api/docs
```

How it works: when `NODE_ENV=production`, Express serves the compiled React app from `frontend/dist/` as static files. All `/api/*` requests are handled by the backend; all other paths return `index.html` so React Router handles client-side navigation.

**Local production preview** (without changing `NODE_ENV`):

```bash
npm run build:frontend
SERVE_FRONTEND=true npm run start:backend
```

## API Reference

All endpoints are documented via Swagger UI at `http://localhost:5000/api/docs`.

### Authentication

| Method | Endpoint              | Description            | Auth     |
|--------|----------------------|------------------------|----------|
| POST   | `/api/auth/register` | Register a new user    | None     |
| POST   | `/api/auth/login`    | Login with credentials | None     |
| GET    | `/api/auth/me`       | Get current user       | Bearer   |

### Properties

| Method | Endpoint              | Description            | Auth     |
|--------|----------------------|------------------------|----------|
| GET    | `/api/properties`    | List properties        | Optional |
| GET    | `/api/properties/:id`| Get property details   | Optional |
| POST   | `/api/properties`    | Create a property      | Bearer   |
| PUT    | `/api/properties/:id`| Update a property      | Bearer   |
| DELETE | `/api/properties/:id`| Delete a property      | Bearer   |

### Investments

| Method | Endpoint                | Description            | Auth   |
|--------|------------------------|------------------------|--------|
| GET    | `/api/investments`     | List user investments  | Bearer |
| GET    | `/api/investments/:id` | Get investment details | Bearer |
| POST   | `/api/investments`     | Create an investment   | Bearer |
| PUT    | `/api/investments/:id` | Update an investment   | Bearer |
| DELETE | `/api/investments/:id` | Delete an investment   | Bearer |

### Search

| Method | Endpoint              | Description            | Auth     |
|--------|----------------------|------------------------|----------|
| GET    | `/api/search`        | Search properties      | Optional |
| GET    | `/api/search/saved`  | Get saved searches     | Bearer   |
| POST   | `/api/search/saved`  | Save a search          | Bearer   |
| DELETE | `/api/search/saved/:id` | Delete saved search | Bearer   |

### Dashboard

| Method | Endpoint                 | Description            | Auth   |
|--------|-------------------------|------------------------|--------|
| GET    | `/api/dashboard`        | Portfolio summary      | Bearer |
| GET    | `/api/dashboard/analytics` | Investment analytics | Bearer |

### API Keys (Developer Portal)

| Method | Endpoint          | Description         | Auth   |
|--------|------------------|---------------------|--------|
| GET    | `/api/keys`      | List API keys       | Bearer |
| POST   | `/api/keys`      | Create an API key   | Bearer |
| DELETE | `/api/keys/:id`  | Revoke an API key   | Bearer |

### External Integrations

| Method | Endpoint                         | Description                  | Auth     |
|--------|----------------------------------|------------------------------|----------|
| GET    | `/api/integrations`              | List available integrations  | None     |
| GET    | `/api/integrations/:id`          | Get integration details      | None     |
| POST   | `/api/integrations/:id/connect`  | Connect to an integration    | Bearer   |
| POST   | `/api/integrations/:id/disconnect` | Disconnect integration     | Bearer   |
| GET    | `/api/integrations/connections/me` | Get user's connections      | Bearer   |

### Using API Keys

After creating an API key through the portal, include it in requests:

```bash
curl -H "X-API-Key: dsp_your_api_key_here" http://localhost:5000/api/properties
```

## Database Schema

The application uses SQLite with 8 tables:
- **users** — User accounts with roles (investor, admin, agent)
- **properties** — Property listings with full details
- **investments** — Investment records linking users to properties
- **api_keys** — Developer API keys with permissions and rate limits
- **api_integrations** — Pre-configured external API connectors
- **api_integration_connections** — Per-user integration configurations
- **saved_searches** — User saved search criteria
- **property_analytics** — Property view/inquiry/favorite tracking

## License

ISC
