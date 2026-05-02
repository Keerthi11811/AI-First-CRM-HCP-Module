import os
from typing import Annotated, List, TypedDict
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
import json

# Define state structure
class CRMState(TypedDict):
    messages: Annotated[List[BaseMessage], "history"]
    hcp_data: dict

# Initialize Gemma 2 9B via Groq
# Change this line in backend/engine.py
llm = ChatGroq(
    model="gemma2-9b-it", 
    temperature=0, 
    groq_api_key="Your Key" # Paste your actual key inside the quotes
)

def agent_node(state: CRMState):
    # System instructions to extract HCP data
    system_instruction = (
        "You are an AI CRM assistant. From the conversation, extract: "
        "1. HCP Name, 2. Sentiment, 3. Key Topics. "
        "Return the response in this JSON format: "
        '{"hcp_name": "...", "sentiment": "...", "topics": "..."}'
    )
    
    # Process the last message
    last_msg = state["messages"][-1].content
    response = llm.invoke([{"role": "system", "content": system_instruction}, {"role": "user", "content": last_msg}])
    
    try:
        parsed_data = json.loads(response.content)
    except:
        parsed_data = {"hcp_name": "Unknown", "sentiment": "Neutral", "topics": "N/A"}
        
    return {"hcp_data": parsed_data, "messages": [response]}

# Build Graph
builder = StateGraph(CRMState)
builder.add_node("agent", agent_node)
builder.set_entry_point("agent")
builder.add_edge("agent", END)
graph = builder.compile()