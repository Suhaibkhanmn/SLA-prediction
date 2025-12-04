# Quick Start Guide

## 1. Install Dependencies

```bash
cd frontend
npm install
```

## 2. Set Up Environment

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** The Gemini API key is optional. The app will work without it, but AI features (risk analysis, email drafting) won't function.

## 3. Start Backend (if not running)

In the project root:

```bash
uvicorn app.main:app --reload
```

## 4. Start Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 5. Access the Application

1. You'll see the landing page
2. Click "Sign In" or "Get Started"
3. Use any email (demo mode)
4. Explore the dashboard!

## Features to Try

- **Dashboard**: View real-time metrics and charts
- **Live Predictions**: See incoming predictions in real-time
- **Order History**: Browse past orders and generate AI email drafts
- **Trends**: Analyze carrier performance
- **Settings**: Configure alert thresholds

## Troubleshooting

**Port 3000 already in use?**
- Vite will automatically use the next available port
- Check the terminal output for the actual URL

**Can't connect to backend?**
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- The app will use mock data if backend is unavailable

**AI features not working?**
- Add your Gemini API key to `.env`
- Get a key from: https://makersuite.google.com/app/apikey

