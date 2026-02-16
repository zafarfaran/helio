"""Client CRUD endpoints."""

from fastapi import APIRouter, Depends
from structlog.stdlib import BoundLogger

from app.dependencies import get_request_logger

router = APIRouter(tags=["clients"])


@router.get("/clients")
async def list_clients(
    logger: BoundLogger = Depends(get_request_logger),
) -> dict[str, list[object]]:
    """List all clients (placeholder)."""
    logger.info("Listing clients")
    return {"clients": []}


@router.post("/clients")
async def create_client(
    logger: BoundLogger = Depends(get_request_logger),
) -> dict[str, str]:
    """Create a client (placeholder)."""
    logger.info("Creating client")
    return {"message": "Client creation — not yet implemented"}
