from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
from .matching import MatchingEngine
from .models import MatchRequest, MatchResponse, BrandProfile, EventData

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PlugCU Matching API",
    description="Matching engine for connecting brands with student organization events",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://plugcu.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

supabase: Client = create_client(supabase_url, supabase_key)

# Security
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase JWT token"""
    try:
        # In production, you'd verify the JWT token here
        # For now, we'll trust that the frontend handles auth
        return credentials.credentials
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Initialize matching engine
matching_engine = MatchingEngine(supabase)

@app.get("/")
async def root():
    return {"message": "PlugCU Matching API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "matching-api"}

@app.post("/api/v1/compute-matches", response_model=List[MatchResponse])
async def compute_matches(
    request: MatchRequest,
    token: str = Depends(verify_token)
):
    """
    Compute matches for a specific event or brand
    """
    try:
        matches = await matching_engine.compute_matches(
            event_id=request.event_id,
            brand_id=request.brand_id,
            limit=request.limit or 50
        )
        return matches
    except Exception as e:
        logger.error(f"Error computing matches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compute matches: {str(e)}")

@app.post("/api/v1/recompute-all-matches")
async def recompute_all_matches(token: str = Depends(verify_token)):
    """
    Recompute all matches in the system (admin only)
    """
    try:
        result = await matching_engine.recompute_all_matches()
        return {"message": "All matches recomputed successfully", "count": result}
    except Exception as e:
        logger.error(f"Error recomputing all matches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to recompute matches: {str(e)}")

@app.get("/api/v1/matches/{brand_id}")
async def get_brand_matches(
    brand_id: str,
    limit: Optional[int] = 50,
    min_score: Optional[float] = 0.1,
    token: str = Depends(verify_token)
):
    """
    Get all matches for a specific brand
    """
    try:
        matches = await matching_engine.get_brand_matches(
            brand_id=brand_id,
            limit=limit,
            min_score=min_score
        )
        return matches
    except Exception as e:
        logger.error(f"Error getting brand matches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {str(e)}")

@app.get("/api/v1/event-matches/{event_id}")
async def get_event_matches(
    event_id: str,
    limit: Optional[int] = 50,
    min_score: Optional[float] = 0.1,
    token: str = Depends(verify_token)
):
    """
    Get all matches for a specific event
    """
    try:
        matches = await matching_engine.get_event_matches(
            event_id=event_id,
            limit=limit,
            min_score=min_score
        )
        return matches
    except Exception as e:
        logger.error(f"Error getting event matches: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)