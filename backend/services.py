import os
import json
import base64
import io
import fitz  # PyMuPDF
import docx2txt
from PyPDF2 import PdfReader
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_text(file):
    """Extract text from PDF or DOCX file with OCR fallback."""
    filename = file.filename.lower()

    if filename.endswith('.pdf'):
        # 1. Try standard text extraction
        pdf_bytes = file.read()
        file.seek(0)  # Reset for potential second read

        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        # 2. If text is very short or empty, it's likely a scan/handwritten
        if len(text.strip()) < 50:
            print("Detected possible scanned PDF. Starting OCR...")
            return perform_vision_ocr(pdf_bytes)

        return text

    elif filename.endswith('.docx'):
        return docx2txt.process(file)
    return ""


def perform_vision_ocr(pdf_bytes):
    """Convert PDF pages to images and transcribe using Groq Vision."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    transcribed_text = ""

    # Process up to 5 pages to stay within limits
    for i in range(min(5, len(doc))):
        page = doc[i]
        pix = page.get_pixmap(matrix=fitz.Matrix(
            1.5, 1.5))  # 1.5x zoom for better OCR
        img_bytes = pix.tobytes("png")
        base64_image = base64.b64encode(img_bytes).decode('utf-8')

        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Transcribe the handwriting or text in this image exactly. If it's an assignment, include the questions and answers."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ]
            )
            transcribed_text += response.choices[0].message.content + "\n\n"
        except Exception as e:
            print(f"Vision OCR error on page {i+1}: {e}")

    return transcribed_text


def analyze_assignment(text, reference_text=None, weights=None):
    """Analyze assignment with reference comparison and weights."""
    if not text:
        return {"error": "No text extracted from file."}

    # Truncate text to avoid rate limits
    truncated_text = text[:15000]
    truncated_ref = reference_text[:10000] if reference_text else ""

    ref_instruction = ""
    if reference_text:
        ref_instruction = f"""
        ================================================
        REFERENCE ANSWER COMPARISON (PRIORITY)
        ================================================
        The teacher has provided a REFERENCE ANSWER below.
        You MUST use this as the absolute ground truth.

        REFERENCE CONTENT:
        {truncated_ref}

        Rules:
        1. If relevant, score high (85+) for matching baseline.
        2. Be strict if student contradicts the reference.
        3. Mention the reference comparison in feedback.
        """

    # Rubric Weightage Instruction
    weight_instr = ""
    if weights:
        try:
            re_w = float(weights.get('relevance', 20)) / 100
            un_w = float(weights.get('understanding', 30)) / 100
            lo_w = float(weights.get('logic', 20)) / 100
            st_w = float(weights.get('structure', 15)) / 100
            cl_w = float(weights.get('clarity', 15)) / 100
            weight_instr = f"""
            ===============================================
            SCORING WEIGHTAGE (CUSTOM)
            ===============================================
            The teacher has specified custom weights for the overallScore:
            - Relevance: {re_w*100}%
            - Understanding: {un_w*100}%
            - Logic: {lo_w*100}%
            - Structure: {st_w*100}%
            - Clarity: {cl_w*100}%

            Compute overallScore using:
            (relevance * {re_w}) + (understanding * {un_w}) + \
(logic * {lo_w}) + (structure * {st_w}) + (clarity * {cl_w})
            """
        except Exception:
            pass

    if not weight_instr:
        weight_instr = """
        ===============================================
        SCORING WEIGHTAGE (DEFAULT)
        ===============================================
        Compute overallScore using:
        (relevance * 0.2) + (understanding * 0.3) + (logic * 0.2) + \
        (structure * 0.15) + (clarity * 0.15)
        """

    system_prompt = f"""
    You are a strict academic evaluator for a teacher analytics dashboard.
    CRITICAL: You MUST output your response in JSON format.

    {ref_instruction}
    {weight_instr}

    ================================================
    STEP 1 — ASSIGNMENT DETECTION
    ================================================
    Before scoring, determine whether the document is a student assignment.

    A document IS an assignment if:
    - It contains questions and answers OR structured responses
    - Looks like homework, classwork, or submitted academic work
    - May include Q1, Answer, Explain, Discuss
    - Can be typed OR handwritten (OCR text may be messy)

    A document is NOT an assignment if it looks like:
    - Notes or study material
    - Question paper without answers
    - Resume / CV
    - Article or blog
    - Book or syllabus content
    - Slides
    - Random essay without prompts

    If there is NO clear Q&A structure, treat it as NOT an assignment.

    ================================================
    IF NOT AN ASSIGNMENT
    ================================================
    Return ZERO for all scores.

    Rules:
    - Set relevance, understanding, logic, structure, clarity = 0
    - Set overallScore = 0
    - Feedback must clearly state:
      1. This is not a student assignment
      2. What the document likely is (notes, article, etc.)

    ================================================
    IF IT IS AN ASSIGNMENT
    ================================================

    ===============================================
    EVALUATION FACTORS (USE ONLY THESE 5)
    ===============================================
    1. relevance: How well the student addresses requirements.
    2. understanding: Depth of subject knowledge shown.
    3. logic: Logical flow and reasoning between ideas.
    4. structure: Organization and structural integrity.
    5. clarity: Language, grammar, and readable expression.

    SCORING SCALE (0-100):
    90–100 = Exceptional | 70–89 = Strong | 50–69 = Average
    30–49 = Weak | 0–29 = Poor

    ===============================================
    SCORING LOGIC
    ===============================================
    Provide a score (0–100) for each factor.
    CRITICAL: overallScore MUST be a single numeric value (e.g., 85.5).
    DO NOT output mathematical expressions or calculations like
    "(80 * 0.2) + ..." inside the JSON.
    Perform the math yourself and output ONLY THE RESULT.

    Follow the weightage instruction provided above for overallScore.

    Be conservative and avoid inflated scores.

    ===============================================
    METADATA & GRANULAR ANALYSIS
    ===============================================
    1. studentName: Name if found.
    2. studentId: Roll/ID if found.
    3. questionsSolved: TOTAL number of questions successfully answered.
    4. perQuestionFeedback: List of strings.
       - Each string MUST be exactly 1 sentence.
       - Structure: "Question N: [Specific problem/strength]."

    ===============================================
    STRICT OUTPUT FORMAT
    ===============================================
    Return ONLY valid JSON.

    {{
      "studentName": "",
      "studentId": "",
      "questionsSolved": 0,
      "perQuestionFeedback": [],
      "metrics": {{
        "relevance": 0,
        "understanding": 0,
        "logic": 0,
        "structure": 0,
        "clarity": 0,
        "overallScore": 0
      }},
      "feedback": "Overall 4-6 sentences on performance."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",
                 "content": f"Assignment text:\n\n{truncated_text}"}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling Groq API: {error_msg}")
        return {"error": error_msg}
