"""
Simple test script to verify backend functionality
Run: python test_backend.py
"""

from recommender_engine import RecommenderEngine
from trust_engine import TrustEngine

# Sample data
user = {
    'id': 'u1',
    'name': 'Test User',
    'skills': [
        {'name': 'Python', 'rating': 4.5},
        {'name': 'Web Dev', 'rating': 4.0}
    ],
    'rating': 4.5,
    'totalTasks': 10,
    'completedTasks': 9,
    'failedTasks': 1,
    'trustScore': 85,
    'penalties': 1,
    'redMarks': 0
}

task = {
    'id': 't1',
    'title': 'Build a Flask API',
    'category': 'coding',
    'subfield': 'Web Dev',
    'budget': 1000,
    'deadline': 1740000000000,  # Future timestamp
    'status': 'open',
    'urgent': True
}

applicant1 = {
    'userId': 'u1',
    'bid': 900,
    'commitment': 'full'
}

applicant2 = {
    'userId': 'u2',
    'bid': 800,
    'commitment': 'partial'
}

user2 = {
    'id': 'u2',
    'name': 'Test User 2',
    'skills': [
        {'name': 'JavaScript', 'rating': 3.5}
    ],
    'rating': 3.8,
    'totalTasks': 5,
    'completedTasks': 4,
    'failedTasks': 1,
    'trustScore': 75,
    'penalties': 0,
    'redMarks': 0
}

print("=" * 60)
print("GigHub ML Backend Test")
print("=" * 60)

# Test Recommender Engine
print("\n1. Testing Recommender Engine")
print("-" * 60)

recommender = RecommenderEngine(mode='quality')

# Test single applicant scoring
score = recommender.score_applicant(user, task, 900)
print(f"✓ Score for User 1 (bid $900): {score}/100")

# Test ranking applicants
applicants = [applicant1, applicant2]
users = [user, user2]
ranked = recommender.score_and_rank_applicants(applicants, users, task)
print(f"✓ Ranked applicants:")
for i, app in enumerate(ranked, 1):
    print(f"  {i}. User {app['userId']}: Score {app['score']}, Bid ${app['bid']}")

# Test task recommendations
tasks = [task]
recommended = recommender.recommend_tasks_for_user(user, tasks)
print(f"✓ Recommended {len(recommended)} task(s) for user")
if recommended:
    print(f"  Top recommendation: '{recommended[0]['title']}' (Score: {recommended[0]['recommendScore']})")

# Test Trust Engine
print("\n2. Testing Trust Engine")
print("-" * 60)

trust_engine = TrustEngine()

# Compute trust score
trust_score = trust_engine.compute_trust_score(user)
print(f"✓ Trust score for user: {trust_score}/100")

trust_label = trust_engine.get_trust_label(trust_score)
print(f"✓ Trust label: {trust_label['label']} ({trust_label['color']})")

# Test ban check
is_banned = trust_engine.is_user_banned(user)
print(f"✓ User banned: {is_banned}")

# Test task failure handling
print("\n3. Testing Task Failure Handling")
print("-" * 60)
test_user = user.copy()
print(f"Before failure: Penalties={test_user.get('penalties', 0)}, Red Marks={test_user.get('redMarks', 0)}")
updated_user = trust_engine.handle_task_failure(test_user)
print(f"After failure:  Penalties={updated_user['penalties']}, Red Marks={updated_user['redMarks']}")
print(f"✓ Trust score updated: {test_user['trustScore']} → {updated_user['trustScore']}")

# Test cancellation policy
print("\n4. Testing Cancellation Policy")
print("-" * 60)
policy_client = trust_engine.get_cancellation_policy(task, 'client')
print(f"✓ Client cancellation: Worker gets ${policy_client.get('workerGets', 0)}")

policy_worker = trust_engine.get_cancellation_policy(task, 'worker')
print(f"✓ Worker cancellation: Client refund ${policy_worker['clientRefund']}")

print("\n" + "=" * 60)
print("All tests passed! ✓")
print("=" * 60)
print("\nBackend is ready to use!")
print("Run 'python app.py' to start the API server")
