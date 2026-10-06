# Integration Guide: Python ML Backend with React Frontend

## Overview

This guide shows how to integrate the Python ML backend with your existing React frontend. The Python backend provides the same functionality as the JavaScript recommender but with ML capabilities.

## Setup Steps

### 1. Install Python Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Test Backend Functionality

```bash
python test_backend.py
```

Expected output:
```
============================================================
GigHub ML Backend Test
============================================================
...
All tests passed! ✓
============================================================
```

### 3. Start the Backend Server

In a separate terminal:
```bash
cd backend
python app.py
```

Server will be available at `http://localhost:8000`

Verify it's running:
```bash
curl http://localhost:8000/health
```

### 4. Start Frontend (Existing)

```bash
npm run dev
```

Frontend will be available at `http://localhost:5174/`

## Integration Options

### Option A: Use ML Backend (Recommended)

Replace imports in your React components:

**Before:**
```javascript
import { scoreAndRankApplicants } from '../utils/recommender';
import { computeTrustScore } from '../utils/trustEngine';
```

**After:**
```javascript
import { scoreAndRankApplicants } from '../utils/mlBackendClient';
import { computeTrustScore } from '../utils/mlBackendClient';
```

The API remains the same, but calls are now made to the Python ML backend!

### Option B: Hybrid Approach

Use ML backend with fallback to JavaScript:

```javascript
import * as MLBackend from '../utils/mlBackendClient';
import * as JSRecommender from '../utils/recommender';

// ML backend with fallback
const ranked = await MLBackend.scoreAndRankApplicants(applicants, users, task, mode)
    .catch(() => JSRecommender.scoreAndRankApplicants(applicants, users, task, mode));
```

### Option C: Feature Flag

Use environment variable to toggle:

```javascript
// .env.local
VITE_USE_ML_BACKEND=true
```

```javascript
// In your code
const recommender = import.meta.env.VITE_USE_ML_BACKEND 
    ? await import('../utils/mlBackendClient')
    : await import('../utils/recommender');

const ranked = await recommender.scoreAndRankApplicants(applicants, users, task, mode);
```

## Component Updates

### Example: TaskDetail Component

**Before:**
```javascript
import { scoreAndRankApplicants } from '../utils/recommender';

function TaskDetail() {
    // ... existing code ...
    
    const rankedApplicants = useMemo(() => {
        return scoreAndRankApplicants(task.applicants, allUsers, task, sortMode);
    }, [task, allUsers, sortMode]);
    
    // ... rest of component ...
}
```

**After:**
```javascript
import { scoreAndRankApplicants } from '../utils/mlBackendClient';
import { useState, useEffect } from 'react';

function TaskDetail() {
    const [rankedApplicants, setRankedApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function rankApplicants() {
            setLoading(true);
            const ranked = await scoreAndRankApplicants(
                task.applicants, 
                allUsers, 
                task, 
                sortMode
            );
            setRankedApplicants(ranked);
            setLoading(false);
        }
        rankApplicants();
    }, [task, allUsers, sortMode]);
    
    if (loading) return <div>Loading recommendations...</div>;
    
    // ... rest of component ...
}
```

### Example: Dashboard Component

**Before:**
```javascript
import { recommendTasksForUser } from '../utils/recommender';

const recommended = useMemo(() => 
    recommendTasksForUser(currentUser, allTasks),
    [currentUser, allTasks]
);
```

**After:**
```javascript
import { recommendTasksForUser } from '../utils/mlBackendClient';
import { useState, useEffect } from 'react';

const [recommended, setRecommended] = useState([]);

useEffect(() => {
    async function getRecommendations() {
        const tasks = await recommendTasksForUser(currentUser, allTasks);
        setRecommended(tasks);
    }
    getRecommendations();
}, [currentUser, allTasks]);
```

## Testing the Integration

### 1. Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected:
```json
{"status": "healthy", "service": "GigHub ML Backend"}
```

### 2. Test Ranking Endpoint

```bash
curl -X POST http://localhost:8000/api/recommender/rank-applicants \
  -H "Content-Type: application/json" \
  -d '{
    "applicants": [{"userId": "u1", "bid": 750}],
    "users": [{"id": "u1", "skills": [{"name": "Python"}], "rating": 4.5, "totalTasks": 10, "completedTasks": 9, "trustScore": 85}],
    "task": {"category": "coding", "subfield": "Python", "budget": 1000},
    "mode": "quality"
  }'
```

### 3. Test in Browser

1. Open browser dev tools (F12)
2. Go to Network tab
3. Navigate to a task with applicants
4. Look for POST requests to `http://localhost:8000/api/recommender/rank-applicants`
5. Check response shows scored applicants

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI)

## Performance Comparison

| Metric | JavaScript (Local) | Python ML Backend |
|--------|-------------------|-------------------|
| Response Time | < 1ms | 10-50ms |
| Scalability | Limited to browser | Horizontal scaling |
| ML Capabilities | None | Full scikit-learn/TensorFlow |
| Caching | Manual | Redis/memcached ready |
| Data Collection | Difficult | Easy (structured logs) |

## Troubleshooting

### Backend not responding

```bash
# Check if server is running
curl http://localhost:8000/health

# Check logs
python app.py  # Should show uvicorn startup logs
```

### CORS errors

Make sure backend CORS is configured correctly in `app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Import errors in frontend

TypeScript/ESLint may complain about new imports. Add to `eslint.config.js`:

```javascript
rules: {
  'no-unused-vars': ['error', { varsIgnorePattern: '^(ML|recommender)' }],
}
```

## Next Steps

### Phase 1: Basic Integration (Current)
- ✅ Python backend with same logic as JavaScript
- ✅ REST API endpoints
- ✅ Frontend integration helper

### Phase 2: Data Collection
- [ ] Log all API calls to database
- [ ] Track which applicants get selected
- [ ] Record task completion outcomes
- [ ] Store user ratings and feedback

### Phase 3: ML Model Training
- [ ] Prepare training dataset from logs
- [ ] Train Random Forest or XGBoost model
- [ ] Compare model performance vs rule-based
- [ ] A/B test ML vs rules

### Phase 4: Advanced ML
- [ ] Neural network for complex patterns
- [ ] Real-time model updates
- [ ] Personalized recommendations per user
- [ ] Auto-tuning of weights based on platform metrics

## FAQ

**Q: Do I need to use the Python backend?**
A: No, the JavaScript version still works. Python backend is optional for ML capabilities.

**Q: What if the backend is down?**
A: The `mlBackendClient.js` has fallback to JavaScript recommender automatically.

**Q: How do I deploy this in production?**
A: Use Docker for backend, deploy to AWS/GCP/Azure. Frontend stays on Vercel/Netlify.

**Q: Can I train custom ML models?**
A: Yes! See `MLRecommender` class in `recommender_engine.py` for hooks to integrate trained models.

## Support

For issues or questions:
1. Check the API docs at `http://localhost:8000/docs`
2. Run `python test_backend.py` to verify backend works
3. Check browser console for frontend errors
4. Review backend logs for API errors
