# 🚀 Lecture-to-Quiz AI Generator

**Tagline: Stop re-reading. Start acing.**

This is a full-stack web application built for a hackathon. It transforms passive PDF lecture slides into an active study tool by using the Google Gemini API to generate a multiple-choice quiz.

---

### About The Project

As students, we're all too familiar with the late-night "cram session"—passively re-reading the same 50-page PDF lecture slides, hoping something sticks. This is an incredibly inefficient way to learn. Our inspiration was to solve this problem by transforming *passive* study materials into an *active* learning tool. We wanted to take any lecture PDF and instantly turn it into an interactive quiz, leveraging the power of generative AI to do the heavy lifting.

### 💡 How It Works

1.  **Upload:** The React frontend allows a user to upload any text-based PDF and select the number of questions they want.
2.  **Extract:** The Flask backend receives the file and uses `PyMuPDF` (fitz) to instantly extract all text content.
3.  **Generate:** The extracted text is sent to the **Google Gemini API** with a specific prompt and a **JSON Schema**.
4.  **Respond:** Gemini is forced to return a perfectly structured JSON array of questions, options, and answers, which is then sent back to the frontend.
5.  **Learn:** The user can take the quiz, submit their answers, and get immediate feedback to check their knowledge.

---

### 🛠️ Built With

* **Languages**: Python 3, JavaScript (ES6+), HTML5, CSS3
* **Backend**: Flask
* **Frontend**: React (with React Hooks)
* **API**: Google Gemini API (using `gemini-2.5-flash-preview-09-2025`)
* **Python Libraries**: `google-generativeai`, `PyMuPDF (fitz)`, `flask-cors`
* **JavaScript Libraries**: `axios`
* **Tools**: VS Code, `npm`, `pip` & `venv`

---

### 🏃 How to Run (Local Setup)

You will need two terminals running at the same time.

**Terminal 1: Start the Backend (Flask)**
```bash
# Navigate to the backend folder
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate
# On Windows (CMD): venv\Scripts\activate
# On Windows (PowerShell): .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# IMPORTANT: Set your API Key
# On macOS/Linux:
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
# On Windows (PowerShell):
$env:GEMINI_API_KEY="YOUR_API_KEY_HERE"

# Run the server
flask run
```

Your backend is now running at http://127.0.0.1:5000

**Terminal 2: Start the Frontend (React)**
```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Run the app
npm start
```

Your frontend is now running at http://localhost:3000
