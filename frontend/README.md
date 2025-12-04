# SLA Predict Frontend

Modern React frontend for the SLA Prediction system, built with Vite, TypeScript, and Tailwind CSS.

## Features

- 🎨 Beautiful, modern UI with smooth animations
- 📊 Real-time dashboard with live predictions
- 📈 Analytics and trends visualization
- 🤖 AI-powered risk analysis using Gemini API
- 📱 Fully responsive design
- ⚡ Fast development with Vite

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running on `http://localhost:8000` (or configure in `.env`)

## Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `VITE_API_URL` - Your backend API URL (default: `http://localhost:8000`)
   - `VITE_GEMINI_API_KEY` - Your Google Gemini API key (optional, for AI features)

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API and external service integrations
│   ├── context/        # React context providers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions and mock data
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

## Backend Integration

The frontend connects to the FastAPI backend at the URL specified in `VITE_API_URL`. Make sure:

1. The backend is running and accessible
2. CORS is properly configured in the backend (already added in `app/main.py`)
3. The backend endpoints match:
   - `GET /health` - Health check
   - `GET /logs?limit=50` - Fetch prediction logs
   - `POST /predict` - Make a prediction

## Features Overview

### Dashboard
- Overview of key metrics
- Real-time risk volume charts
- Risk distribution visualization

### Live Predictions
- Real-time feed of incoming predictions
- AI-powered risk analysis for high-risk orders
- Auto-refresh every 3 seconds

### Order History
- Searchable order history
- AI-generated customer service email drafts for delayed orders

### Trends & Analytics
- Carrier performance metrics
- Hourly risk volume analysis

### Settings
- Configurable risk thresholds
- Email alert configuration

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Recharts** - Chart library
- **Lucide React** - Icon library

## Development

- The app uses React Context for state management
- Mock data is available as fallback when backend is unavailable
- All API calls are centralized in `src/services/api.ts`
- Components are organized by feature/functionality

## Troubleshooting

**Frontend can't connect to backend:**
- Check that backend is running on the correct port
- Verify `VITE_API_URL` in `.env` matches your backend URL
- Check browser console for CORS errors

**Gemini AI features not working:**
- Ensure `VITE_GEMINI_API_KEY` is set in `.env`
- Verify your API key is valid
- Check network tab for API errors

## License

Same as the main project.

