# VaaniAI – Multilingual Conversational AI for Indian Languages

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask 3.0](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.org/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini%20API-3.5%20Flash%20Lite-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

> **VaaniAI** is an end-to-end, college-level Natural Language Processing (NLP) web application designed to deliver real-time, context-aware conversations across **9 Indian languages**. Built with a lightweight **Flask** backend, **Vanilla JavaScript** frontend, and powered by **Google Gemini API** (`gemini-3.5-flash-lite`), VaaniAI demonstrates core computational linguistics and LLM prompt steering concepts in a clean, professional workspace.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Supported Languages](#-supported-languages)
- [In-Depth NLP Concepts & Architecture](#-in-depth-nlp-concepts--architecture)
- [System Data Flow](#-system-data-flow)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Technology Stack](#-technology-stack)
- [Installation & Setup Guide](#-installation--setup-guide)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ✨ Key Features

- **🌐 Multilingual Prompt Steering**: Native support for 9 Indian languages. System instructions dynamically condition model responses to stick strictly to the target language without translating back to English.
- **⚡ Low-Latency Generative AI**: Utilizes `gemini-3.5-flash-lite` as the primary engine for high-speed response synthesis, backed by `gemini-3.8-flash` as a automatic fallback layer.
- **🎨 Glassmorphic Responsive Dashboard**: Modern dashboard UI featuring a topbar navigation, interactive hero section, workspace sidebar, language selection chips, active context panel, and typing indicators.
- **💾 Local History & State Persistence**: Saves up to 20 conversation history pairs in browser `localStorage`, allowing users to reload previous chats seamlessly.
- **🛠️ Rich Workspace Tooling**: Includes inline response copy, single-click response regeneration, instant clear workspace, instant new chat (`⌘ K`), auto-resizing text composer, and suggestion prompts.
- **🛡️ Built-in Resilience & Fault Tolerance**: Features a 10-second request timeout, automatic retry on 429/500/502/503/504 status codes, and clear diagnostic error notifications.

---

## 🗣️ Supported Languages

VaaniAI handles text generation and script synthesis across 9 diverse linguistic families:

| Language | Script | ISO Code | Sample Greeting |
| :--- | :--- | :---: | :--- |
| **English** | Latin | `EN` | *Hello! How can I help you today?* |
| **Hindi (हिन्दी)** | Devanagari | `HI` | *नमस्ते! मैं आपकी किस प्रकार सहायता कर सकता हूँ?* |
| **Gujarati (ગુજરાતી)** | Gujarati | `GU` | *નમસ્તે! હું તમને કેવી રીતે મદદ કરી શકું?* |
| **Marathi (मराठी)** | Devanagari | `MR` | *नमस्कार! मी तुम्हाला कशी मदत करू शकतो?* |
| **Bengali (বাংলা)** | Bengali | `BN` | *নমস্কার! আমি আপনাকে কীভাবে সাহায্য করতে পারি?* |
| **Tamil (தமிழ்)** | Tamil | `TA` | *வணக்கம்! நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?* |
| **Telugu (తెలుగు)** | Telugu | `TE` | *నమస్కారం! నేను మీకు ఎలా సహాయపడగలను?* |
| **Kannada (ಕನ್ನಡ)** | Kannada | `KN` | *ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?* |
| **Malayalam (മലയാളം)**| Malayalam | `ML` | *നമസ്കാരം! എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?* |

---

## 🧠 NLP Concepts & Architecture

### 1. Zero-Shot Multilingual Prompt Conditioning
Rather than relying on lossy secondary machine translation pipelines (e.g., input English -> translation -> Indic text), VaaniAI uses **Direct Multilingual Context Steering**. The selected language conditions the system prompt sent to the LLM:

```text
You are a multilingual conversational AI assistant. Reply only in {Selected Language}. 
Do not translate the response into another language. Keep it helpful, accurate, and concise.

User message: {User Message}
```
This forces the LLM's transformer attention heads to operate directly in the desired target script space (e.g., Devanagari, Tamil, Bengali).

### 2. Language Identification & Steering Layer (`utils/language_utils.py`)
In practical NLP systems, language identification can occur via automatic detection algorithms (e.g., `fastText` or `langdetect`) or via manual user preference steering. 
- `utils/language_utils.py` acts as the modular abstraction layer for language processing.
- Manual UI language selection guarantees **100% intent accuracy** for code-mixed or short user inputs (e.g., "Hi" typed with Hindi selected yields a Hindi response).

### 3. Hyperparameter Tuning for Low-Latency Generation
In `app.py`, generation parameter bounds are strictly optimized for rapid conversational turnaround:
- `max_output_tokens=256`: Limits token budget to prevent long-winded answers and reduce latency.
- `temperature=0.4`: Balances natural creative expression with linguistic precision and grammatical consistency in Indic scripts.

### 4. Resilient Fallback Architecture
If the primary low-latency model (`gemini-3.5-flash-lite`) encounters temporary service degradation (HTTP 503), the backend automatically retries the query against the standard model (`gemini-3.8-flash`) before surfacing an error to the user.

---

## 🔄 System Data Flow

```
[ User Input + Language Choice ]
              │
              ▼
    [ Web Dashboard UI ]  ──(Fetch API / JSON)──► [ Flask Server: /chat ]
                                                              │
                                                        (Validate Input)
                                                              │
                                                              ▼
[ Rendered Response ] ◄──(JSON Response)── [ Google Gemini API SDK ]
                                              (gemini-3.5-flash-lite)
```

1. **User Action**: User selects target language (e.g., *Gujarati*) and enters a prompt in the composer.
2. **Frontend Dispatch**: JavaScript captures the input and fires an asynchronous `POST` request to `/chat`.
3. **Flask Validation**: Backend verifies valid string input, supported language bounds, and API key presence.
4. **LLM Inference**: `google-genai` SDK transmits the prompt to Gemini API with strict HTTP timeout (10s) and retry policies.
5. **Response Rendering**: Synthesized Indic response text is returned in JSON format and rendered smoothly in the workspace chat stream.

---

## 📁 Project Architecture & Directory Structure

```
VaaniAI/
├── .env                  # Environment configuration (GEMINI_API_KEY)
├── .gitignore            # Git exclusion rules (venv, cache, .env)
├── app.py                # Main Flask application & Gemini API integration
├── requirements.txt      # Python dependencies
├── README.md             # In-depth project documentation
│
├── static/
│   ├── css/
│   │   └── style.css     # Design system, glassmorphism, responsive styles
│   ├── images/
│   │   └── vaani-logo.png # VaaniAI brand logo
│   └── js/
│       └── script.js     # Frontend state, API handling, history storage
│
├── templates/
│   └── index.html        # HTML5 layout, sidebar, composer & context panel
│
└── utils/
    └── language_utils.py # Language detection & NLP utility abstraction
```

---

## 🛠️ Technology Stack

- **Backend Framework**: Python 3.10+ & Flask 3.0.0
- **AI / LLM SDK**: `google-genai` (v1.75+) interacting with `gemini-3.5-flash-lite` and `gemini-3.8-flash`
- **Environment Management**: `python-dotenv`
- **Frontend Architecture**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid), Vanilla JavaScript (ES6+)
- **Typography & Icons**: Google Fonts (*Plus Jakarta Sans*, *DM Sans*)

---

## 📦 Installation & Setup Guide

### Prerequisites
- Python 3.10 or higher installed on your system.
- A Google Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/)).

### Step 1: Clone or Open the Workspace
Navigate to the project directory:
```bash
cd VaaniAI
```

### Step 2: Create & Activate Virtual Environment
- **Windows**:
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Create or edit the `.env` file in the root `VaaniAI` directory:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

---

## 🚀 Running the Application

1. **Start the Flask Development Server**:
   ```bash
   python app.py
   ```

2. **Access the Web Dashboard**:
   Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

3. **Test a Conversation**:
   - Select **Hindi (हिन्दी)** or any other language from the left workspace panel.
   - Type `"What is Natural Language Processing?"` and hit **Enter**.
   - VaaniAI will generate a complete response in Hindi!

---

## 📡 API Reference

### 1. `GET /`
- **Description**: Renders and serves the single-page web dashboard (`templates/index.html`).
- **Response**: `200 OK` (HTML)

---

### 2. `POST /chat`
- **Description**: Generates a conversational response in the requested language.
- **Headers**: `Content-Type: application/json`

#### Request Payload:
```json
{
  "message": "Explain natural language processing in simple terms.",
  "language": "Hindi"
}
```

#### Successful Response (`200 OK`):
```json
{
  "response": "प्राकृतिक भाषा प्रसंस्करण (NLP) कंप्यूटर विज्ञान और कृत्रिम बुद्धिमत्ता (AI) की एक शाखा है..."
}
```

#### Error Response (`400 Bad Request` / `502 Bad Gateway` / `500 Server Error`):
```json
{
  "error": "The GEMINI_API_KEY in .env is invalid or revoked. Create a new Gemini API key in Google AI Studio."
}
```

---

## 🔍 Troubleshooting & FAQs

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`GEMINI_API_KEY is missing`** | `.env` file is missing or empty. | Ensure `.env` exists in `VaaniAI/` with `GEMINI_API_KEY=...`. |
| **`API key not valid` error** | Invalid or revoked Gemini API key. | Generate a fresh key from [Google AI Studio](https://aistudio.google.com/) and update `.env`. |
| **`ModuleNotFoundError: No module named 'flask'`** | Virtual environment not activated. | Activate `venv` (`venv\Scripts\activate`) before running `python app.py`. |
| **Response takes long / times out** | Network latency or model load. | The backend has a 10s timeout built-in; model selection defaults to ultra-fast `gemini-3.5-flash-lite`. |

---
