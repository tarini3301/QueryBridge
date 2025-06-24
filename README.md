# 🔍 Query Bridge

Transform your natural language questions into SQL, execute on your data, and understand it all — right in your browser.

---

## 🧠 What is Query Bridge?

Query Bridge is a local-first web app that allows users to:
- Upload a CSV file or paste tabular data
- Ask natural language questions
- Get auto-generated SQL queries (requires Gemini API)
- View results directly from an in-browser database

> ⚠️ Gemini API is optional. If not configured, SQL generation and explanations will be disabled.

---

## 🚀 Run and Deploy Your App

This guide helps you run the app locally on your machine.

## 📸 Screenshot
(![Screenshot 2025-06-24 202218](https://github.com/user-attachments/assets/a8ef9013-e361-4243-be97-1baa2f546bfc)
)

### ✅ Prerequisites

- **Node.js** (v16 or later recommended)
- A [Gemini API key](https://aistudio.google.com/app/apikey) (optional, but needed for SQL generation)

---

## 💻 Run Locally

1. **Install dependencies**

```bash
npm install
