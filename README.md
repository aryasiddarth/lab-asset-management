Lab Asset Management System (MERN + Docker)

A full-stack system to manage university computer lab assets.
Includes authentication, lab management, asset management, and Excel import/export.
Temporary README for development use.

## Running with Docker

### Prerequisites
- Docker and Docker Compose installed.

### Build and start all services
From the project root (`lab-asset-management`):

```bash
docker compose up --build
```

This will start:
- `mongo` on `27017` (internal and exposed to host)
- `backend` on `http://localhost:5000` (API under `/api`)
- `frontend` on `http://localhost:3000`

### Environment configuration
The backend container uses these environment variables (set in `docker-compose.yml`):
- `PORT=5000`
- `MONGODB_URI=mongodb://mongo:27017/lab-asset-management`
- `JWT_SECRET` (change this to a strong value in production)
- `NODE_ENV=production`

The frontend image is built with:
- `VITE_API_BASE_URL=http://backend:5000/api` (Docker internal URL for the backend)

If you want to override these for a different deployment, you can edit `docker-compose.yml` or pass different build args/env vars.
