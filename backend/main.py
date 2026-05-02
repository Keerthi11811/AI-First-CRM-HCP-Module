import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from typing import TypedDict

load_dotenv()

# --- LANGGRAPH SETUP ---
class AgentState(TypedDict):
    messages: list
    hcp_data: dict

# UPDATED MODEL TO LLAMA-3.3-70B
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

def extract_info(state: AgentState):
    user_message = state["messages"][-1]
    
    prompt = f"""
    You are a CRM Data Extractor. Extract information from this log: "{user_message}"
    
    RETURN ONLY A JSON OBJECT with these exact keys:
    1. "hcp_name": The doctor's name.
    2. "interaction_type": Must be exactly "Meeting", "Call", or "Email". (e.g., 'met'='Meeting', 'phoned'='Call')
    3. "attendees": Names of people present other than the HCP.
    4. "location": The facility, hospital, or clinic name mentioned.
    5. "sentiment": Must be "positive", "neutral", or "negative".
    6. "topics": Summary of the clinical/product discussion.
    7. "outcomes": Agreements or next steps.
    8. "follow_ups": List of actions.

    If a value is missing, return an empty string "" instead of null.
    """
    
    response = llm.invoke(prompt)
    content = response.content if hasattr(response, 'content') else response
    
    try:
        clean_content = content.replace("```json", "").replace("```", "").strip()
        extracted = json.loads(clean_content)
        
        # Validation to ensure Interaction Type matches the <select> options exactly
        if extracted.get("interaction_type") not in ["Meeting", "Call", "Email"]:
            extracted["interaction_type"] = "Meeting" # Default fallback
            
    except:
        extracted = {
            "hcp_name": "Unknown", "interaction_type": "Meeting", 
            "attendees": "", "location": "", "sentiment": "neutral", 
            "topics": user_message, "outcomes": "", "follow_ups": []
        }
        
    return {"hcp_data": extracted}

workflow = StateGraph(AgentState)
workflow.add_node("extractor", extract_info)
workflow.set_entry_point("extractor")
workflow.add_edge("extractor", END)
graph = workflow.compile()

# --- FASTAPI APP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            user_input = data.get("message")
            
            result = graph.invoke({"messages": [user_input]})
            hcp_info = result.get("hcp_data", {})
            
            # Broadcast back to Frontend
            await websocket.send_json({
                "type": "AI_UPDATE",
                "payload": {
                    "hcp_name": hcp_info.get("hcp_name", "Unknown"),
                    "sentiment": hcp_info.get("sentiment", "neutral").lower(),
                    "topics": hcp_info.get("topics", "N/A"),
                    "follow_ups": [
                        "Schedule follow-up meeting in 2 weeks",
                        "Send OncoBoost Phase III PDF",
                        "Add HCP to advisory board invite list"
                    ]
                }
            })
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Server Error: {e}")