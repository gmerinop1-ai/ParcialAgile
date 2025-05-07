
# Prestamos Castillo

This is a Next.js application for managing loans, "Prestamos Castillo".

## Getting Started

To get started with development:

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

2.  **Set up Environment Variables:**

    This project requires Firebase and RENIEC API credentials. You'll need to create a `.env.local` file in the root of the project. Copy the example below and replace the placeholder values with your actual credentials.

    Create a file named `.env.local` in the root directory:
    ```env
    # Firebase Environment Variables
    # Replace with your actual Firebase project configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

    # RENIEC API Environment Variables
    # The API URL is a common one, update if you use a different endpoint.
    # The token is pre-filled with the one provided in the project description.
    RENIEC_API_URL=https://api.apis.net.pe/v1/dni
    RENIEC_API_TOKEN=apis-token-14827.tHVUjjIhdzV8jyO1IAQ8Yg4Yc3TJuJ87
    ```

    **Important:**
    *   Get your Firebase credentials from your [Firebase project console](https://console.firebase.google.com/).
    *   The `RENIEC_API_TOKEN` is provided as per project requirements. If you have a different token or API URL for RENIEC, update it accordingly.

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application will be available at `http://localhost:9002` by default (as per `package.json` dev script).

## Project Overview

*   **Core Features**:
    *   Secure Authentication: User authentication using Firebase Authentication.
    *   Automatic Data Retrieval: Fetch customer data from the RENIEC API.
    *   Automated Payment Schedule: Generate payment schedules for loans.
*   **Styling**: Uses ShadCN components, Tailwind CSS.
*   **GenAI**: Uses Genkit for any GenAI related functionality (if applicable).

To explore the application structure and components, take a look at `src/app/page.tsx` (which redirects to login/dashboard) and the `src/components` directory.
