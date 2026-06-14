from typing import List
from sqlalchemy.orm import Session
from app.schemas.schemas import Service as ServiceSchema, WorkflowStep
from app.models import models

class WorkflowService:
    def get_workflow_for_intent(self, db: Session, intent_id: int) -> List[WorkflowStep]:
        # 1. Fetch the sequence of services for this intent
        intent_services = db.query(models.IntentService)\
            .filter(models.IntentService.intent_id == intent_id)\
            .order_by(models.IntentService.step_order)\
            .all()
        
        if not intent_services:
            return []

        # 2. Build the WorkflowStep list
        steps = []
        for item in intent_services:
            s_model = item.service
            service = ServiceSchema(
                id=s_model.id,
                name=s_model.name,
                department=s_model.department,
                fee=s_model.fee,
                sla_days=s_model.sla_days,
                description=s_model.description
            )
            
            # Fetch dependencies for this service
            deps = db.query(models.ServiceDependency)\
                .filter(models.ServiceDependency.service_id == s_model.id)\
                .all()
            
            dependency_ids = [d.requires_service_id for d in deps]

            steps.append(WorkflowStep(
                service=service,
                status="pending",
                dependencies=dependency_ids
            ))
            
        return steps

workflow_service = WorkflowService()
