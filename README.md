<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a14efc71-3149-4e92-8031-b7107f79a063

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy On Render

This project runs as a Node web service (Express + Vite build output).

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will detect `render.yaml` and create the service automatically.
4. Set `GEMINI_API_KEY` in Render environment variables before first start.
5. Deploy.

Render uses:
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check: `/health`
