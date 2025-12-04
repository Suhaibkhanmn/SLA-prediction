# SLA Breach Prediction & Alerting System

Real-time SLA risk monitoring system for logistics operations. Predicts whether an order will breach its service-level agreement, logs predictions, visualizes risk in a dashboard, and sends alerts when risk exceeds a defined threshold.

The system is designed as a backend-heavy operations tool. It includes a trained ML model, live inference API, persistence layer, alert engine, and a frontend interface for monitoring and control.

## What This System Does

* Predicts SLA breach risk per order using a trained XGBoost model
* Stores all predictions in SQLite database
* Displays live order risk in a web dashboard
* Sends alert emails for high-risk orders
* Tracks alerts with severity levels (high, medium, low)
* Records operator actions on alerts
* Computes operational KPIs:
  * Resolution rate
  * Mean response time
  * False positive rate
* Includes JWT-based authentication with role support (admin, operator, viewer)
* Controlled user registration protected by signup secret
* Audit history for every alert action

## Architecture

```
Frontend (React + Vite + TypeScript)
      |
      | API calls
      v
Backend (FastAPI in Docker)
      |
      | persistence
      v
SQLite database
```

Backend runs inside Docker container. Frontend is deployed as a static site.

## Technology Stack

### Backend

* FastAPI
* XGBoost (classification model)
* SQLite
* Passlib (bcrypt password hashing)
* Python-JOSE (JWT authentication)
* SMTP email support
* Background alert engine

### Frontend

* React (Vite + TypeScript)
* TailwindCSS
* Recharts (data visualization)
* Framer Motion (animations)
* API-driven live UI
* AI explanation layer via Gemini API (optional)

## ML Model

The trained XGBoost model predicts the probability that an order will breach SLA (0.0 – 1.0).

Outputs:
* `miss_sla_proba` (float)
* `will_miss_sla` (boolean)

Model file: `models/xgb_model.pkl`

Model is loaded once at server startup via `ModelService` and remains resident in memory for inference.

## API Endpoints

### Core

```
POST /predict          Create prediction for an order
GET  /logs             Fetch recent prediction logs
```

### Alerting

```
GET  /alerts           List alerts (with optional status filter)
POST /alerts/{id}/ack  Acknowledge an alert
POST /alerts/{id}/resolve  Resolve alert with verdict
POST /alerts/{id}/actions  Log an action (e.g., REROUTE, ESCALATE)
GET  /alerts/{id}/actions   Get action history for an alert
```

### Metrics

```
GET /stats/today       Daily statistics (total, risk distribution, hourly breakdown)
GET /stats/trends      Trend data (hourly risk volume, carrier performance)
GET /stats/ops         Operational KPIs (resolution rate, response time, false positives)
```

### Settings

```
GET  /settings         Get current alert configuration
POST /settings         Update alert configuration (admin only)
```

### Auth

```
POST /auth/register    Register new user (requires SIGNUP_KEY)
POST /auth/login       Authenticate and receive JWT token
```

### Health

```
GET /health            System health check (API, DB, settings)
```

## Database Schema

Tables:
* `predictions` - All order predictions with features and outcomes
* `settings` - Alert threshold and email configuration
* `alerts` - Triggered alerts with status, severity, and resolution
* `alert_actions` - Audit trail of actions taken on alerts
* `users` - User accounts with roles and password hashes

Database file: `sla_logs.db` (SQLite)

## Security Model

* Authentication uses JWT tokens with configurable expiration
* Passwords are hashed using bcrypt
* Registration is protected by `SIGNUP_KEY` environment variable
* Secrets stored in environment variables only (not in code)
* SQLite database mounted in private container volume
* Role-based access control (admin, operator, viewer)
* Admin-only endpoints for settings modification

## Environment Variables

### Backend

```
SECRET_KEY             JWT signing secret
SIGNUP_KEY             Secret key for user registration
SMTP_HOST              SMTP server hostname
SMTP_PORT              SMTP server port
SMTP_USERNAME          SMTP authentication username
SMTP_PASSWORD          SMTP authentication password
EMAIL_FROM             Sender email address
EMAIL_TO               Default recipient (can be overridden in settings)
```

### Frontend

```
VITE_API_URL           Backend API base URL
VITE_GEMINI_API_KEY    Gemini API key for AI features (optional)
```

## Development Setup

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API documentation available at:
```
http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:3000
```

### Database Initialization

Database tables are created automatically on first startup via `db/init_db.py`.

### Training the Model

```bash
python training/train_xgboost.py
```

Model will be saved to `models/xgb_model.pkl`.

## Docker (Backend)

Build locally:

```bash
docker build -t sla-backend .
docker run -p 8000:8000 sla-backend
```

## Deployment

### Backend (Render)

* Runtime: Docker
* Dockerfile: `Dockerfile` (project root)
* Disk mount: `/app` (for database persistence)
* Environment variables set in Render dashboard
* Entry point: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

See `DEPLOYMENT_GUIDE.md` for detailed steps.

### Frontend (Netlify)

* Base directory: `frontend`
* Build command: `npm run build`
* Output directory: `frontend/dist`
* `VITE_API_URL` defined in Netlify environment variables

## Project Structure

```
sla/
├── app/
│   ├── main.py              FastAPI application entry point
│   ├── config.py             Environment configuration
│   ├── alert_engine.py       Email alert sender
│   ├── settings_store.py     Settings persistence
│   ├── model.py              ModelService (loads XGBoost model)
│   ├── features.py           Feature engineering
│   ├── schemas.py             Pydantic models
│   ├── routes/
│   │   ├── auth.py           Authentication endpoints
│   │   ├── alerts.py         Alert management
│   │   ├── stats.py          Statistics endpoints
│   │   ├── metrics.py        Operational metrics
│   │   └── health.py         Health check
│   └── auth/
│       ├── security.py       Password hashing, JWT
│       └── deps.py           Auth dependencies
├── db/
│   ├── init_db.py            Database schema initialization
│   └── db_connection.py      Database utilities
├── frontend/
│   └── src/
│       ├── pages/             React page components
│       ├── components/        Reusable UI components
│       ├── services/          API client functions
│       ├── context/           React context (AuthContext)
│       └── types/             TypeScript type definitions
├── models/
│   └── xgb_model.pkl          Trained XGBoost model
├── training/
│   ├── train_xgboost.py      XGBoost training script
│   └── train_baseline.py      Baseline model training
├── testing/
│   ├── batch_predict.py      Batch prediction testing
│   └── generate_test_orders.py  Test data generation
├── dashboard/
│   └── app.py                Streamlit monitoring dashboard
├── Dockerfile                 Backend container definition
├── render.yaml                Render deployment config
├── requirements.txt           Python dependencies
└── sla_logs.db               SQLite database (created at runtime)
```

## Current Limitations

* SQLite is suitable for development and small deployments but not multi-node production
* SMTP configuration is system-wide, not per-user
* No automatic model retraining pipeline
* No message queue for async processing
* No multi-tenant separation
* Free tier Render services spin down after inactivity

## Roadmap Ideas

* Per-user alert preferences
* Slack / webhook alerting channels
* Enhanced role-based UI access control
* PostgreSQL migration for production scale
* Automated model retraining pipeline
* Alert escalation policies
* Model versioning and A/B testing
* Real-time WebSocket updates for dashboard

## License

This project is proprietary. Usage and distribution are subject to the author's terms.

