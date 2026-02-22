from flask import Flask, request, jsonify
from flask_cors import CORS
from services import extract_text, analyze_assignment
from datetime import datetime
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app)

# Groq client for section feedback
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.route('/api/extract-text', methods=['POST'])
def extract():
    """Extract text from a file (PDF/DOCX) for reference material."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        text = extract_text(file)
        if not text:
            return jsonify({"error": "No text extracted"}), 400
        return jsonify({"text": text})
    except Exception as e:
        print(f"Extraction error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    ref_file = request.files.get('reference_file')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    student_name_req = request.form.get('student_name', '')
    student_id_req = request.form.get('student_id', '')

    try:
        # 1. Extract text from assignment
        text = extract_text(file)
        if not text:
            return jsonify({"error": "No text extracted"}), 400

        # 2. Resolve Reference Text and custom weights
        ref_text = request.form.get('reference_text')
        if not ref_text and ref_file and ref_file.filename != '':
            ref_text = extract_text(ref_file)

        rubric_weights = request.form.get('rubric_weights')
        try:
            if rubric_weights:
                import json
                rubric_weights = json.loads(rubric_weights)
        except Exception as je:
            print(f"Failed to parse rubric_weights: {je}")
            rubric_weights = None

        # 3. Analyze with Groq
        ai_data = analyze_assignment(text, ref_text, rubric_weights)
        if not ai_data:
            return jsonify({"error": "AI analysis failed"}), 500

        if "error" in ai_data:
            return jsonify({"error": ai_data["error"]}), 500

        metrics = ai_data.get('metrics', {})
        dt_now = datetime.now()

        final_result = {
            "id": (ai_data.get('studentId') or
                   student_id_req or
                   f"STU-{dt_now.strftime('%Y%m%d%H%M')}"),
            "name": (ai_data.get('studentName') or
                     student_name_req or "Unknown Student"),
            "fileName": file.filename,
            "date": dt_now.isoformat(),
            "relevance": metrics.get('relevance', 0),
            "understanding": metrics.get('understanding', 0),
            "logic": metrics.get('logic', 0),
            "structure": metrics.get('structure', 0),
            "clarity": metrics.get('clarity', 0),
            "overallScore": metrics.get('overallScore', 0),
            "questionsSolved": ai_data.get('questionsSolved', 0),
            "perQuestionFeedback": ai_data.get(
                'perQuestionFeedback', []),
            "feedback": ai_data.get(
                'feedback', "Analysis complete.")
        }

        return jsonify(final_result)

    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/sections/<section_id>/feedback', methods=['POST'])
def section_feedback(section_id):
    """Generate AI-powered section-level insights."""
    try:
        data = request.get_json()
        if not data or 'assignments' not in data:
            return jsonify({"error": "No assignment data"}), 400

        assignments = data['assignments']
        section_name = data.get('section_name', 'Section')

        # Build summary for AI
        summary_lines = []
        for a in assignments:
            summary_lines.append(
                f"- {a.get('student_name', 'Unknown')}: "
                f"Score {a.get('overall_score', 0)}%, "
                f"Relevance {a.get('relevance', 0)}%, "
                f"Understanding {a.get('understanding', 0)}%, "
                f"Logic {a.get('logic', 0)}%, "
                f"Structure {a.get('structure', 0)}%, "
                f"Clarity {a.get('clarity', 0)}%"
            )

        prompt = f"""You are an educational analytics expert.

Analyze the following section "{section_name}" with
{len(assignments)} student assignments:

{chr(10).join(summary_lines)}

Provide a concise 4-6 sentence section-level insight covering:
1. Common weaknesses across students
2. Topics students struggle with most
3. The strongest area of the class
4. 1-2 specific suggestions for the teacher

Respond with ONLY the feedback text, no JSON or formatting."""

        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system",
                 "content": "You are an educational analytics AI."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )

        feedback = completion.choices[0].message.content.strip()
        return jsonify({"feedback": feedback})

    except Exception as e:
        print(f"Section feedback error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
