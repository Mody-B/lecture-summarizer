from flask import Flask, render_template, request
import PyPDF2
import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text()
    return text

def ai_summary(text):
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    text = text[:6000] 

    response = model.generate_content(
        f"""
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

    explain in a way so that any student can understand, 
    even if they missed the lecture.And any level of student can understand, 
    even if they are not familiar with the topic.

        Lecture:
        {text}
        """
    )

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
    response = model.generate_content(
        f"""
    Convert this lecture into a multiple-choice quiz.

    Rules:
    - Create exactly 10 questions.
    - Each question must have exactly 4 options.
    - Exactly one option must be correct.
    - Keep wording clear and exam-focused.

    Output format (repeat this for each question):
    Q: <question text>
    A) <option text>
    B) <option text>
    C) <option text>
    D) <option text>
    Correct: <A or B or C or D>

    Lecture:
    {text[:6000]}
"""
    )
    return response.text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']

    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)

    text = extract_text_from_pdf(path)

    try:
        summary = ai_summary(text)
    except Exception as e:
        return f"AI error: {str(e)}"

    return summary

@app.route('/flashcards', methods=['POST'])
def flashcards():
    file = request.files['file']

    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)

    text = extract_text_from_pdf(path)

    try:
        cards = generate_flashcards(text)
    except Exception as e:
        return f"AI error: {str(e)}"

    return cards

@app.route('/quiz', methods=['POST'])
def quiz():
    file = request.files['file']

    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)

    text = extract_text_from_pdf(path)

    try:
        quiz_text = generate_quiz(text)
    except Exception as e:
        return f"AI error: {str(e)}"

    return quiz_text

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)

os.makedirs('uploads', exist_ok=True)    

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
