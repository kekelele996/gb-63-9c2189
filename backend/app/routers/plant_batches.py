from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_admin_or_technician
from app.models import User, PlantBatch, CareLog, PlantPhoto
from app.schemas import (
    PlantBatchResponse, PlantBatchCreate, PlantBatchUpdate,
    CareLogResponse, CareLogCreate
)

router = APIRouter(prefix="/api/plant-batches", tags=["种植批次"])


@router.get("", response_model=list[PlantBatchResponse])
async def get_plant_batches(
    greenhouse_id: Optional[int] = None,
    zone_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PlantBatch)
    if greenhouse_id:
        query = query.filter(PlantBatch.greenhouse_id == greenhouse_id)
    if zone_id:
        query = query.filter(PlantBatch.zone_id == zone_id)
    if status:
        query = query.filter(PlantBatch.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (PlantBatch.batch_code.ilike(search_pattern)) |
            (PlantBatch.flower_variety.ilike(search_pattern))
        )
    batches = query.order_by(PlantBatch.created_at.desc()).all()
    return batches


@router.get("/{batch_id}", response_model=PlantBatchResponse)
async def get_plant_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    return batch


@router.post("", response_model=PlantBatchResponse)
async def create_plant_batch(
    batch_in: PlantBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    existing = db.query(PlantBatch).filter(
        PlantBatch.batch_code == batch_in.batch_code
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="批次代码已存在"
        )
    batch = PlantBatch(**batch_in.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.put("/{batch_id}", response_model=PlantBatchResponse)
async def update_plant_batch(
    batch_id: int,
    batch_in: PlantBatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    update_data = batch_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(batch, field, value)
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/{batch_id}")
async def delete_plant_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    db.delete(batch)
    db.commit()
    return {"message": "种植批次已删除"}


@router.get("/{batch_id}/care-logs", response_model=list[CareLogResponse])
async def get_care_logs(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(CareLog).filter(
        CareLog.batch_id == batch_id
    ).order_by(CareLog.log_date.desc()).all()
    return logs


@router.post("/{batch_id}/care-logs", response_model=CareLogResponse)
async def add_care_log(
    batch_id: int,
    log_in: CareLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    log_data = log_in.model_dump()
    log_data["batch_id"] = batch_id
    if not log_data.get("log_date"):
        log_data["log_date"] = datetime.utcnow()
    if not log_data.get("operator_name"):
        log_data["operator_name"] = current_user.full_name
    log = CareLog(**log_data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{batch_id}/photos")
async def get_plant_photos(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    photos = db.query(PlantPhoto).filter(
        PlantPhoto.batch_id == batch_id
    ).order_by(PlantPhoto.taken_date.desc()).all()
    return photos


@router.post("/{batch_id}/photos")
async def add_plant_photo(
    batch_id: int,
    photo_url: str,
    caption: Optional[str] = None,
    taken_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(PlantBatch).filter(PlantBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="种植批次不存在"
        )
    photo = PlantPhoto(
        batch_id=batch_id,
        photo_url=photo_url,
        caption=caption,
        taken_date=taken_date
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo
