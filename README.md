# Real-Time ISS & News Dashboard

A Vite React dashboard for the Q1 assignment. It tracks the ISS, displays news with caching and filtering, renders interactive charts, and includes a Hugging Face powered chatbot constrained to dashboard data.

## Features

- Live ISS position refresh every 15 seconds
- Leaflet map with custom ISS marker and last 15 positions as trajectory
- Haversine speed calculation with last 30 measurements charted
- People in space count and available astronaut names
- News dashboard with 10 articles across Space and Science categories
- 15-minute localStorage news cache, search, sort, category refresh, and error fallback
- Interactive news distribution doughnut chart
- Dark and light mode stored in localStorage
- Floating chatbot using `mistralai/Mistral-7B-Instruct-v0.2`

## Environment Variables

Create a local `.env` file from `.env.example`:

```bash
VITE_NEWS_API_KEY=your_eventregistry_or_news_api_key_here
VITE_AI_TOKEN=your_huggingface_token_here
```

Do not commit `.env`. Add these variables in the Vercel dashboard before deployment.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Assignment Answer

**Which LLM model did you use in this application, and why?**

I used `mistralai/Mistral-7B-Instruct-v0.2` through Hugging Face because it is an instruction-tuned model that can follow a strict system prompt. In this app, the prompt provides only the current dashboard data, so the chatbot can answer questions about ISS location, speed, astronauts, and displayed news without relying on outside knowledge or guessing.
