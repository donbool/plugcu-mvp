from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT_ORG = "student_org"
    BRAND = "brand"
    ADMIN = "admin"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class BrandProfile(BaseModel):
    id: str
    company_name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    target_demographics: List[str] = []
    budget_range_min: Optional[int] = None
    budget_range_max: Optional[int] = None
    preferred_event_types: List[str] = []
    geographic_focus: List[str] = []

class EventData(BaseModel):
    id: str
    title: str
    description: str
    event_date: Optional[datetime] = None
    expected_attendance: Optional[int] = None
    event_type: Optional[str] = None
    sponsorship_min_amount: Optional[int] = None
    sponsorship_max_amount: Optional[int] = None
    sponsorship_benefits: List[str] = []
    tags: List[str] = []
    
    # Organization info
    org_name: str
    university: str
    org_category: Optional[str] = None

class MatchRequest(BaseModel):
    event_id: Optional[str] = None
    brand_id: Optional[str] = None
    limit: Optional[int] = Field(default=50, ge=1, le=100)

class MatchReasoning(BaseModel):
    tag_overlap_score: float = Field(ge=0, le=1)
    budget_alignment_score: float = Field(ge=0, le=1)
    attendance_score: float = Field(ge=0, le=1)
    recency_score: float = Field(ge=0, le=1)
    demographic_match_score: float = Field(ge=0, le=1)
    
    explanation: str
    matched_tags: List[str] = []
    budget_fit: str
    attendance_category: str

class MatchResponse(BaseModel):
    id: str
    brand_id: str
    event_id: str
    score: float = Field(ge=0, le=1)
    reasoning: MatchReasoning
    
    # Event details for convenience
    event_title: str
    event_date: Optional[datetime] = None
    org_name: str
    university: str
    
    # Brand details for convenience
    company_name: str
    
    created_at: datetime

class CreateMatchRequest(BaseModel):
    brand_id: str
    event_id: str
    score: float = Field(ge=0, le=1)
    reasoning: Dict[str, Any]