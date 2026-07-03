# Mind Bridge 🌿

**Mind Bridge** is a compassionate, AI-powered companion designed to support individuals during the often-difficult waiting period before their first mental health appointment. It serves as a bridge, providing emotional support, symptom tracking, and data-driven insights to share with clinicians.

![Mind Bridge Logo](https://img.icons8.com/fluency/96/heart-with-pulse.png)

## 🌟 Key Features

-   **Daily Wellness Check-ins**: Log mood, anxiety, sleep, and physical symptoms through an intuitive interface.
-   **Compass AI**: A warm, empathetic AI companion (powered by Gemini 3.1 Pro) that provides judgment-free support and crisis detection.
-   **Voice Support**: Interactive voice sessions (using Gemini 2.5 Flash TTS) for those who prefer speaking over typing.
-   **Visual Trends**: Analyze your mental health patterns over time with interactive charts powered by Recharts.
-   **Clinician Reports**: Generate a professional PDF report summarizing your data to give your therapist a head start at your first visit.
-   **Safety Planning**: A guided space to store emergency contacts and coping strategies for crisis moments.
-   **Privacy-Focused**: Your data is stored in a local SQLite database, providing a secure and fast experience.

## 🛠️ Tech Stack

### Frontend
-   **React 19** with **Vite**
-   **Tailwind CSS** for responsive, modern styling
-   **Framer Motion** for smooth, accessible transitions
-   **Lucide React** for consistent iconography
-   **Recharts** for interactive data visualization
-   **jsPDF** for professional report generation

### Backend
-   **Express.js** (Node.js)
-   **Better-SQLite3** for high-performance, local data persistence
-   **tsx** for seamless TypeScript execution

### AI Integration
-   **Google Gemini API**:
    -   `gemini-3.1-pro-preview`: Empathetic chat and reasoning.
    -   `gemini-2.5-flash-preview-tts`: Real-time voice synthesis.
    -   `gemini-3-flash-preview`: Efficient transcription and data analysis.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   A Google Gemini API Key

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/Mind Bridge.git
    cd Mind Bridge
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  **Open in your browser**:
    Navigate to `http://localhost:3000`.

## 📂 Project Structure

-   `/src/components`: UI components for Dashboard, Chat, Trends, and Reports.
-   `/src/services`: Gemini AI integration and utility services.
-   `/server.ts`: Express backend and SQLite database configuration.
-   `/src/types.ts`: TypeScript definitions for a robust codebase.
-   `/src/lib`: Shared utilities and animation constants.

## 🛡️ Safety Warning
Mind Bridge is an AI-powered support tool, **not a replacement for professional clinical care or crisis services**. If you are in immediate danger, please contact your local emergency services or a crisis hotline (e.g., 988 in the US).

---
*Created with ❤️ to help bridge the gap in mental healthcare.*
