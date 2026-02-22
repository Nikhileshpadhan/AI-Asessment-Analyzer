# AnalytixAI — Intelligent Assignment Evaluation Engine

AnalytixAI is a premium, AI-powered educational analytics platform built to streamline the grading process in the modern classroom. It leverages high-precision Large Language Models (LLMs) and Vision-OCR to provide multi-dimensional analysis of student work, significantly reducing manual effort while maintaining objective evaluation standards.

---

## 🚀 The Vision

As AI-generated content becomes more common, educators need tools that do more than just assign a grade. AnalytixAI bridges this gap by analyzing the depth of a student’s understanding, logic, and clarity. It is designed to respect the educator's time by providing instant, actionable intelligence for both digital and handwritten submissions.

---

## ✨ Core Features

### 📤 Student-Led Submission Portal
A public, non-login page where students can upload assignments using a secure link shared by the teacher.

### 🧠 Automatic Data Categorization
Submissions are automatically linked to the correct teacher and section in the database, eliminating manual data entry.

### 📝 Vision-OCR Hybrid Engine
Uses Llama-4 Vision to transcribe and analyze scanned or handwritten assignments.

### ⚖️ Dynamic Rubric Weighting
Teachers can customize how Relevance, Understanding, Logic, Structure, and Clarity contribute to the final score.

### 🎯 Reference Grounding
Evaluation is grounded in a "ground truth" reference answer provided by the teacher for maximum accuracy.

### 📊 Deep Analytics Dashboard
Cinematic visualizations including radar charts for competency mapping and bar charts for score distributions.

### 🤖 AI Section Insights
Aggregated class-level feedback that highlights common struggle areas and actionable teaching insights.

---

## 🛠️ Technical Architecture

### Frontend
- **Core:** Vanilla HTML5, CSS3 (Apple-style minimalist aesthetic), JavaScript (ES6+)
- **Visualizations:** Chart.js for high-performance interactive rendering
- **Graphics:** Three.js neural particle background
- **Animations:** Intersection Observer-based smooth transitions

---

### Backend
- **Framework:** Flask (Python) with CORS integration

#### AI Orchestration
- **LLM:** Llama-3.3-70B via Groq for high-speed academic evaluation
- **OCR:** Llama-4-Scout-17B Vision for handwritten transcription
- **Text Processing:** PyMuPDF (fitz) and docx2txt for document parsing

---

### Database & Auth
- **Supabase:** Managed PostgreSQL for storage and authentication
- **Security:** Row Level Security (RLS) ensures strict data isolation between teachers

---

## 📊 Database Schema

The relational architecture is optimized for educational workflows:

### `sections`
- Stores class metadata
- Includes a unique `share_token` for generating student upload links

### `assignments`
- Submission records with:
  - 5-point evaluation metrics
  - Student metadata
  - AI-generated feedback

---

## ⚡ Quick Start (Local Setup)

### 1️⃣ Prerequisites
- Python 3.9+
- Groq API Key
- Supabase Project URL & Anon Key

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file and add:
# GROQ_API_KEY=your_key_here

python app.py
