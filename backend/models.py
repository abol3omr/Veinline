from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Slab(Base):
    __tablename__ = "slabs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(20))  # quartz, natural, porcelain
    width_mm: Mapped[int]
    height_mm: Mapped[int]
    thickness_mm: Mapped[int]
    image_path: Mapped[str | None] = mapped_column(String(255))