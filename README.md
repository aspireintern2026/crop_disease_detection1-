# AgriGuard AI - Crop Disease Scanner

AgriGuard AI is a high-performance crop disease scanner that uses advanced AI to identify plant diseases from images. It provides detailed diagnoses, treatment plans, and prevention strategies in multiple languages with real-time speech synthesis.

## Features

- **AI Diagnosis**: Instant identification of crop diseases using Gemini AI.
- **Multilingual Support**: Real-time translation into 19+ languages including regional Indian languages.
- **Voice Synthesis**: Listen to diagnoses and treatment plans in your local language.
- **Environmental Context**: AI-driven insights considering local weather and humidity.
- **Offline History**: Keep track of previous scans locally.

## Getting Started in VS Code

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Visual Studio Code](https://code.visualstudio.com/)
- A Gemini API Key from (https://aistudio.google.com/)

### Installation

1. **Clone or Download** the project files to your local machine.
2. **Open the folder** in VS Code.
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure Environment Variables**:
   - Create a `.env` file in the root directory.
   - Copy the contents from `.env.example` to `.env`.
   - Replace `MY_GEMINI_API_KEY` with your actual Gemini API key.
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

### Running the App

1. **Start the development server**:
   ```bash
   npm run dev
   ```
2. **Open your browser** and navigate to `http://localhost:3000`.

## Recommended VS Code Extensions

For the best development experience, we recommend installing:

- **ESLint**: For code quality and consistency.
- **Tailwind CSS IntelliSense**: For autocompletion of Tailwind utility classes.
- **Prettier**: For consistent code formatting.

## Project Structure

- `src/App.tsx`: Main application logic and UI.
- `src/services/aiService.ts`: Integration with Gemini AI for analysis, translation, and speech.
- `src/lib/audio.ts`: Utility for processing PCM audio data to WAV format.
- `src/types.ts`: TypeScript definitions for analysis results and application state.

## License

This project is licensed under the Apache-2.0 License.
