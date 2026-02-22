# AnalytixAI — Intelligent Assignment Evaluation Engine

**AnalytixAI** is a premium, AI-powered educational analytics platform designed to bridge the gap between traditional grading and the modern, AI-augmented classroom. It empowers educators with high-precision, multi-dimensional analysis of student assignments, reducing manual grading time by up to **30%** while eliminating evaluation bias.

---

## 🚀 The Vision

In an era where AI-generated content is becoming ubiquitous, educators need smarter tools to evaluate student work fairly. AnalytixAI doesn't just grade — it understands.

By leveraging Large Language Models (LLMs) and Vision-OCR, the platform delivers deep insights into student understanding, reasoning, and clarity — respecting both the teacher’s time and the student’s effort.

---

## ✨ Core Features

### 🧠 Intelligent Instant Analysis

Upload PDF or DOCX assignments and receive comprehensive AI-powered evaluations within seconds.

### 👁️ Vision-OCR Hybrid Engine

Automatically detects scanned or handwritten submissions and transcribes them using advanced Vision AI before evaluation.

### ⚖️ Dynamic Rubric Weighting

Customize grading priorities across:

* Relevance
* Understanding
* Logic
* Structure
* Clarity

### 📌 Reference Grounding

Provide a reference answer to anchor AI evaluation in real marking schemes for maximum accuracy and fairness.

### 📊 Deep Analytics Dashboard

Cinematic visualizations including:

* Radar charts for competency mapping
* Score distribution analytics
* Performance breakdowns

### 🧩 Section-Level Intelligence

Aggregated insights across classes to identify:

* Weak knowledge areas
* Conceptual gaps
* Teaching improvement opportunities

---

## 🛠️ Technical Architecture

### 🎨 Frontend

* **Stack:** Vanilla HTML5, CSS3 (Apple-style minimalist aesthetic), JavaScript (ES6+)
* **Charts:** Chart.js for interactive visual analytics
* **3D Graphics:** Three.js neural particle background
* **Animations:** Custom Intersection Observer-based reveal system

---

### ⚙️ Backend

* **Framework:** Flask (Python) with CORS support
* **AI Orchestration:**

  * LLM Evaluation Engine for academic reasoning analysis
  * Vision-OCR for handwritten assignment transcription
* **Text Extraction:**

  * PyMuPDF (PDF parsing)
  * docx2txt (DOCX extraction)

---

## 🗄️ Database & Authentication

* **Database:** Supabase (Managed PostgreSQL)
* **Authentication:** Secure teacher login system
* **Security:** Row Level Security (RLS) ensures teachers only access their own data

---

## 📊 Database Schema

Optimized relational model for education workflows:

### `sections`

* Section ID
* Teacher ID
* Subject metadata

### `assignments`

* Submission records
* 5-point AI evaluation metrics
* Per-question feedback
* Analytics metadata

---

## ⚡ Quick Start (Local Setup)

### 1️⃣ Prerequisites

* Python 3.9+
* Groq API Key (for AI evaluation)
* Supabase Project URL & Anon Key

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Create a .env file and add:
# GROQ_API_KEY=your_key_here

python app.py
```

---

### 3️⃣ Frontend Setup

1. Open `js/config.js`
2. Add:

   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
3. Serve the root directory using:

   * Live Server (VS Code)
   * Any static server

---

## 🏆 Hackathon Highlights

### ✍️ Handwriting Support

Unlike most grading tools, AnalytixAI evaluates physical paper submissions via Vision OCR.

### 🔐 Privacy First

Built with:

* Secure authentication
* Session guards
* Strict data isolation

### 🎨 Premium UX

A cinematic, Apple-inspired interface featuring:

* Minimalist design
* Dark-mode readiness
* Smooth professional animations

---

## 📌 Use Cases

* Schools & coaching institutes
* Online educators
* EdTech startups
* Academic hackathons

---

## 🚧 Future Roadmap

* Multi-language evaluation
* Plagiarism detection layer
* AI-generated study plans
* Teacher collaboration dashboards
* LMS integrations

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork, open issues, or submit PRs.

---

## 📜 License

MIT License — Free for educational and research use.

---

## 💡 Built For The Future of Education

AnalytixAI is more than a grading tool — it's a step toward **AI-augmented teaching**, where educators focus on mentorship while AI handles repetitive evaluation.

> Empower teachers. Elevate learning. Automate the rest.
