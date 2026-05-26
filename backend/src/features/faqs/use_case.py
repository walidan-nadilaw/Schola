"""Use cases for the FAQs feature."""

from uuid import UUID

from src.api.exceptions import NotFoundException
from src.domain.entity.faq import FAQ
from src.domain.entity.i_faq_repository import IFAQRepository

from .schemas import FAQResponse


def _to_response(f: FAQ) -> FAQResponse:
    return FAQResponse(
        id=str(f.id),
        question=f.question,
        answer=f.answer,
        created_at=f.created_at,
        updated_at=f.updated_at,
    )


class ListFAQsUseCase:
    """List all FAQs."""

    def __init__(self, repo: IFAQRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[FAQResponse]:
        faqs = await self._repo.findAll()
        return [_to_response(f) for f in faqs]


class GetFAQUseCase:
    """Get a single FAQ."""

    def __init__(self, repo: IFAQRepository) -> None:
        self._repo = repo

    async def execute(self, faq_id: UUID) -> FAQResponse:
        faq = await self._repo.findById(faq_id)
        if faq is None:
            raise NotFoundException("FAQ tidak ditemukan")
        return _to_response(faq)


class CreateFAQUseCase:
    """Create a new FAQ."""

    def __init__(self, repo: IFAQRepository) -> None:
        self._repo = repo

    async def execute(self, question: str, answer: str) -> FAQResponse:
        faq = FAQ.New(question=question, answer=answer)
        saved = await self._repo.save(faq)
        return _to_response(saved)


class UpdateFAQUseCase:
    """Update an existing FAQ."""

    def __init__(self, repo: IFAQRepository) -> None:
        self._repo = repo

    async def execute(self, faq_id: UUID, question: str, answer: str) -> FAQResponse:
        faq = await self._repo.findById(faq_id)
        if faq is None:
            raise NotFoundException("FAQ tidak ditemukan")
        faq.update_question(question)
        faq.update_answer(answer)
        saved = await self._repo.update(faq)
        return _to_response(saved)


class DeleteFAQUseCase:
    """Delete an FAQ."""

    def __init__(self, repo: IFAQRepository) -> None:
        self._repo = repo

    async def execute(self, faq_id: UUID) -> None:
        if not await self._repo.existsById(faq_id):
            raise NotFoundException("FAQ tidak ditemukan")
        await self._repo.deleteById(faq_id)
