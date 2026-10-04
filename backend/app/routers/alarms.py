from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_admin_or_technician
from app.models import (
    User, AlarmRule, Alarm, AlarmStatus, AutoControlRule,
    Notification
)
from app.schemas import (
    AlarmRuleResponse, AlarmRuleCreate, AlarmRuleUpdate,
    AlarmResponse,
    AutoControlRuleResponse, AutoControlRuleCreate, AutoControlRuleUpdate
)

router = APIRouter(tags=["告警管理"])


@router.get("/api/alarm-rules", response_model=list[AlarmRuleResponse])
async def get_alarm_rules(
    sensor_id: Optional[int] = None,
    is_enabled: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AlarmRule)
    if sensor_id:
        query = query.filter(AlarmRule.sensor_id == sensor_id)
    if is_enabled is not None:
        query = query.filter(AlarmRule.is_enabled == is_enabled)
    rules = query.order_by(AlarmRule.created_at.desc()).all()
    return rules


@router.post("/api/alarm-rules", response_model=AlarmRuleResponse)
async def create_alarm_rule(
    rule_in: AlarmRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = AlarmRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/api/alarm-rules/{rule_id}", response_model=AlarmRuleResponse)
async def update_alarm_rule(
    rule_id: int,
    rule_in: AlarmRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = db.query(AlarmRule).filter(AlarmRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警规则不存在"
        )
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/api/alarm-rules/{rule_id}")
async def delete_alarm_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = db.query(AlarmRule).filter(AlarmRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警规则不存在"
        )
    db.delete(rule)
    db.commit()
    return {"message": "告警规则已删除"}


@router.get("/api/alarms", response_model=list[AlarmResponse])
async def get_alarms(
    rule_id: Optional[int] = None,
    status: Optional[AlarmStatus] = None,
    level: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alarm)
    if rule_id:
        query = query.filter(Alarm.rule_id == rule_id)
    if status:
        query = query.filter(Alarm.status == status)
    if level:
        query = query.filter(Alarm.level == level)
    if start_time:
        query = query.filter(Alarm.created_at >= start_time)
    if end_time:
        query = query.filter(Alarm.created_at <= end_time)
    alarms = query.order_by(Alarm.created_at.desc()).limit(limit).all()
    return alarms


@router.put("/api/alarms/{alarm_id}/acknowledge", response_model=AlarmResponse)
async def acknowledge_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )
    alarm.status = AlarmStatus.ACKNOWLEDGED
    alarm.acknowledged_at = datetime.utcnow()
    alarm.user_id = current_user.id
    db.commit()
    db.refresh(alarm)
    return alarm


@router.put("/api/alarms/{alarm_id}/resolve", response_model=AlarmResponse)
async def resolve_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )
    alarm.status = AlarmStatus.RESOLVED
    alarm.resolved_at = datetime.utcnow()
    alarm.user_id = current_user.id
    db.commit()
    db.refresh(alarm)
    return alarm


@router.get("/api/auto-control-rules", response_model=list[AutoControlRuleResponse])
async def get_auto_control_rules(
    device_id: Optional[int] = None,
    is_enabled: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AutoControlRule)
    if device_id:
        query = query.filter(AutoControlRule.device_id == device_id)
    if is_enabled is not None:
        query = query.filter(AutoControlRule.is_enabled == is_enabled)
    rules = query.order_by(AutoControlRule.created_at.desc()).all()
    return rules


@router.post("/api/auto-control-rules", response_model=AutoControlRuleResponse)
async def create_auto_control_rule(
    rule_in: AutoControlRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = AutoControlRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/api/auto-control-rules/{rule_id}", response_model=AutoControlRuleResponse)
async def update_auto_control_rule(
    rule_id: int,
    rule_in: AutoControlRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = db.query(AutoControlRule).filter(AutoControlRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="自动控制规则不存在"
        )
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/api/auto-control-rules/{rule_id}")
async def delete_auto_control_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    rule = db.query(AutoControlRule).filter(AutoControlRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="自动控制规则不存在"
        )
    db.delete(rule)
    db.commit()
    return {"message": "自动控制规则已删除"}


@router.get("/api/notifications")
async def get_notifications(
    is_read: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    return notifications


@router.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在"
        )
    notification.is_read = True
    db.commit()
    return {"message": "通知已标记为已读"}


@router.put("/api/notifications/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "所有通知已标记为已读"}
