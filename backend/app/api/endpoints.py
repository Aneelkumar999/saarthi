from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.schemas import UserJourneyRequest, ChatRequest, ChatResponse, WorkflowStep
from app.services.ai_service import ai_service
from app.services.workflow_service import workflow_service
from app.core.database import get_db
from typing import List

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Parse intent from the message
    intent_data = await ai_service.parse_intent(db, request.message)
    intent_id = intent_data.get("intent_id")
    
    roadmap = await ai_service.generate_roadmap(db, request.message)
    response_text = roadmap.get("response") if roadmap else await ai_service.get_chat_response(db, request.message)
    
    # If a clear intent is found, customize the response
    if intent_id:
        response_text += f"\n\nI've identified your goal: {intent_data.get('intent_name')}. I'm generating a roadmap for you."
    
    return ChatResponse(
        response=response_text,
        intent_id=intent_id,
        roadmap=roadmap
    )

@router.get("/workflow/{intent_id}", response_model=List[WorkflowStep])
async def get_workflow(intent_id: int, db: Session = Depends(get_db)):
    steps = workflow_service.get_workflow_for_intent(db, intent_id)
    if not steps:
        raise HTTPException(status_code=404, detail="Workflow not found for this intent")
    return steps

@router.post("/parse-intent")
async def parse_intent(request: UserJourneyRequest, db: Session = Depends(get_db)):
    return await ai_service.parse_intent(db, request.query)
