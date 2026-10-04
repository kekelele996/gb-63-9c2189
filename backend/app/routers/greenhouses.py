from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_admin_or_technician
from app.models import User, Greenhouse, Zone
from app.schemas import (
    GreenhouseResponse, GreenhouseCreate, GreenhouseUpdate,
    ZoneResponse, ZoneCreate, ZoneUpdate
)

router = APIRouter(prefix="/api/greenhouses", tags=["温室管理"])


@router.get("", response_model=list[GreenhouseResponse])
async def get_greenhouses(
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Greenhouse)
    if is_active is not None:
        query = query.filter(Greenhouse.is_active == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Greenhouse.name.ilike(search_pattern)) |
            (Greenhouse.code.ilike(search_pattern))
        )
    greenhouses = query.order_by(Greenhouse.created_at.desc()).all()
    return greenhouses


@router.get("/{greenhouse_id}", response_model=GreenhouseResponse)
async def get_greenhouse(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    greenhouse = db.query(Greenhouse).filter(
        Greenhouse.id == greenhouse_id
    ).first()
    if not greenhouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="温室不存在"
        )
    return greenhouse


@router.post("", response_model=GreenhouseResponse)
async def create_greenhouse(
    greenhouse_in: GreenhouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    existing = db.query(Greenhouse).filter(
        Greenhouse.code == greenhouse_in.code
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="温室代码已存在"
        )
    greenhouse = Greenhouse(**greenhouse_in.model_dump())
    db.add(greenhouse)
    db.commit()
    db.refresh(greenhouse)
    return greenhouse


@router.put("/{greenhouse_id}", response_model=GreenhouseResponse)
async def update_greenhouse(
    greenhouse_id: int,
    greenhouse_in: GreenhouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    greenhouse = db.query(Greenhouse).filter(
        Greenhouse.id == greenhouse_id
    ).first()
    if not greenhouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="温室不存在"
        )
    update_data = greenhouse_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(greenhouse, field, value)
    db.commit()
    db.refresh(greenhouse)
    return greenhouse


@router.delete("/{greenhouse_id}")
async def delete_greenhouse(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    greenhouse = db.query(Greenhouse).filter(
        Greenhouse.id == greenhouse_id
    ).first()
    if not greenhouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="温室不存在"
        )
    db.delete(greenhouse)
    db.commit()
    return {"message": "温室已删除"}


@router.get("/{greenhouse_id}/zones", response_model=list[ZoneResponse])
async def get_greenhouse_zones(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    zones = db.query(Zone).filter(
        Zone.greenhouse_id == greenhouse_id
    ).order_by(Zone.created_at.desc()).all()
    return zones


@router.post("/zones", response_model=ZoneResponse)
async def create_zone(
    zone_in: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    existing = db.query(Zone).filter(
        Zone.greenhouse_id == zone_in.greenhouse_id,
        Zone.code == zone_in.code
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="区域代码在该温室中已存在"
        )
    zone = Zone(**zone_in.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: int,
    zone_in: ZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="区域不存在"
        )
    update_data = zone_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/zones/{zone_id}")
async def delete_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="区域不存在"
        )
    db.delete(zone)
    db.commit()
    return {"message": "区域已删除"}
