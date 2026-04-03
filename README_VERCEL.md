# Deploying to Vercel

This project is now configured for deployment on Vercel.

### Steps to Deploy:

1.  **Push to GitHub**: Connect your GitHub repository to Vercel.
2.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  **Environment Variables**:
    Set the following variables in the Vercel Dashboard (**Settings > Environment Variables**):
    *   `EMAIL_USER`: Your full Gmail address (e.g., `muhammedsinanu8590@gmail.com`).
    *   `EMAIL_PASS`: Your 16-character Gmail App Password (no spaces).
    *   `RECEIVER_EMAIL`: The email address where you want to receive booking requests.
    *   `GEMINI_API_KEY`: Your Gemini API key (if using AI features).
    *   `FIREBASE_CONFIG`: (Optional) If you want to use a specific Firebase config.

### Project Structure for Vercel:

*   `api/index.ts`: Handles all `/api/*` requests as Vercel Serverless Functions.
*   `vercel.json`: Handles routing and rewrites for the Single Page Application (SPA).
*   `dist/`: Contains the compiled frontend assets after `npm run build`.

### Local Development:

Continue using `npm run dev` to start the local development server (Express + Vite).
