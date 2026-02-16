# AI Tutor App

A full-stack AI-powered personal assistant web app with authentication, subject modes, chat memory, voice input, text-to-speech, and a dashboard.

## Folder Structure

```
ai-tutor-app/
├── middleware/
│   └── auth.js
├── models/
│   ├── ChatMessage.js
│   └── User.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── routes/
│   ├── auth.js
│   ├── chat.js
│   └── dashboard.js
├── .env.example
├── package.json
├── server.js
└── README.md
```

## Features

- **ChatGPT-like interface** with dark mode and responsive layout.
- **Subject mode toggle**: General, Math, Science, Creative Writing.
- **AI tutoring behavior** tailored for ages 13-16.
- **Typing animation** + loading indicator.
- **Conversation memory**: includes the most recent 5 messages in context.
- **JWT authentication**: register/login/logout.
- **MongoDB persistence** for user accounts and chat history.
- **Dashboard stats** with question count and total messages.
- **Voice input** using Web Speech API.
- **Text-to-speech** responses via browser speech synthesis.
- **Error handling** for backend/API failures.

## Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Create environment file**

```bash
cp .env.example .env
```

3. **Fill in `.env` values**

- `MONGODB_URI`: your MongoDB connection string.
- `JWT_SECRET`: strong random secret.
- `OPENAI_API_KEY`: your OpenAI API key.
- `OPENAI_MODEL` (optional): defaults to `gpt-4o-mini`.

4. **Run the app**

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/chat` (protected)
- `GET /api/history` (protected)
- `GET /api/dashboard/stats` (protected)
- `GET /health`

## Deployment

### Deploy on Render

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from your repo.
3. Set build command:

```bash
npm install
```

4. Set start command:

```bash
npm start
```

5. Add environment variables in Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`

### Deploy on Vercel

For best reliability, deploy backend + DB-aware service on Render/Railway. If using Vercel:

1. Add a `vercel.json` that routes API requests to Node server entrypoints.
2. Configure all environment variables in Vercel project settings.
3. Ensure MongoDB uses network access rules that allow Vercel.

> Note: This app is designed as a persistent Node/Express service, which fits Render well.
