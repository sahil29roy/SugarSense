from fastapi import APIRouter, Depends, Path, Query, status

from app.schemas.screening import (
    ScreeningListResponse,
    ScreeningRecordResponse,
    ScreeningStatsResponse,
)
from app.services.screening_service import ScreeningService, get_screening_service

router = APIRouter(prefix="/api/v1", tags=["Screening History & Statistics"])


@router.get(
    "/screenings",
    response_model=ScreeningListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Screening History",
    description="Retrieve paginated screening records sorted in descending chronological order (newest first).",
)
def list_screenings(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of screening records to return (1 to 100).",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of records to skip for pagination.",
    ),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningListResponse:
    """Return paginated screening records from the database."""
    return service.get_screenings(limit=limit, offset=offset)


@router.get(
    "/screenings/{screening_id}",
    response_model=ScreeningRecordResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Screening Record by ID",
    description="Retrieve a single educational screening record using its unique MongoDB ObjectId.",
)
def get_screening(
    screening_id: str = Path(
        ...,
        description="24-character hexadecimal MongoDB ObjectId string.",
        examples=["67213bfa7f21e51b145d8123"],
    ),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningRecordResponse:
    """Return a single persisted screening record."""
    return service.get_screening_by_id(screening_id)


@router.get(
    "/stats",
    response_model=ScreeningStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Screening Dashboard Statistics",
    description=(
        "Retrieve aggregated metrics calculated from actual screening records, "
        "including positive/negative prediction breakdown and top reported symptoms."
    ),
)
def get_screening_statistics(
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningStatsResponse:
    """Return aggregated statistical summaries calculated directly from stored screening records."""
    return service.get_stats()
