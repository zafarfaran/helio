"""Anthropic Claude LLM adapter."""

from collections.abc import AsyncGenerator

import anthropic

from app.config import get_settings
from app.core.logging import get_logger
from app.services.llm.types import (
    DoneEvent,
    ErrorEvent,
    StatusEvent,
    StatusPhase,
    StreamEvent,
    TokenEvent,
)

logger = get_logger(__name__)


class ClaudeProvider:
    def __init__(self):
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.ai_model
        logger.info("Claude provider initialized", model=self.model)

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        system_prompt: str,
    ) -> AsyncGenerator[StreamEvent, None]:
        logger.info(
            "Starting Claude stream",
            message_count=len(messages),
            model=self.model,
        )

        yield StatusEvent(phase=StatusPhase.UNDERSTANDING)

        first_token = True
        input_tokens = 0
        output_tokens = 0

        try:
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            if first_token:
                                yield StatusEvent(
                                    phase=StatusPhase.GENERATING_RESPONSE,
                                )
                                first_token = False
                            yield TokenEvent(content=event.delta.text)
                    elif event.type == "message_start":
                        if event.message and event.message.usage:
                            input_tokens = event.message.usage.input_tokens
                    elif event.type == "message_delta":
                        if hasattr(event, "usage") and event.usage:
                            output_tokens = event.usage.output_tokens

            logger.info(
                "Claude stream completed",
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
            yield StatusEvent(phase=StatusPhase.COMPLETE)

        except anthropic.APIError as e:
            logger.error(
                "Claude API error",
                error=str(e),
                status_code=getattr(e, "status_code", None),
            )
            yield ErrorEvent(error=str(e), code="CLAUDE_API_ERROR")
        except Exception as e:
            logger.exception("Unexpected error during Claude stream")
            yield ErrorEvent(error=str(e), code="LLM_STREAM_ERROR")
