from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class GenerateRequest(BaseModel):
    userId: str
    task: str
    prompt: str

class GenerateResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    task: str
    prompt: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    task: str
    title: str
    messages: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "MUN Assistant API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """
    Generate AI response for MUN tasks
    Available tasks: amendments, situation assessment, directive, draft resolution, 
    background guide, poi/poo/r2r, post assessment, probable outcomes, rebuttal, research, speech, strategy
    """
    try:
        # Here you would integrate with your AI service
        # For now, I'll create a mock response based on the task type
        
        task_responses = {
            "amendments": f"Here's an analysis and proposed amendments for your directive:\n\n**Key Areas for Amendment:**\n1. Strengthen enforcement mechanisms\n2. Clarify jurisdictional scope\n3. Add implementation timeline\n\n**Detailed Amendments:**\n{request.prompt}",
            "situation assessment": f"**Current Situation Analysis:**\n\nBased on your query: {request.prompt}\n\n**Key Factors:**\n1. Political dynamics\n2. Economic implications\n3. Security concerns\n\n**Recommendations:** Immediate diplomatic intervention required.",
            "directive": f"**DIRECTIVE**\n\n**Subject:** {request.prompt}\n\n**Operative Clauses:**\n1. CALLS UPON all member states to...\n2. REQUESTS the Secretary-General to...\n3. DECIDES to establish...",
            "draft resolution": f"**DRAFT RESOLUTION**\n\n**The [Committee Name],**\n\n**Recalling** previous resolutions on this matter,\n**Noting with concern** the current situation regarding {request.prompt},\n\n**Operative Clauses:**\n1. **Affirms** the commitment to...\n2. **Calls upon** all member states to...",
            "background guide": f"**BACKGROUND GUIDE**\n\n**Topic:** {request.prompt}\n\n**Historical Context:**\nThis issue has been a significant concern for the international community...\n\n**Current Status:**\nRecent developments include...\n\n**Key Players:**\n- Major powers\n- Regional actors\n- International organizations",
            "poi/poo/r2r": f"**Point of Information/Order Response:**\n\nRegarding your query: {request.prompt}\n\n**Response:**\nThank you for that question. The delegate would like to clarify...\n\n**Follow-up:** This relates directly to our position on...",
            "post assessment": f"**POST-COMMITTEE ASSESSMENT**\n\n**Performance Review:** {request.prompt}\n\n**Strengths:**\n- Effective negotiation\n- Strong research\n- Clear communication\n\n**Areas for Improvement:**\n- Timing of interventions\n- Alliance building",
            "probable outcomes": f"**PROBABLE OUTCOMES ANALYSIS**\n\n**Scenario:** {request.prompt}\n\n**Most Likely Outcomes:**\n1. **Scenario A (60% probability):** Diplomatic resolution\n2. **Scenario B (30% probability):** Stalemate requiring mediation\n3. **Scenario C (10% probability):** Escalation requiring intervention",
            "rebuttal": f"**REBUTTAL**\n\n**Responding to:** {request.prompt}\n\n**Counter-arguments:**\n1. The opposing delegate's position fails to consider...\n2. Recent evidence contradicts their assertion that...\n3. Our proposal addresses these concerns by...\n\n**Conclusion:** We respectfully disagree and maintain our position.",
            "research": f"**RESEARCH BRIEF**\n\n**Topic:** {request.prompt}\n\n**Key Findings:**\n1. Historical precedents show...\n2. Current international law states...\n3. Expert opinions suggest...\n\n**Sources:**\n- UN Documents\n- Academic research\n- Policy papers",
            "speech": f"**SPEECH DRAFT**\n\n**Honorable Chair, Distinguished Delegates,**\n\nRegarding {request.prompt}, my delegation would like to emphasize the following key points:\n\n**First,** the current situation requires immediate attention...\n\n**Second,** we propose a comprehensive approach...\n\n**In conclusion,** we urge all delegates to support this initiative.\n\nThank you.",
            "strategy": f"**STRATEGIC PLAN**\n\n**Objective:** {request.prompt}\n\n**Phase 1: Preparation**\n- Research key positions\n- Identify potential allies\n- Prepare talking points\n\n**Phase 2: Execution**\n- Build coalitions\n- Present proposals\n- Negotiate amendments\n\n**Phase 3: Resolution**\n- Secure votes\n- Address objections\n- Finalize agreement"
        }
        
        # Get response based on task type
        ai_response = task_responses.get(request.task, f"I'll help you with {request.task}. Here's my analysis of: {request.prompt}")
        
        # Create response object
        response_obj = GenerateResponse(
            userId=request.userId,
            task=request.task,
            prompt=request.prompt,
            response=ai_response
        )
        
        # Store in database
        await db.mun_responses.insert_one(response_obj.dict())
        
        return response_obj
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

@api_router.post("/chat/sessions", response_model=ChatSession)
async def create_chat_session(userId: str, task: str, title: str = "New Chat"):
    """Create a new chat session for a specific task"""
    session = ChatSession(
        userId=userId,
        task=task,
        title=title
    )
    await db.chat_sessions.insert_one(session.dict())
    return session

@api_router.get("/chat/sessions/{userId}/{task}", response_model=List[ChatSession])
async def get_chat_sessions(userId: str, task: str):
    """Get all chat sessions for a user and task"""
    sessions = await db.chat_sessions.find({"userId": userId, "task": task}).sort("updated_at", -1).to_list(100)
    return [ChatSession(**session) for session in sessions]

@api_router.get("/chat/sessions/{session_id}", response_model=ChatSession)
async def get_chat_session(session_id: str):
    """Get a specific chat session"""
    session = await db.chat_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSession(**session)

@api_router.post("/chat/sessions/{session_id}/messages")
async def add_message_to_session(session_id: str, message: ChatMessage):
    """Add a message to a chat session"""
    await db.chat_sessions.update_one(
        {"id": session_id},
        {
            "$push": {"messages": message.dict()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return {"success": True}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()