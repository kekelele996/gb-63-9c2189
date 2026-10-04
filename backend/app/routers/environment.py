from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user, require_admin_or_technician
from app.models import User, Sensor, SensorReading, Device, DeviceControlLog
from app.schemas import (
    SensorResponse, SensorCreate, SensorUpdate,
    SensorReadingResponse,
    DeviceResponse, DeviceCreate, DeviceUpdate, DeviceControl
)
import random

router = APIRouter(tags=["环境监测"])


@router.get("/api/sensors", response_model=list[SensorResponse])
async def get_sensors(
    zone_id: Optional[int] = None,
    sensor_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sensor)
    if zone_id:
        query = query.filter(Sensor.zone_id == zone_id)
    if sensor_type:
        query = query.filter(Sensor.sensor_type == sensor_type)
    if is_active is not None:
        query = query.filter(Sensor.is_active == is_active)
    sensors = query.order_by(Sensor.created_at.desc()).all()
    return sensors


@router.post("/api/sensors", response_model=SensorResponse)
async def create_sensor(
    sensor_in: SensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    existing = db.query(Sensor).filter(Sensor.code == sensor_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="传感器代码已存在"
        )
    sensor = Sensor(**sensor_in.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.put("/api/sensors/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: int,
    sensor_in: SensorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="传感器不存在"
        )
    update_data = sensor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sensor, field, value)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.delete("/api/sensors/{sensor_id}")
async def delete_sensor(
    sensor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="传感器不存在"
        )
    db.delete(sensor)
    db.commit()
    return {"message": "传感器已删除"}


@router.get("/api/sensors/{sensor_id}/readings", response_model=list[SensorReadingResponse])
async def get_sensor_readings(
    sensor_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="传感器不存在"
        )
    query = db.query(SensorReading).filter(SensorReading.sensor_id == sensor_id)
    if start_time:
        query = query.filter(SensorReading.reading_time >= start_time)
    if end_time:
        query = query.filter(SensorReading.reading_time <= end_time)
    readings = query.order_by(
        SensorReading.reading_time.desc()
    ).limit(limit).all()
    return readings


@router.post("/api/sensors/{sensor_id}/readings", response_model=SensorReadingResponse)
async def add_sensor_reading(
    sensor_id: int,
    value: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="传感器不存在"
        )
    reading = SensorReading(sensor_id=sensor_id, value=value)
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/api/sensors/stats")
async def get_sensor_stats(
    sensor_id: int,
    hours: int = Query(24, ge=1, le=720),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="传感器不存在"
        )
    start_time = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(
        func.avg(SensorReading.value).label("avg_value"),
        func.min(SensorReading.value).label("min_value"),
        func.max(SensorReading.value).label("max_value"),
        func.count(SensorReading.id).label("count")
    ).filter(
        SensorReading.sensor_id == sensor_id,
        SensorReading.reading_time >= start_time
    )
    result = query.first()
    latest_reading = db.query(SensorReading).filter(
        SensorReading.sensor_id == sensor_id
    ).order_by(SensorReading.reading_time.desc()).first()
    return {
        "sensor_id": sensor.id,
        "sensor_name": sensor.name,
        "sensor_type": sensor.sensor_type.value,
        "unit": sensor.unit,
        "current_value": latest_reading.value if latest_reading else None,
        "avg_value": result.avg_value if result else None,
        "min_value": result.min_value if result else None,
        "max_value": result.max_value if result else None,
        "reading_count": result.count if result else 0,
        "period_hours": hours
    }


@router.get("/api/devices", response_model=list[DeviceResponse])
async def get_devices(
    zone_id: Optional[int] = None,
    device_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Device)
    if zone_id:
        query = query.filter(Device.zone_id == zone_id)
    if device_type:
        query = query.filter(Device.device_type == device_type)
    if is_active is not None:
        query = query.filter(Device.is_active == is_active)
    devices = query.order_by(Device.created_at.desc()).all()
    return devices


@router.post("/api/devices", response_model=DeviceResponse)
async def create_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    existing = db.query(Device).filter(Device.code == device_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="设备代码已存在"
        )
    device = Device(**device_in.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.put("/api/devices/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    update_data = device_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.post("/api/devices/{device_id}/control", response_model=DeviceResponse)
async def control_device(
    device_id: int,
    control: DeviceControl,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    action = control.action.lower()
    if action not in ["on", "off"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的控制动作，必须是 'on' 或 'off'"
        )
    device.is_on = action == "on"
    device.last_control_time = datetime.utcnow()
    log = DeviceControlLog(
        device_id=device.id,
        action=action,
        triggered_by=f"user:{current_user.username}",
        reason=control.reason or f"手动控制: {action}"
    )
    db.add(log)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/api/devices/{device_id}")
async def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    db.delete(device)
    db.commit()
    return {"message": "设备已删除"}
