from flask import Flask, render_template, request
import PyPDF2
import os
import google.generativeai as genai

app = Flask(__name__)

# ----------------------------
# CONFIG
# ----------------------------
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))


# ----------------------------
# PDF TEXT EXTRACTION
# ----------------------------
def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text

    return text


# ----------------------------
# AI FUNCTIONS
# ----------------------------
def ai_summary(text):
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    text = text[:6000]

    response = model.generate_content(f"""
You are a professional university professor.

Task:
Create a DETAILED STUDY SUMMARY from this lecture.

Requirements:
- Use clear bullet points
- Include ALL important concepts
- Add explanations for each key idea
- Include definitions if present
- Make it useful for EXAM REVISION
- Do NOT make it short

Explain in a way so that any student can understand, even if they are not familiar with the topic.

Lecture:
{text}
""")

    return response.text


def generate_flashcards(text):
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    response = model.generate_content(f"""
Convert this lecture into flashcards.

Rules:
- Each flashcard must have a QUESTION and ANSWER
- Keep answers short and clear
- Focus on exam-important facts

Format exactly like:
Q: ...
A: ...

Lecture:
{text[:6000]}
""")

    return response.text


def generate_quiz(text):
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    response = model.generate_content(f"""
Convert this lecture into a multiple-choice quiz.

Rules:
- Create exactly 10 questions
- Each question must have 4 options
- Only one correct answer
- Clear exam-focused wording

Format:
Q: ...
A) ...
B) ...
C) ...
D) ...
Correct: A/B/C/D

Lecture:
{text[:6000]}
""")

    return response.text


# ----------------------------
# ROUTES
# ----------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    try:
        file = request.files["file"]

        path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(path)

        text = extract_text_from_pdf(path)
        summary = ai_summary(text)

        return summary

    except Exception as e:
        return f"Error: {str(e)}"


@app.route("/flashcards", methods=["POST"])
def flashcards():
    try:
        file = request.files["file"]

        path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(path)

        text = extract_text_from_pdf(path)
        cards = generate_flashcards(text)

        return cards

    except Exception as e:
        return f"Error: {str(e)}"


@app.route("/quiz", methods=["POST"])
def quiz():
    try:
        file = request.files["file"]

        path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(path)

        text = extract_text_from_pdf(path)
        quiz_text = generate_quiz(text)

        return quiz_text

    except Exception as e:
        return f"Error: {str(e)}"


# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)