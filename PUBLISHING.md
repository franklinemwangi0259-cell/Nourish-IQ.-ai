# Publishing Nourish IQ to Vercel

To get your website fully functional on Vercel, follow these steps:

## 1. Environment Variables (Required)
Your app uses the Gemini AI engine for meal scanning and chat. Since API keys are hidden for security, you must add them to Vercel:

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Open your **Nourish IQ** project.
3.  Navigate to **Settings** > **Environment Variables**.
4.  Add a new variable:
    *   **Key**: `GEMINI_API_KEY`
    *   **Value**: *[Your Gemini API Key]* (Get it from [Google AI Studio](https://aistudio.google.com/app/apikey))
5.  **Redeploy** your project (Go to the "Deployments" tab, click the three dots on the latest one, and select "Redeploy").

## 2. Firebase Authorized Domains
Google Login will only work if the new domain is authorized.

1.  Copy your Vercel URL (e.g., `https://nourish-iq-ai.vercel.app`).
2.  Go to the [Firebase Console](https://console.firebase.google.com/).
3.  Select your project.
4.  Go to **Authentication** > **Settings** > **Authorized Domains**.
5.  Click **Add Domain** and paste your Vercel URL.

## 3. PWA Installation
Your app is configured as a Progressive Web App (PWA). Users on Chrome or Safari can "Install" it to their Home Screen to use it like a native mobile app.

---
*Note: If you see a blank screen, it is likely because Step 1 (Environment Variables) has not been completed yet.*
