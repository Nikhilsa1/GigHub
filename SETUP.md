# GigHub - Full Stack Setup

## Project Structure

```
.
├── src/                    # React Frontend (Vite)
├── server/                 # Express Backend
│   ├── config/            # Database configuration
│   ├── models/            # MongoDB schemas
│   ├── controllers/       # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   └── server.js          # Express server entry point
├── .env                   # Environment variables
└── package.json           # Dependencies
```

## Prerequisites

- Node.js (v16+)
- MongoDB running locally on `mongodb://localhost:27017`
- npm or yarn

## Installation

```bash
# Install all dependencies
npm install
```

## Environment Setup

The `.env` file has been created with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/code
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

**Important**: Update `JWT_SECRET` with a strong random key in production.

## Running the Application

### Frontend (React + Vite)
```bash
npm run dev
# Runs on http://localhost:5174
```

### Backend (Express + MongoDB)
```bash
npm run server
# Runs on http://localhost:5000
```

### Run Both Simultaneously
Open two terminals:
- Terminal 1: `npm run dev` (Frontend)
- Terminal 2: `npm run server` (Backend)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task (requires auth)
- `PUT /api/tasks/:id` - Update task (requires auth)
- `POST /api/tasks/:id/assign` - Assign task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

## MongoDB Setup

Make sure MongoDB is running:

```bash
# On Windows (if installed locally)
mongod

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

## Starting MongoDB

If you don't have MongoDB installed, you can:

1. **Download MongoDB Community Edition**: https://www.mongodb.com/try/download/community
2. **Use Docker**:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```
3. **Use MongoDB Atlas** (Cloud): Update `MONGODB_URI` in `.env`

## Development

- Frontend development server with hot reload
- Backend auto-restart on file changes (if using nodemon)
- CORS enabled for frontend-backend communication
- JWT authentication for secure endpoints
- Password hashing with bcryptjs

## Testing

Once both servers are running:

- Frontend: http://localhost:5174
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Build

```bash
npm run build
# Creates optimized build in dist/
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection URI in `.env`
- Verify no firewall blocks port 27017

### Port Already in Use
- Frontend tries 5173, then 5174
- Change backend PORT in `.env` if 5000 is taken

### CORS Errors
- Ensure CORS is enabled in server
- Frontend URL should be accessible from backend

---

**Happy coding! 🚀**
