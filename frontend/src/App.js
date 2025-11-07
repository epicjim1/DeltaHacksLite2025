import React, { useState } from 'react'; // Removed unused 'useCallback'
import axios from 'axios';
import './App.css'; // <-- IMPORT OUR NEW CSS FILE

// --- Helper Components (Icons) ---

// Loader SVG component
const Loader = () => (
  <svg
    className="loader"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="4"
    ></circle>
    <path
      fill="currentColor"
      opacity="0.75"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Upload Icon SVG component
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
  </svg>
);

// --- Main App Component ---

function App() {
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for quiz answers
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // --- File Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  // --- End File Handlers ---

  // --- Form Submission Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuiz(null);
    setSelectedAnswers({});
    setSubmitted(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', numQuestions); // This must match request.form.get() in Flask

    try {
      // Make sure your Flask backend is running on port 5000
      const response = await axios.post(
        'http://127.0.0.1:5000/api/generate-quiz', // <-- This is the correct URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // We now expect the data to be in response.data.quiz
      if (response.data && response.data.quiz) {
        setQuiz(response.data.quiz);
      } else {
        // This handles cases where the backend sends JSON, but not the *expected* JSON
        setError('Failed to parse quiz from response.');
      }
    } catch (err) {
      // This catches network errors or backend 400/500-level error responses
      const errorMsg =
        err.response?.data?.error ||
        'An unknown error occurred. Make sure your backend server is running.';
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  // --- End Form Submission ---

  // --- Quiz Interaction Handlers ---
  const handleAnswerChange = (questionIndex, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
  };

  const handleRetake = () => {
    setFile(null);
    setQuiz(null);
    setSelectedAnswers({});
    setSubmitted(false);
    setError(null);
  };
  // --- End Quiz Handlers ---

  // --- Render Logic ---
  const renderQuizForm = () => (
    <div className="quiz-form">
      <form className="form-inner" onSubmit={handleSubmit}>
        {/* File Upload Section */}
        <div>
          <label className="form-label" htmlFor="file-upload">
            1. Upload PDF Slides
          </label>
          <label
            htmlFor="file-upload"
            className="file-dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadIcon />
            <p>
              <span>Click to upload</span> or drag and drop
            </p>
            <p className="dropzone-hint">PDF files only</p>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <p className="file-selected-message">
              File selected: {file.name}
            </p>
          )}
        </div>

        {/* Number of Questions Section */}
        <div>
          <label className="form-label" htmlFor="num-questions">
            2. Number of Questions
          </label>
          <input
            type="number"
            id="num-questions"
            name="num-questions"
            className="number-input"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            min="1"
            max="20"
          />
        </div>

        {/* Submit Button Section */}
        <div>
          <button
            type="submit"
            className="button-submit"
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <Loader />
                Generating...
              </>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderQuizDisplay = () => (
    <div className="quiz-display">
      <h2>Your Quiz</h2>
      <div>
        {quiz.map((q, qIndex) => (
          <div key={qIndex} className="question-card">
            <h3>{`${qIndex + 1}. ${q.question}`}</h3>
            <div>
              {q.options.map((option, oIndex) => {
                
                // *** THIS WAS THE BUG ***
                // I moved this line up, so it is defined *before* it's used.
                const correctOptionIndex = q.options.findIndex(
                  (opt) => opt === q.correctAnswer
                );
                
                const isCorrect = oIndex === correctOptionIndex;
                const isSelected = selectedAnswers[qIndex] === oIndex;

                // Determine option styling
                let optionClass = 'option-label';
                if (submitted) {
                  if (isCorrect) {
                    optionClass += ' correct';
                  } else if (isSelected && !isCorrect) {
                    optionClass += ' incorrect';
                  }
                }

                return (
                  <label key={oIndex} className={optionClass}>
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={isSelected}
                      disabled={submitted}
                      onChange={() => handleAnswerChange(qIndex, oIndex)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>

            {/* Show Correct/Incorrect Message after submission */}
            {submitted && (
              <>
                {/* *** THIS WAS THE OTHER PART OF THE BUG ***
                  I am now checking if the selected answer is correct 
                  by finding the index *before* this check.
                */}
                {selectedAnswers[qIndex] === q.options.findIndex(opt => opt === q.correctAnswer) ? (
                  <div className="result-message correct">
                    <strong>Correct!</strong>
                  </div>
                ) : (
                  <div className="result-message incorrect">
                    <strong>Incorrect.</strong> The correct answer was:{' '}
                    <strong>{q.correctAnswer}</strong>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quiz Action Buttons */}
      {!submitted ? (
        <button className="button-submit-quiz" onClick={handleSubmitQuiz}>
          Submit Quiz
        </button>
      ) : (
        <button className="button-retake-quiz" onClick={handleRetake}>
          Generate Another Quiz
        </button>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <header className="header">
          <h1>Lecture-to-Quiz Generator</h1>
          <p>
            Upload your PDF lecture slides and get a multiple-choice quiz in
            seconds, powered by Gemini AI.
          </p>
        </header>
        <main>
          {/* We either show the form, or we show the quiz */}
          {!quiz ? renderQuizForm() : renderQuizDisplay()}
        </main>
      </div>
    </div>
  );
}

export default App;