# StudentPath API

Express/Mongoose backend for StudentPath.

## Start locally

1. Copy `.env.example` to `.env`.
2. Fill in MongoDB, JWT, email, Google OAuth, and optional Gemini credentials.
3. Run `npm install`.
4. Run `npm run dev` for development or `npm start` for production.

## API base

Local: `http://localhost:5000/api`

Production: configure `VITE_API_URL` in the frontend to the deployed backend URL ending in `/api`.

## Main route groups

- `/api/auth`
- `/api/student`
- `/api/careers`
- `/api/jobs`
- `/api/applications`
- `/api/saved-jobs`
- `/api/action-tasks`
- `/api/company`
- `/api/company/jobs`
- `/api/admin`

## Deployment

`render.yaml` contains a Render web-service definition. Secret values are intentionally marked `sync: false` and must be supplied in Render.
