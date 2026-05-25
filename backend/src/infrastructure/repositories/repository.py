from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable
from typing import Generic, TypeVar

T = TypeVar("T")
ID = TypeVar("ID")


class IRepository(ABC, Generic[T, ID]):
    @abstractmethod
    async def save(self, entity: T) -> T:
        pass

    @abstractmethod
    async def saveAll(self, entities: Iterable[T]) -> Iterable[T]:
        pass

    @abstractmethod
    async def findById(self, id: ID) -> T | None:
        pass

    @abstractmethod
    async def existsById(self, id: ID) -> bool:
        pass

    @abstractmethod
    async def findAll(self) -> Iterable[T]:
        pass

    @abstractmethod
    async def findAllById(self, ids: Iterable[ID]) -> Iterable[T]:
        pass

    @abstractmethod
    async def count(self) -> int:
        pass

    @abstractmethod
    async def deleteById(self, id: ID) -> None:
        pass

    @abstractmethod
    async def delete(self, entity: T) -> None:
        pass

    @abstractmethod
    async def deleteAllById(self, ids: Iterable[ID]) -> None:
        pass

    @abstractmethod
    async def deleteAll(self, entities: Iterable[T] | None = None) -> None:
        pass
