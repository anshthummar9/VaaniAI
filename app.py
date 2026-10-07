import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from google import genai
from google.genai import types

load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__)

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
# The lite model is optimized for low-latency conversational responses.
MODEL_NAME = "gemini-3.5-flash-lite"
FALLBACK_MODEL_NAME = "gemini-3.8-flash"
SUPPORTED_LANGUAGES = {
    "English",
    "Hindi",
    "Gujarati",
    "Marathi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
}

client = (
    genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(
            timeout=10_000,
            retry_options=types.HttpRetryOptions(
                attempts=1,
                http_status_codes=[429, 500, 502, 503, 504],
            ),
        ),
    )
    if API_KEY
    else None
)


@app.route("/")
def index():
    """Route to serve the main frontend web page."""
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """Generate a response in the language selected by the user."""
    if client is None:
        return jsonify({
            "error": "GEMINI_API_KEY is missing. Add it to the project's .env file."
        }), 500

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    user_message = data.get("message", "")
    selected_language = data.get("language", "English")

    if not isinstance(user_message, str) or not user_message.strip():
        return jsonify({"error": "Message cannot be empty."}), 400
    if not isinstance(selected_language, str) or selected_language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": "Unsupported language selected."}), 400

    try:
        prompt = (
            "You are a multilingual conversational AI assistant. "
            f"Reply only in {selected_language}. Do not translate the response "
            "into another language. Keep it helpful, accurate, and concise.\n\n"
            f"User message: {user_message.strip()}"
        )
        response = None
        for model_name in (MODEL_NAME, FALLBACK_MODEL_NAME):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=256,
                        temperature=0.4,
                    ),
                )
                break
            except Exception as exc:
                if getattr(exc, "code", None) != 503 or model_name == FALLBACK_MODEL_NAME:
                    raise
                app.logger.warning(
                    "Gemini model %s is temporarily unavailable; trying %s.",
                    model_name,
                    FALLBACK_MODEL_NAME,
                )

        if response is None:
            return jsonify({"error": "Gemini did not return a response."}), 502

        response_text = (response.text or "").strip()
        if not response_text:
            return jsonify({"error": "Gemini returned an empty response."}), 502
        return jsonify({"response": response_text})
    except Exception as exc:
        app.logger.exception("Gemini API request failed")
        error_text = str(exc)
        if "API_KEY_INVALID" in error_text or "API key not valid" in error_text:
            return jsonify({
                "error": (
                    "The GEMINI_API_KEY in .env is invalid or revoked. "
                    "Create a new Gemini API key in Google AI Studio and replace it."
                )
            }), 502
        return jsonify({"error": f"Gemini API request failed: {exc}"}), 502


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
