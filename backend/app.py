import os
import fitz  # PyMuPDF
import google.generativeai as genai
import json
import re  # Import the regular expressions module
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Configuration ---

# 1. Initialize Flask App
app = Flask(__name__)
# 2. Enable CORS
CORS(app)

# 3. Configure Gemini API
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=api_key)
except ValueError as e:
    print(f"Error: {e}")

# --- Helper Functions ---

def extract_text_from_pdf(pdf_file):
    """Extracts text from an in-memory PDF file."""
    try:
        doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
        text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()
            print(f"Page {page_num + 1} extracted text length: {len(page_text)}") # DEBUG
            text += page_text
        doc.close()
        print(f"Total extracted PDF text length: {len(text)}") # DEBUG
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def clean_json_response(raw_text):
    """
    Cleans the raw text response from Gemini to extract the JSON block.
    This is more robust than just assuming the response is perfect JSON.
    """
    # 1. Try to find a Markdown JSON block first
    try:
        # Look for ```json ... ```
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', raw_text)
        if json_match:
            print("Found Markdown JSON block.")
            return json_match.group(1).strip()
    except Exception:
        pass # Ignore regex errors for now

    # 2. If no Markdown block, find the first '[' and last ']'
    try:
        start_index = raw_text.find('[')
        end_index = raw_text.rfind(']')
        
        if start_index != -1 and end_index != -1 and end_index > start_index:
            print("Found JSON array by finding [ and ].")
            return raw_text[start_index : end_index + 1]
    except Exception:
        pass

    # 3. If no array, find the first '{' and last '}' (for single-object responses)
    try:
        start_index = raw_text.find('{')
        end_index = raw_text.rfind('}')
        
        if start_index != -1 and end_index != -1 and end_index > start_index:
            print("Found JSON object by finding { and }.")
            return raw_text[start_index : end_index + 1]
    except Exception:
        pass

    print("Warning: No clean JSON block found. Returning raw text.")
    return raw_text # Fallback to raw text, which will likely fail parsing


def generate_quiz_from_text(text, num_questions):
    """
    Generates a quiz using the Gemini API based on the provided text.
    """
    if not text or len(text) < 100:  # Check if text is too short
        print("Text is too short for quiz generation.")
        return None, "Could not extract sufficient text from PDF."

    # 1. Select the Gemini model
    model = genai.GenerativeModel(
        'gemini-2.5-flash-preview-09-2025',
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )

    # 2. Define the JSON schema for the output
    quiz_schema = {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "question": {"type": "STRING"},
                "options": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "correctAnswer": {"type": "STRING"}
            },
            "required": ["question", "options", "correctAnswer"]
        }
    }

    # 3. Create the prompt
    prompt = f"""
    Based on the following text from a lecture, please generate a multiple-choice quiz.
    The quiz should consist of exactly {num_questions} questions.
    Each question must have 4 options.
    One of the options must be the correct answer.
    The "correctAnswer" field must exactly match the text of one of the options.
    Do not include any introductory text or pleasantries; just output the JSON array.

    LECTURE TEXT:
    ---
    {text[:4000]}
    ---
    """
    
    # 4. Call the API
    try:
        response = model.generate_content(
            [prompt],
            generation_config=genai.GenerationConfig(
                response_schema=quiz_schema
            )
        )
        
        # --- DEBUG: Print the raw response from Gemini ---
        print(f"--- RAW GEMINI RESPONSE ---\n{response.text}\n---------------------------")
        # --- END DEBUG ---

        # 5. Clean and parse the response
        cleaned_json_string = clean_json_response(response.text)
        if not cleaned_json_string:
            print("Failed to find JSON in Gemini response.")
            return None, "Failed to parse quiz from response (no JSON found)."
            
        quiz_data = json.loads(cleaned_json_string)
        return quiz_data, None  # Return (data, error)
        
    except Exception as e:
        print(f"Error calling Gemini API or parsing JSON: {e}")
        # This can happen if the API key is invalid or the model fails
        return None, f"An error occurred while generating the quiz: {e}"

# --- API Endpoint ---

@app.route("/api/generate-quiz", methods=["POST"])
def handle_generate_quiz():
    """
    The main API endpoint that the React frontend will call.
    """
    # 1. Check if a file was sent
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    # 2. Check if the file is a PDF
    if file.filename == '' or not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "No selected file or file is not a PDF"}), 400
        
    # 3. Get the number of questions from the form data
    try:
        # Note: 'num_questions' must match the key used in the FormData on the frontend
        num_questions = int(request.form.get('num_questions', 5))
    except ValueError:
        return jsonify({"error": "Invalid number of questions."}), 400

    # 4. Extract text from the PDF
    pdf_text = extract_text_from_pdf(file)
    if not pdf_text or len(pdf_text) < 100: # Check again after extraction
        return jsonify({"error": "Could not extract sufficient text from PDF. The PDF might be image-based or empty."}), 400

    # 5. Generate the quiz using Gemini
    quiz_data, error = generate_quiz_from_text(pdf_text, num_questions)
    
    if error:
        # If an error occurred, return it
        return jsonify({"error": error}), 500

    # 6. Success! Send the quiz data back to the frontend
    # We now wrap it in an object: { quiz: [...] }
    return jsonify({"quiz": quiz_data}), 200

# --- Run the App ---

if __name__ == "__main__":
    # This allows you to run the app directly using `python app.py`
    app.run(debug=True)