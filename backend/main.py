import uuid
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Slab

Base.metadata.create_all(engine)  # create the tables if they don't exist

# slab photos are saved in <project>/data/slabs
IMAGES_DIR = Path(__file__).resolve().parent.parent / "data" / "slabs"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Veinline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# makes every file in data/slabs reachable at http://localhost:8000/images/<file>
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")


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


@app.post("/slabs/{slab_id}/image", response_model=SlabOut)
def upload_slab_image(slab_id: int, file: UploadFile, db: Session = Depends(get_db)):
    slab = db.get(Slab, slab_id)
    if slab is None:
        raise HTTPException(status_code=404, detail="Slab not found")

    try:
        image = Image.open(file.file).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="File is not an image")

    # slabs are stored landscape (width is the long side), so turn portrait photos
    if image.height > image.width:
        image = image.rotate(90, expand=True)

    # a new name on every upload, so the browser never shows an old cached photo
    filename = f"{slab_id}-{uuid.uuid4().hex[:8]}.jpg"
    image.save(IMAGES_DIR / filename, quality=92)

    if slab.image_path:  # remove the previous photo of this slab
        (IMAGES_DIR / slab.image_path).unlink(missing_ok=True)

    slab.image_path = filename
    db.commit()
    db.refresh(slab)
    return slab