"""
FastAPI Backend Server for GigHub
Provides ML-powered recommendation and trust scoring APIs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from recommender_engine import RecommenderEngine, MLRecommender
from trust_engine import TrustEngine

app = FastAPI(
    title="GigHub ML Backend",
    description="ML-powered recommendation and trust scoring for student micro-gig platform",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
quality_recommender = RecommenderEngine(mode='quality')
cost_recommender = RecommenderEngine(mode='cost')
trust_engine = TrustEngine()


# Request/Response Models
class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    skills: List[Dict[str, Any]]
    rating: float = 0
    totalTasks: int = 0
    completedTasks: int = 0
    failedTasks: int = 0
    trustScore: int = 70
    penalties: int = 0
    redMarks: int = 0
    bannedUntil: Optional[int] = None


class Task(BaseModel):
    id: str
    title: str
    category: str
    subfield: str
    budget: float
    deadline: int
    status: str
    creatorId: str
    urgent: bool = False


class Applicant(BaseModel):
    userId: str
    bid: float
    commitment: str
    message: str
    appliedAt: int


class ScoreApplicantRequest(BaseModel):
    user: Dict[str, Any]
    task: Dict[str, Any]
    bid: float
    mode: str = 'quality'


class RankApplicantsRequest(BaseModel):
    applicants: List[Dict[str, Any]]
    users: List[Dict[str, Any]]
    task: Dict[str, Any]
    mode: str = 'quality'


class RecommendTasksRequest(BaseModel):
    user: Dict[str, Any]
    tasks: List[Dict[str, Any]]


class TrustScoreRequest(BaseModel):
    user: Dict[str, Any]


class TaskFailureRequest(BaseModel):
    user: Dict[str, Any]


class CancellationPolicyRequest(BaseModel):
    task: Dict[str, Any]
    cancelledBy: str


# API Endpoints
@app.get("/")
def root():
    return {
        "service": "GigHub ML Backend",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/api/recommender/score-applicant")
def score_applicant(request: ScoreApplicantRequest):
    """
    Score a single applicant for a task.
    
    Returns applicant score (0-100)
    """
    try:
        recommender = quality_recommender if request.mode == 'quality' else cost_recommender
        score = recommender.score_applicant(request.user, request.task, request.bid)
        return {"score": score}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/recommender/rank-applicants")
def rank_applicants(request: RankApplicantsRequest):
    """
    Score and rank all applicants for a task.
    
    Returns sorted list of applicants with scores
    """
    try:
        recommender = quality_recommender if request.mode == 'quality' else cost_recommender
        ranked = recommender.score_and_rank_applicants(
            request.applicants,
            request.users,
            request.task
        )
        return {"applicants": ranked}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/recommender/recommend-tasks")
def recommend_tasks(request: RecommendTasksRequest):
    """
    Recommend tasks for a user based on skills and preferences.
    
    Returns sorted list of recommended tasks with scores
    """
    try:
        recommended = quality_recommender.recommend_tasks_for_user(
            request.user,
            request.tasks
        )
        return {"tasks": recommended}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/trust/compute-score")
def compute_trust_score(request: TrustScoreRequest):
    """
    Calculate trust score for a user.
    
    Returns trust score (0-100) and label
    """
    try:
        score = trust_engine.compute_trust_score(request.user)
        label_info = trust_engine.get_trust_label(score)
        return {
            "score": score,
            "label": label_info['label'],
            "color": label_info['color']
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/trust/handle-failure")
def handle_task_failure(request: TaskFailureRequest):
    """
    Process task failure and update user penalties/bans.
    
    Returns updated user profile
    """
    try:
        updated_user = trust_engine.handle_task_failure(request.user)
        return {"user": updated_user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/trust/check-ban")
def check_ban_status(request: TrustScoreRequest):
    """
    Check if user is banned and get remaining time.
    
    Returns ban status and time remaining
    """
    try:
        is_banned = trust_engine.is_user_banned(request.user)
        time_remaining = trust_engine.get_ban_time_remaining(request.user) if is_banned else None
        return {
            "isBanned": is_banned,
            "timeRemaining": time_remaining
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/trust/cancellation-policy")
def get_cancellation_policy(request: CancellationPolicyRequest):
    """
    Get payment split for task cancellation.
    
    Returns worker payment, client refund, and message
    """
    try:
        policy = trust_engine.get_cancellation_policy(request.task, request.cancelledBy)
        return policy
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "GigHub ML Backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
