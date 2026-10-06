"""
ML-Powered Recommendation Engine
Scores applicants for tasks based on skill match, rating, success rate, cost efficiency, and trust.
Can be enhanced with trained ML models for weight optimization.
"""

import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta


class RecommenderEngine:
    def __init__(self, mode='quality'):
        """
        Initialize recommender with scoring mode.
        
        Args:
            mode (str): 'quality' for quality-focused or 'cost' for cost-focused scoring
        """
        self.mode = mode
        self.weights = self._get_weights(mode)
    
    def _get_weights(self, mode):
        """Get scoring weights based on mode (can be replaced with ML model predictions)"""
        if mode == 'quality':
            return {
                'skill_match': 0.30,
                'rating': 0.25,
                'success_rate': 0.20,
                'cost': 0.05,
                'new_user': 0.10,
                'trust': 0.10
            }
        else:  # cost mode
            return {
                'skill_match': 0.20,
                'rating': 0.15,
                'success_rate': 0.15,
                'cost': 0.30,
                'new_user': 0.10,
                'trust': 0.10
            }
    
    def compute_skill_match(self, user: Dict, task: Dict) -> float:
        """
        Calculate skill match score between user and task.
        Uses fuzzy string matching for skill comparison.
        
        Args:
            user: User profile with skills
            task: Task with required subfield and category
            
        Returns:
            Skill match score between 0 and 1
        """
        if not user.get('skills') or len(user['skills']) == 0:
            return 0.0
        
        task_skills = [
            str(task.get('subfield', '')).lower(),
            str(task.get('category', '')).lower()
        ]
        task_skills = [s for s in task_skills if s]
        
        user_skills = [str(s.get('name', '')).lower() for s in user['skills']]
        
        matches = 0
        for ts in task_skills:
            for us in user_skills:
                if ts in us or us in ts:
                    matches += 1
                    break
        
        if len(task_skills) == 0:
            return 0.0
        
        return min(matches / len(task_skills), 1.0)
    
    def score_applicant(self, user: Dict, task: Dict, bid: float) -> int:
        """
        Score an applicant for a task using weighted feature combination.
        
        Args:
            user: User profile dict
            task: Task dict
            bid: Applicant's bid amount
            
        Returns:
            Score between 0-100
        """
        # Feature extraction
        skill_match = self.compute_skill_match(user, task)
        rating_score = user.get('rating', 0) / 5.0
        
        total_tasks = user.get('totalTasks', 0)
        completed_tasks = user.get('completedTasks', 0)
        success_rate = completed_tasks / total_tasks if total_tasks > 0 else 0.0
        
        budget = task.get('budget', 1)
        budget_ratio = bid / budget if budget > 0 else 1.0
        cost_score = 1.0 - min(budget_ratio, 1.0)  # Lower bid = better score
        
        new_user_bonus = 1.0 if total_tasks < 3 else 0.0
        
        trust_score = user.get('trustScore', 70) / 100.0
        
        red_marks = user.get('redMarks', 0)
        penalty_factor = max(0, 1 - red_marks * 0.2) if red_marks > 0 else 1.0
        
        # Weighted scoring (can be replaced with trained ML model)
        raw_score = (
            skill_match * self.weights['skill_match'] +
            rating_score * self.weights['rating'] +
            success_rate * self.weights['success_rate'] +
            cost_score * self.weights['cost'] +
            new_user_bonus * self.weights['new_user'] +
            trust_score * self.weights['trust']
        )
        
        final_score = raw_score * penalty_factor * 100
        return round(final_score)
    
    def score_and_rank_applicants(self, applicants: List[Dict], users: List[Dict], task: Dict) -> List[Dict]:
        """
        Score all applicants and return ranked list.
        
        Args:
            applicants: List of applicant dicts with userId and bid
            users: List of all user profiles
            task: Task dict
            
        Returns:
            Sorted list of applicants with scores
        """
        user_map = {u['id']: u for u in users}
        scored_applicants = []
        
        for applicant in applicants:
            user = user_map.get(applicant['userId'])
            if not user:
                scored_applicants.append({**applicant, 'score': 0})
                continue
            
            score = self.score_applicant(user, task, applicant.get('bid', 0))
            scored_applicants.append({**applicant, 'score': score})
        
        # Sort by score descending
        scored_applicants.sort(key=lambda x: x['score'], reverse=True)
        return scored_applicants
    
    def compute_deadline_factor(self, deadline_timestamp: int) -> float:
        """Calculate urgency factor based on deadline proximity"""
        now = datetime.now().timestamp() * 1000  # Convert to milliseconds
        remaining_ms = deadline_timestamp - now
        days = remaining_ms / (86400 * 1000)
        
        if days < 1:
            return 1.0
        elif days < 3:
            return 0.8
        elif days < 7:
            return 0.5
        return 0.2
    
    def recommend_tasks_for_user(self, user: Dict, tasks: List[Dict]) -> List[Dict]:
        """
        Recommend tasks for a user based on skill match and urgency.
        
        Args:
            user: User profile
            tasks: List of all tasks
            
        Returns:
            Sorted list of recommended tasks with scores
        """
        open_tasks = [
            t for t in tasks 
            if t.get('status') == 'open' and t.get('creatorId') != user['id']
        ]
        
        recommended = []
        for task in open_tasks:
            skill_match = self.compute_skill_match(user, task)
            urgency_bonus = 0.15 if task.get('urgent') else 0.0
            deadline_factor = self.compute_deadline_factor(task.get('deadline', 0))
            
            score = skill_match * 0.6 + urgency_bonus + deadline_factor * 0.1
            recommend_score = round(score * 100)
            
            recommended.append({**task, 'recommendScore': recommend_score})
        
        recommended.sort(key=lambda x: x['recommendScore'], reverse=True)
        return recommended


# ML Enhancement placeholder - can be implemented with scikit-learn
class MLRecommender(RecommenderEngine):
    """
    Enhanced version that can learn optimal weights from historical data.
    Placeholder for future ML model integration (Random Forest, Gradient Boosting, Neural Network)
    """
    
    def __init__(self, mode='quality', model=None):
        super().__init__(mode)
        self.model = model  # Placeholder for trained model
    
    def train_from_history(self, historical_data):
        """
        Train ML model on historical task assignments and outcomes.
        
        Expected historical_data format:
        [
            {
                'user_features': {...},
                'task_features': {...},
                'bid': float,
                'was_selected': bool,
                'task_completed': bool,
                'rating_received': float
            },
            ...
        ]
        """
        # TODO: Implement with scikit-learn or PyTorch
        # Example: RandomForestRegressor, XGBoost, or Neural Network
        pass
    
    def predict_score(self, user, task, bid):
        """Use trained model for predictions instead of hardcoded weights"""
        if self.model is None:
            # Fallback to rule-based scoring
            return self.score_applicant(user, task, bid)
        
        # TODO: Extract features and use model.predict()
        pass
