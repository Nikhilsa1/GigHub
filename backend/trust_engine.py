"""
Trust & Penalty Engine
Manages trust scores, failed task tracking, red marks, and bans.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple


BAN_DURATIONS = [2, 4, 8, 16, 32]  # days


class TrustEngine:
    
    @staticmethod
    def compute_trust_score(user: Dict) -> int:
        """
        Calculate trust score based on user's task history and behavior.
        
        Args:
            user: User profile dict
            
        Returns:
            Trust score between 0-100
        """
        base_score = 70
        
        # Success rate bonus
        total_tasks = user.get('totalTasks', 0)
        completed_tasks = user.get('completedTasks', 0)
        success_bonus = (completed_tasks / total_tasks) * 25 if total_tasks > 0 else 0
        
        # Penalties
        penalty_deduction = user.get('penalties', 0) * 5
        red_mark_deduction = user.get('redMarks', 0) * 10
        
        # Rating bonus
        rating = user.get('rating', 0)
        rating_bonus = ((rating - 3) / 2) * 10 if rating > 0 else 0
        
        score = base_score + success_bonus - penalty_deduction - red_mark_deduction + rating_bonus
        return max(0, min(100, round(score)))
    
    @staticmethod
    def handle_task_failure(user: Dict) -> Dict:
        """
        Update user profile after task failure. Apply penalties and bans.
        
        Args:
            user: User profile dict
            
        Returns:
            Updated user dict with new penalties/bans
        """
        updated_user = user.copy()
        updated_user['failedTasks'] = updated_user.get('failedTasks', 0) + 1
        updated_user['penalties'] = updated_user.get('penalties', 0) + 1
        
        # Red mark after every 3 penalties
        if updated_user['penalties'] % 3 == 0:
            updated_user['redMarks'] = updated_user.get('redMarks', 0) + 1
            
            # Progressive ban duration
            red_marks = updated_user['redMarks']
            ban_index = min(red_marks - 1, len(BAN_DURATIONS) - 1)
            ban_days = BAN_DURATIONS[ban_index]
            
            ban_until_ts = datetime.now() + timedelta(days=ban_days)
            updated_user['bannedUntil'] = int(ban_until_ts.timestamp() * 1000)  # milliseconds
        
        updated_user['trustScore'] = TrustEngine.compute_trust_score(updated_user)
        return updated_user
    
    @staticmethod
    def is_user_banned(user: Dict) -> bool:
        """Check if user is currently banned"""
        banned_until = user.get('bannedUntil')
        if not banned_until:
            return False
        return banned_until > int(datetime.now().timestamp() * 1000)
    
    @staticmethod
    def get_ban_time_remaining(user: Dict) -> Optional[str]:
        """Get human-readable ban time remaining"""
        banned_until = user.get('bannedUntil')
        if not banned_until:
            return None
        
        now_ms = int(datetime.now().timestamp() * 1000)
        if banned_until <= now_ms:
            return None
        
        remaining_ms = banned_until - now_ms
        hours = remaining_ms // (3600 * 1000)
        days = hours // 24
        
        if days > 0:
            return f"{days} day{'s' if days != 1 else ''}"
        return f"{hours} hour{'s' if hours != 1 else ''}"
    
    @staticmethod
    def get_trust_label(score: int) -> Dict[str, str]:
        """Get trust label and color based on score"""
        if score >= 90:
            return {'label': 'Excellent', 'color': '#ff6b35'}
        elif score >= 75:
            return {'label': 'Good', 'color': '#ff8c61'}
        elif score >= 60:
            return {'label': 'Fair', 'color': '#f59e0b'}
        elif score >= 40:
            return {'label': 'Poor', 'color': '#f97316'}
        else:
            return {'label': 'Critical', 'color': '#ef4444'}
    
    @staticmethod
    def get_cancellation_policy(task: Dict, cancelled_by: str) -> Dict:
        """
        Calculate payment split based on cancellation policy.
        
        Args:
            task: Task dict
            cancelled_by: 'client' or 'worker'
            
        Returns:
            Dict with payment amounts and message
        """
        is_completed = task.get('completedAt') and task.get('approved')
        budget = task.get('budget', 0)
        
        if cancelled_by == 'client' and is_completed:
            return {
                'workerGets': round(budget * 0.45),  # 50% minus 10% platform fee
                'clientRefund': 0,
                'message': 'Worker receives 50% payment as task was already completed.'
            }
        
        if cancelled_by == 'worker':
            return {
                'workerGets': 0,
                'clientRefund': round(budget * 0.9),
                'message': 'Worker forfeits payment. Client refunded 90% (10% platform fee retained).'
            }
        
        # Midway cancellation
        return {
            'workerGets': None,
            'clientRefund': None,
            'message': 'Midway cancellation — admin will review contribution and decide on payment split.',
            'requiresAdminReview': True
        }
    
    @staticmethod
    def compute_new_rating(current_rating: float, current_total: int, new_rating: float) -> float:
        """Calculate new average rating after receiving a new rating"""
        if current_total == 0:
            return new_rating
        
        new_avg = (current_rating * current_total + new_rating) / (current_total + 1)
        return round(new_avg * 10) / 10
