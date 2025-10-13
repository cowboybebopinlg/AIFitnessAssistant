<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FitAI: Your AI-Powered Fitness Companion

FitAI is a modern, data-driven fitness tracking application designed to provide users with deep insights into their health and wellness journey. By integrating with the FitAI API, it offers intelligent features like natural language logging and smart suggestions. The app is built as a cross-platform solution using Capacitor, allowing it to run on the web, Android, and iOS from a single codebase.

## ✨ Key Features

*   **AI-Powered Logging:** Use natural language to log meals and workouts. Just describe what you did, and Gemini will parse and structure the data for you.
*   **Smart Suggestions:** Receive daily, personalized recommendations for food and activities based on your goals and recent history.
*   **Comprehensive Tracking:** Log a wide range of metrics, including daily weight, body measurements, sleep quality, energy levels, and more.
*   **Fitbit Integration:** Sync your daily activity, heart rate, sleep, and other vital metrics directly from your Fitbit device.
*   **Detailed Daily Log:** A clear, chronological view of your daily meals, workouts, and metrics.
*   **User Profile:** A centralized hub to define your mission, goals, and physical stats, which provides context to the AI for more personalized interactions.
*   **Cross-Platform:** Built with Capacitor to run seamlessly on the web and mobile devices.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Mobile:** Capacitor
*   **AI:** Google Gemini API
*   **Routing:** React Router
*   **State Management:** React Context API

## 📂 Project Structure

The codebase is organized to separate concerns, making it easier to navigate and maintain.

```
/
├── public/              # Static assets
├── src/
│   ├── api/             # API-related files (currently a placeholder)
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   └── pages/       # Page-level components
│   ├── context/         # React Context for global state management (AppContext)
│   ├── services/        # Business logic and external service integrations (Gemini, Fitbit, data persistence)
│   ├── App.tsx          # Main application component with routing
│   ├── index.css        # Global CSS and Tailwind directives
│   ├── index.tsx        # Application entry point
│   └── types.ts         # Global TypeScript type definitions
├── android/             # Android Capacitor project
├── capacitor.config.ts  # Capacitor configuration
└── package.json         # Project dependencies and scripts
```

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or newer)
*   `npm` or `yarn` package manager

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/fitai.git
    cd fitai
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your API keys. This file is used for development and should not be committed to version control.
    ```
    # Your Google Gemini API Key
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # Your Fitbit App Client ID and Secret
    VITE_FITBIT_CLIENT_ID="YOUR_FITBIT_CLIENT_ID"
    VITE_FITBIT_CLIENT_SECRET="YOUR_FITBIT_CLIENT_SECRET"
    ```
    *Note: The Gemini API key can also be set directly in the app's settings page after launching.*

4.  **Run the development server:**
    This will start the Vite development server, and you can view the web app in your browser.
    ```sh
    npm run dev
    ```

### Building for Production

To create a production-ready build of the web app, run:
```sh
npm run build
```
The optimized static files will be generated in the `dist/` directory.

### Running on Mobile (Capacitor)

To run the app on a mobile device or emulator:

1.  **Sync the web build with Capacitor:**
    This command copies your web assets into the native projects.
    ```sh
    npm run build
    npx cap sync
    ```

2.  **Run on Android:**
    This will open the project in Android Studio, where you can build and run the app on an emulator or a connected device.
    ```sh
    npx cap run android
    ```

3.  **Run on iOS:**
    (Requires a macOS machine with Xcode installed)
    ```sh
    npx cap run ios
    ```