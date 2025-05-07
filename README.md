
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
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCeAy6ZV9eI0yclT3EC0PW5Ur0kfWt5NcM
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prestamoscastillo2.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=prestamoscastillo2
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prestamoscastillo2.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=251641004388
    NEXT_PUBLIC_FIREBASE_APP_ID=1:251641004388:web:9957dab7294c08703eba71
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-X908DMZ00F

    # RENIEC API Environment Variables (api.perudevs.com)
    # The API URL for RENIEC lookups. Updated to the /complete endpoint.
    RENIEC_API_URL=https://api.perudevs.com/api/v1/dni/complete
    # The token is your personal key for api.perudevs.com.
    RENIEC_API_TOKEN=cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNjgxYjBmMWQ5ZmE0MTczZjYxMzIwYWEy
    ```

    **Important:**
    *   Get your Firebase credentials from your [Firebase project console](https://console.firebase.google.com/).
    *   The `RENIEC_API_TOKEN` is your personal API key from `api.perudevs.com`. Replace `cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNjgxYjBmMWQ5ZmE0MTczZjYxMzIwYWEy` with your actual key if it's different or for deployment.
    *   The `RENIEC_API_URL` is set to the `api.perudevs.com` /complete endpoint.

3.  **Set up Firestore Indexes:**

    Firestore requires specific indexes for some queries. If you encounter an error like "The query requires an index" (often displayed with a link similar to `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes?create_composite=...`), you'll need to create them in your Firebase console. Firebase usually provides a direct link in the error message (visible in your terminal, browser console, or application notifications) to create the missing index. **Click that link.**

    If no link is provided, or for reference, here are the indexes needed for the `loans` collection (defined in `firestore.indexes.json`):

    *   **Index 1 (Crucial for Loan Creation Limit Checks):**
        *   Collection ID: `loans`
        *   Fields to index:
            1.  `userId` (Ascending)
            2.  `customerDni` (Ascending)
            3.  `createdAt` (Ascending)
        *   Query scope: Collection
        *   **Note:** If you see an error "The query requires an index..." when trying to register a new loan, it is highly likely that this specific index is missing or not yet built in your Firestore database. Please ensure it is created in your Firebase console.

    *   **Index 2 (for listing loans):**
        *   Collection ID: `loans`
        *   Fields to index:
            1.  `userId` (Ascending)
            2.  `createdAt` (Descending)
        *   Query scope: Collection

    **How to create indexes manually in Firebase Console:**
    1.  Go to your Firebase project in the Firebase Console.
    2.  Navigate to **Firestore Database** (under Build).
    3.  Click on the **Indexes** tab.
    4.  Click **Add index** (or **Composite index**).
    5.  Enter the **Collection ID** (`loans`).
    6.  Add the fields as specified above with their respective order (Ascending/Descending).
    7.  Click **Create**. Index creation might take a few minutes.

    You can also refer to the `firestore.indexes.json` file in the project root for a definition of these indexes, which can sometimes be deployed using Firebase CLI tools if you have `firebase-tools` configured.


4.  **Run the development server:**
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
    *   Automatic Data Retrieval: Fetch customer data from the RENIEC API (api.perudevs.com) using the /complete DNI lookup.
    *   Automated Payment Schedule: Generate payment schedules for loans.
*   **Styling**: Uses ShadCN components, Tailwind CSS.
*   **GenAI**: Uses Genkit for any GenAI related functionality (if applicable).

To explore the application structure and components, take a look at `src/app/page.tsx` (which redirects to login/dashboard) and the `src/components` directory.

