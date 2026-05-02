HCP Interaction Logger & AI Assistant
Live Repo Link:
https://youtu.be/ODQ0durXPaw?si=LjPbN-y8K09r8OJ1


A high-performance CRM dashboard designed for Medical Science Liaisons (MSLs) and Healthcare Reps. This system replaces manual data entry with a LangGraph-powered sidebar that extracts structured medical interaction data from natural language in real-time.

### 🏗️ Technical Architecture
The application is built with a focus on low-latency state management and schema integrity.

Orchestration: LangGraph manages the extraction workflow as a stateful graph, ensuring multi-step validation of AI-generated JSON before it hits the database.

Inference: Groq (Llama 3.3) provides sub-500ms inference, enabling a "real-time" feel for the user.

Communication: WebSockets (FastAPI) enable bi-directional sync, allowing the AI to "push" form updates to the UI without page refreshes.

Frontend State: Redux Toolkit handles the synchronization between the AI's suggested data and the user's manual overrides.

### 🚀 Key Features
Stateful AI Extraction: Parses complex narratives (e.g., "Met with Dr. Rossi, she was skeptical about the new trial but open to a follow-up") into structured Name, Sentiment, and Topic fields.

Dynamic Field Mapping: Automatically classifies interaction types (Call vs. In-Person) and sentiment scores using Pydantic-validated schemas.

Entity Resolution: Designed to cross-reference extracted names against existing SQLite records to prevent duplicate HCP entries.

Automated Action Items: Generates suggested "Next Steps" based on the discussion outcome.

### 📂 Project Structure

├── backend/
│   ├── main.py          # FastAPI server & WebSocket orchestration
│   ├── engine.py        # LangGraph StateGraph & LLM Logic
│   ├── database.py      # SQLite / SQLAlchemy CRUD operations
│   ├── models.py        # Pydantic schemas for AI output validation
│   └── .env             # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── store.js     # Redux Toolkit state management
│   │   └── components/  # Real-time Dashboard UI
└── hcp_crm.db           # Local relational database

### 📡 API & WebSocket Protocol
Endpoint: ws://localhost:8000/ws/chat

Transmission Flow:

Client Sent: { "message": "Spoke to Dr. Rossi at the clinic..." }

Server Process: LangGraph node extracts → Pydantic validates → SQLite updates.

Client Received:

JSON
{
  "type": "AI_UPDATE",
  "payload": {
    "hcp_name": "Dr. Elena Rossi",
    "sentiment": "Positive",
    "topics": ["Oncology", "Phase III Data"],
    "interaction_type": "Call",
    "suggested_followup": "Schedule deep-dive in 2 weeks"
  }
}

### 🛠️ Setup & Installation
NOTE:"Create a .env file in the /backend directory and add your GROQ_API_KEY. Refer to .env.example for the required format."

1. Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn langchain_groq langgraph python-dotenv
Add GROQ_API_KEY to .env
uvicorn main:app --reload
2. Frontend Setup
cd frontend
npm install
npm start
