"""Chat endpoint — AI streaming responses."""

from fastapi import APIRouter, Depends
from structlog.stdlib import BoundLogger

from app.dependencies import get_request_logger

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(
    logger: BoundLogger = Depends(get_request_logger),
) -> dict[str, str]:
    """AI chat endpoint (placeholder)."""
    logger.info("Chat request received")
    return {"message": "Chat endpoint — not yet implemented"}
