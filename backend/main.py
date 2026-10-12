from typing import Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Slab

Base.metadata.create_all(engine)  # create the tables if they don't exist

app = FastAPI(title="Veinline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SlabIn(BaseModel):
    name: str
    type: Literal["quartz", "natural", "porcelain"]
    width_mm: int
    height_mm: int
    thickness_mm: int


class SlabOut(SlabIn):
    id: int
    image_path: str | None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/slabs", response_model=list[SlabOut])
def list_slabs(db: Session = Depends(get_db)):
    return db.scalars(select(Slab).order_by(Slab.id)).all()


@app.post("/slabs", response_model=SlabOut)
def create_slab(slab: SlabIn, db: Session = Depends(get_db)):
    row = Slab(**slab.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row