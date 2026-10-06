# GigHub - Student Micro-Gig Platform

A modern platform connecting students for micro-tasks and freelance work. Built with React, Vite, and optional Python ML backend for intelligent recommendations.

## Features

-  **Smart Task Matching**: ML-powered recommendation system
-  **Trust & Reputation**: Transparent scoring and penalty management
-  **Real-time Deadlines**: Live countdown timers for tasks
-  **Fair Payments**: Clear cancellation policies and 10% platform fee
-  **Portfolio Building**: Automatic portfolio generation from completed tasks
-  **Student-Focused**: Designed for flexible schedules around lectures

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Lucide Icons** - Icon library
- **Custom CSS** - Orange/red/black/white theme

### Backend (Optional ML Enhancement)
- **Python 3.11+** - ML backend language
- **FastAPI** - Modern Python web framework
- **NumPy** - Numerical computing
- **Scikit-learn** - ML model training (future)

## Quick Start

### Frontend Only

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5174`

### With Python ML Backend

1. **Start Frontend:**
```bash
npm install
npm run dev
```

2. **Start ML Backend (separate terminal):**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:8000`

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed setup.

## Project Structure

```
GigHub-main/
 src/
    components/       # React components
    pages/           # Page components
    context/         # React Context providers
    utils/           # Helper functions & ML client
    data/            # Seed data & categories
 backend/             # Python ML backend (optional)
    app.py          # FastAPI server
    recommender_engine.py  # ML recommendation logic
    trust_engine.py        # Trust scoring system
    README.md              # Backend documentation
 public/              # Static assets
 index.html          # Entry HTML
```

## Development

### Frontend Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Scripts

```bash
cd backend
python test_backend.py    # Test backend functionality
python app.py            # Start API server
uvicorn app:app --reload # Start with auto-reload
```

## Features in Detail

### ML-Powered Recommendations

The recommender system scores applicants based on:
- **Skill Match** (30%): Fuzzy matching with task requirements
- **Rating Score** (25%): Historical performance
- **Success Rate** (20%): Completed vs total tasks
- **Cost Efficiency** (5-30%): Bid competitiveness
- **New User Bonus** (10%): Fair chance for beginners
- **Trust Score** (10%): Platform reputation

Modes:
- `quality`: Prioritizes skill match and ratings
- `cost`: Prioritizes competitive pricing

### Trust & Penalty System

- Base trust score: 70 points
- Success bonus: Up to +25 points
- Penalties: -5 per failure
- Red marks: -10 per mark (every 3 penalties)
- Progressive bans: 2, 4, 8, 16, 32 days

### Task Flow

1. **Client posts task** with budget, deadline, requirements
2. **Workers apply** with bid and commitment level
3. **ML ranks applicants** by suitability score
4. **Client selects worker** from ranked list
5. **Worker completes** and submits updates
6. **Client approves** and rates worker
7. **Payment released** (90% to worker, 10% platform fee)

## API Integration

### Using ML Backend

Replace JavaScript recommender with ML backend:

```javascript
// Before
import { scoreAndRankApplicants } from '../utils/recommender';

// After
import { scoreAndRankApplicants } from '../utils/mlBackendClient';
```

The API remains identical - backend handles the ML processing!

### API Endpoints

- `POST /api/recommender/rank-applicants` - Score and rank applicants
- `POST /api/recommender/recommend-tasks` - Get task recommendations
- `POST /api/trust/compute-score` - Calculate trust score
- `POST /api/trust/handle-failure` - Process task failure

Full documentation: `http://localhost:8000/docs`

## Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Backend (Docker)

```bash
cd backend
docker build -t gighub-backend .
docker run -p 8000:8000 gighub-backend
```

## Future Enhancements

### Phase 1: Current 
- React frontend with localStorage
- Python ML backend with same logic
- REST API integration ready

### Phase 2: Database
- MongoDB integration for persistent storage
- User authentication with JWT
- Real-time updates with WebSockets

### Phase 3: ML Training
- Collect historical data (selections, completions, ratings)
- Train Random Forest / XGBoost models
- Replace hardcoded weights with learned parameters
- A/B test ML vs rule-based recommendations

### Phase 4: Advanced Features
- Neural network for complex patterns
- Real-time model updates
- Personalized recommendations per user
- Auto-balancing of platform metrics

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is a prototype for educational purposes.

## Support

- Frontend issues: Check browser console
- Backend issues: Run `python backend/test_backend.py`
- Integration: See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- API docs: Visit `http://localhost:8000/docs`

---

Built for students, by students 
