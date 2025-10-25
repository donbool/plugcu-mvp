import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from supabase import Client
from .models import MatchResponse, MatchReasoning, BrandProfile, EventData

logger = logging.getLogger(__name__)

class MatchingEngine:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    def calculate_tag_overlap(self, brand_tags: List[str], event_tags: List[str]) -> Tuple[float, List[str]]:
        """Calculate overlap between brand preferences and event tags"""
        if not brand_tags or not event_tags:
            return 0.0, []
        
        brand_set = set(tag.lower() for tag in brand_tags)
        event_set = set(tag.lower() for tag in event_tags)
        
        intersection = brand_set.intersection(event_set)
        union = brand_set.union(event_set)
        
        if not union:
            return 0.0, []
        
        overlap_score = len(intersection) / len(union)
        matched_tags = list(intersection)
        
        return overlap_score, matched_tags
    
    def calculate_budget_alignment(self, brand_min: Optional[int], brand_max: Optional[int], 
                                 event_min: Optional[int], event_max: Optional[int]) -> Tuple[float, str]:
        """Calculate how well brand budget aligns with event sponsorship needs"""
        if not brand_min or not brand_max or not event_min or not event_max:
            return 0.5, "Budget information incomplete"
        
        # Check if there's any overlap between ranges
        overlap_start = max(brand_min, event_min)
        overlap_end = min(brand_max, event_max)
        
        if overlap_start > overlap_end:
            # No overlap
            if brand_max < event_min:
                return 0.1, f"Brand budget (${brand_max:,}) below event minimum (${event_min:,})"
            else:
                return 0.2, f"Brand budget (${brand_min:,}) above event maximum (${event_max:,})"
        
        # Calculate alignment score based on overlap size
        brand_range = brand_max - brand_min
        event_range = event_max - event_min
        overlap_size = overlap_end - overlap_start
        
        if brand_range == 0 or event_range == 0:
            return 0.8, "Perfect budget match"
        
        alignment_score = min(overlap_size / brand_range, overlap_size / event_range)
        alignment_score = max(0.3, min(1.0, alignment_score))  # Cap between 0.3 and 1.0
        
        return alignment_score, f"Good budget alignment: ${overlap_start:,} - ${overlap_end:,}"
    
    def calculate_attendance_score(self, expected_attendance: Optional[int], 
                                 brand_preferences: List[str]) -> Tuple[float, str]:
        """Score based on event attendance size vs brand preferences"""
        if not expected_attendance:
            return 0.5, "Attendance not specified"
        
        # Simple scoring based on attendance tiers
        if expected_attendance < 50:
            score = 0.3
            category = "Small intimate event"
        elif expected_attendance < 200:
            score = 0.7
            category = "Medium-sized event"
        elif expected_attendance < 500:
            score = 0.9
            category = "Large event"
        else:
            score = 1.0
            category = "Major event"
        
        # Adjust based on brand size preferences
        if "startup" in brand_preferences or "small" in brand_preferences:
            if expected_attendance < 200:
                score += 0.2
        elif "enterprise" in brand_preferences or "large" in brand_preferences:
            if expected_attendance > 200:
                score += 0.2
        
        return min(1.0, score), category
    
    def calculate_recency_score(self, event_date: Optional[datetime]) -> float:
        """Score based on how soon the event is (more recent = higher urgency/relevance)"""
        if not event_date:
            return 0.5
        
        now = datetime.now(event_date.tzinfo) if event_date.tzinfo else datetime.now()
        days_until_event = (event_date - now).days
        
        if days_until_event < 0:
            return 0.0  # Past event
        elif days_until_event <= 30:
            return 1.0  # Very urgent
        elif days_until_event <= 90:
            return 0.8  # Soon
        elif days_until_event <= 180:
            return 0.6  # Moderate planning time
        else:
            return 0.4  # Far future
    
    def calculate_demographic_match(self, brand_demographics: List[str], 
                                  university: str, org_category: Optional[str]) -> float:
        """Score demographic alignment between brand target and org/university"""
        if not brand_demographics:
            return 0.5
        
        score = 0.0
        
        # University matching
        university_lower = university.lower()
        for demo in brand_demographics:
            demo_lower = demo.lower()
            if any(term in university_lower for term in ['college', 'university', 'student']):
                score += 0.3
                break
        
        # Organization category matching
        if org_category:
            org_lower = org_category.lower()
            for demo in brand_demographics:
                demo_lower = demo.lower()
                if any(term in demo_lower for term in [org_lower, 'student', 'young adult', 'college']):
                    score += 0.4
                    break
        
        # General student demographic
        student_terms = ['student', 'college', 'university', 'young adult', '18-24', 'gen z']
        if any(term in demo.lower() for demo in brand_demographics for term in student_terms):
            score += 0.3
        
        return min(1.0, score)
    
    def compute_match_score(self, brand: BrandProfile, event: EventData) -> Tuple[float, MatchReasoning]:
        """Compute overall match score between a brand and event"""
        
        # Calculate individual component scores
        tag_score, matched_tags = self.calculate_tag_overlap(
            brand.preferred_event_types + getattr(brand, 'tags', []), 
            event.tags
        )
        
        budget_score, budget_fit = self.calculate_budget_alignment(
            brand.budget_range_min, brand.budget_range_max,
            event.sponsorship_min_amount, event.sponsorship_max_amount
        )
        
        attendance_score, attendance_category = self.calculate_attendance_score(
            event.expected_attendance, 
            [brand.company_size] if brand.company_size else []
        )
        
        recency_score = self.calculate_recency_score(event.event_date)
        
        demographic_score = self.calculate_demographic_match(
            brand.target_demographics,
            event.university,
            event.org_category
        )
        
        # Weighted final score
        final_score = (
            0.35 * tag_score +          # Most important: content/interest alignment
            0.25 * budget_score +       # Very important: financial fit
            0.20 * demographic_score +  # Important: target audience match
            0.15 * attendance_score +   # Moderately important: event size
            0.05 * recency_score        # Least important: timing urgency
        )
        
        # Generate explanation
        explanation_parts = []
        if tag_score > 0.6:
            explanation_parts.append(f"Strong interest alignment ({len(matched_tags)} matching tags)")
        elif tag_score > 0.3:
            explanation_parts.append(f"Moderate interest alignment ({len(matched_tags)} matching tags)")
        else:
            explanation_parts.append("Limited interest overlap")
        
        if budget_score > 0.7:
            explanation_parts.append("excellent budget fit")
        elif budget_score > 0.4:
            explanation_parts.append("good budget alignment")
        else:
            explanation_parts.append("budget mismatch")
        
        explanation = ", ".join(explanation_parts)
        
        reasoning = MatchReasoning(
            tag_overlap_score=tag_score,
            budget_alignment_score=budget_score,
            attendance_score=attendance_score,
            recency_score=recency_score,
            demographic_match_score=demographic_score,
            explanation=explanation,
            matched_tags=matched_tags,
            budget_fit=budget_fit,
            attendance_category=attendance_category
        )
        
        return final_score, reasoning
    
    async def compute_matches(self, event_id: Optional[str] = None, 
                            brand_id: Optional[str] = None, 
                            limit: int = 50) -> List[MatchResponse]:
        """Compute matches for either a specific event or brand"""
        
        try:
            if event_id:
                return await self._compute_matches_for_event(event_id, limit)
            elif brand_id:
                return await self._compute_matches_for_brand(brand_id, limit)
            else:
                raise ValueError("Either event_id or brand_id must be provided")
        
        except Exception as e:
            logger.error(f"Error computing matches: {str(e)}")
            raise
    
    async def _compute_matches_for_event(self, event_id: str, limit: int) -> List[MatchResponse]:
        """Compute matches for a specific event against all brands"""
        
        # Get event data
        event_response = self.supabase.table('events').select(
            'id, title, description, event_date, expected_attendance, event_type, '
            'sponsorship_min_amount, sponsorship_max_amount, sponsorship_benefits, tags, '
            'orgs(name, university, category)'
        ).eq('id', event_id).eq('status', 'published').single().execute()
        
        if not event_response.data:
            raise ValueError(f"Event {event_id} not found or not published")
        
        event_data = event_response.data
        event = EventData(
            id=event_data['id'],
            title=event_data['title'],
            description=event_data['description'],
            event_date=datetime.fromisoformat(event_data['event_date']) if event_data['event_date'] else None,
            expected_attendance=event_data['expected_attendance'],
            event_type=event_data['event_type'],
            sponsorship_min_amount=event_data['sponsorship_min_amount'],
            sponsorship_max_amount=event_data['sponsorship_max_amount'],
            sponsorship_benefits=event_data['sponsorship_benefits'] or [],
            tags=event_data['tags'] or [],
            org_name=event_data['orgs']['name'],
            university=event_data['orgs']['university'],
            org_category=event_data['orgs']['category']
        )
        
        # Get all verified brands
        brands_response = self.supabase.table('brands').select('*').eq('status', 'verified').execute()
        
        matches = []
        for brand_data in brands_response.data:
            brand = BrandProfile(**brand_data)
            score, reasoning = self.compute_match_score(brand, event)
            
            # Only include matches above minimum threshold
            if score >= 0.1:
                match = MatchResponse(
                    id=f"{brand.id}_{event.id}",
                    brand_id=brand.id,
                    event_id=event.id,
                    score=score,
                    reasoning=reasoning,
                    event_title=event.title,
                    event_date=event.event_date,
                    org_name=event.org_name,
                    university=event.university,
                    company_name=brand.company_name,
                    created_at=datetime.now()
                )
                matches.append(match)
        
        # Sort by score and limit results
        matches.sort(key=lambda x: x.score, reverse=True)
        return matches[:limit]
    
    async def _compute_matches_for_brand(self, brand_id: str, limit: int) -> List[MatchResponse]:
        """Compute matches for a specific brand against all events"""
        
        # Get brand data
        brand_response = self.supabase.table('brands').select('*').eq('id', brand_id).single().execute()
        
        if not brand_response.data:
            raise ValueError(f"Brand {brand_id} not found")
        
        brand = BrandProfile(**brand_response.data)
        
        # Get all published events
        events_response = self.supabase.table('events').select(
            'id, title, description, event_date, expected_attendance, event_type, '
            'sponsorship_min_amount, sponsorship_max_amount, sponsorship_benefits, tags, '
            'orgs(name, university, category)'
        ).eq('status', 'published').execute()
        
        matches = []
        for event_data in events_response.data:
            event = EventData(
                id=event_data['id'],
                title=event_data['title'],
                description=event_data['description'],
                event_date=datetime.fromisoformat(event_data['event_date']) if event_data['event_date'] else None,
                expected_attendance=event_data['expected_attendance'],
                event_type=event_data['event_type'],
                sponsorship_min_amount=event_data['sponsorship_min_amount'],
                sponsorship_max_amount=event_data['sponsorship_max_amount'],
                sponsorship_benefits=event_data['sponsorship_benefits'] or [],
                tags=event_data['tags'] or [],
                org_name=event_data['orgs']['name'],
                university=event_data['orgs']['university'],
                org_category=event_data['orgs']['category']
            )
            
            score, reasoning = self.compute_match_score(brand, event)
            
            # Only include matches above minimum threshold
            if score >= 0.1:
                match = MatchResponse(
                    id=f"{brand.id}_{event.id}",
                    brand_id=brand.id,
                    event_id=event.id,
                    score=score,
                    reasoning=reasoning,
                    event_title=event.title,
                    event_date=event.event_date,
                    org_name=event.org_name,
                    university=event.university,
                    company_name=brand.company_name,
                    created_at=datetime.now()
                )
                matches.append(match)
        
        # Sort by score and limit results
        matches.sort(key=lambda x: x.score, reverse=True)
        return matches[:limit]
    
    async def recompute_all_matches(self) -> int:
        """Recompute all matches and store in database"""
        
        # Clear existing matches
        self.supabase.table('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Get all brands and events
        brands_response = self.supabase.table('brands').select('*').eq('status', 'verified').execute()
        events_response = self.supabase.table('events').select(
            'id, title, description, event_date, expected_attendance, event_type, '
            'sponsorship_min_amount, sponsorship_max_amount, sponsorship_benefits, tags, '
            'orgs(name, university, category)'
        ).eq('status', 'published').execute()
        
        matches_to_insert = []
        
        for brand_data in brands_response.data:
            brand = BrandProfile(**brand_data)
            
            for event_data in events_response.data:
                event = EventData(
                    id=event_data['id'],
                    title=event_data['title'],
                    description=event_data['description'],
                    event_date=datetime.fromisoformat(event_data['event_date']) if event_data['event_date'] else None,
                    expected_attendance=event_data['expected_attendance'],
                    event_type=event_data['event_type'],
                    sponsorship_min_amount=event_data['sponsorship_min_amount'],
                    sponsorship_max_amount=event_data['sponsorship_max_amount'],
                    sponsorship_benefits=event_data['sponsorship_benefits'] or [],
                    tags=event_data['tags'] or [],
                    org_name=event_data['orgs']['name'],
                    university=event_data['orgs']['university'],
                    org_category=event_data['orgs']['category']
                )
                
                score, reasoning = self.compute_match_score(brand, event)
                
                # Only store matches above minimum threshold
                if score >= 0.1:
                    matches_to_insert.append({
                        'brand_id': brand.id,
                        'event_id': event.id,
                        'score': score,
                        'reasoning': reasoning.dict()
                    })
        
        # Batch insert matches
        if matches_to_insert:
            self.supabase.table('matches').insert(matches_to_insert).execute()
        
        return len(matches_to_insert)
    
    async def get_brand_matches(self, brand_id: str, limit: int = 50, min_score: float = 0.1) -> List[Dict]:
        """Get stored matches for a brand"""
        response = self.supabase.table('matches').select(
            'id, score, reasoning, events(title, event_date, orgs(name, university))'
        ).eq('brand_id', brand_id).gte('score', min_score).order('score', desc=True).limit(limit).execute()
        
        return response.data
    
    async def get_event_matches(self, event_id: str, limit: int = 50, min_score: float = 0.1) -> List[Dict]:
        """Get stored matches for an event"""
        response = self.supabase.table('matches').select(
            'id, score, reasoning, brands(company_name, industry)'
        ).eq('event_id', event_id).gte('score', min_score).order('score', desc=True).limit(limit).execute()
        
        return response.data