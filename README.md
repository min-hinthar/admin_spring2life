<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1k-i4rU-Ud_ssAt3Pi5Td9eI8wMTALYdD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
3. Add your Supabase credentials to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://nfbpqvzcwjtsvxiopznu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYnBxdnpjd2p0c3Z4aW9wem51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzIwMDgsImV4cCI6MjA3OTEwODAwOH0.ucMNNYzojBJ9Tm9QQUPAtdqKmluPyODrhzLClDI7zis
   ```
4. Run the app:
   `npm run dev`

## Supabase schema

Use the SQL in [`supabase_schema.sql`](./supabase_schema.sql) to provision profiles, availability, and appointment tables with row-level security suitable for the app. Apply it in the Supabase SQL editor before running locally.
