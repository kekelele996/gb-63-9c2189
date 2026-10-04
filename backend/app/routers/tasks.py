from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user, require_admin_or_technician
from app.models import User, Task, TaskStatus
from app.schemas import (
    TaskResponse, TaskCreate, TaskUpdate, TaskStats
)

router = APIRouter(prefix="/api/tasks", tags=["任务管理"])


@router.get("", response_model=list[TaskResponse])
async def get_tasks(
    zone_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    assigned_user_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)
    if zone_id:
        query = query.filter(Task.zone_id == zone_id)
    if batch_id:
        query = query.filter(Task.batch_id == batch_id)
    if assigned_user_id:
        query = query.filter(Task.assigned_user_id == assigned_user_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if start_date:
        query = query.filter(Task.scheduled_date >= start_date)
    if end_date:
        query = query.filter(Task.scheduled_date <= end_date)
    if current_user.role != "admin":
        query = query.filter(
            (Task.assigned_user_id == current_user.id) |
            (Task.assigned_user_id.is_(None))
        )
    tasks = query.order_by(Task.scheduled_date.desc()).all()
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    return task


@router.post("", response_model=TaskResponse)
async def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = Task(**task_in.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    update_data = task_in.model_dump(exclude_unset=True)
    if update_data.get("status") == TaskStatus.COMPLETED and not task.completed_date:
        update_data["completed_date"] = datetime.utcnow()
    for field, value in update_data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    completion_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    task.status = TaskStatus.COMPLETED
    task.completed_date = datetime.utcnow()
    task.completion_notes = completion_notes
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician())
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    db.delete(task)
    db.commit()
    return {"message": "任务已删除"}


@router.get("/stats/overview", response_model=TaskStats)
async def get_task_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)
    if start_date:
        query = query.filter(Task.scheduled_date >= start_date)
    if end_date:
        query = query.filter(Task.scheduled_date <= end_date)
    if current_user.role != "admin":
        query = query.filter(Task.assigned_user_id == current_user.id)
    total = query.count()
    pending = query.filter(Task.status == TaskStatus.PENDING).count()
    in_progress = query.filter(Task.status == TaskStatus.IN_PROGRESS).count()
    completed = query.filter(Task.status == TaskStatus.COMPLETED).count()
    cancelled = query.filter(Task.status == TaskStatus.CANCELLED).count()
    completion_rate = completed / total if total > 0 else 0.0
    return TaskStats(
        total=total,
        pending=pending,
        in_progress=in_progress,
        completed=completed,
        cancelled=cancelled,
        completion_rate=completion_rate
    )


@router.get("/stats/daily")
async def get_daily_task_stats(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    end_date = date.today()
    start_date = end_date - __import__("datetime").timedelta(days=days)
    query = db.query(
        Task.scheduled_date,
        Task.status,
        func.count(Task.id).label("count")
    ).filter(
        Task.scheduled_date >= start_date,
        Task.scheduled_date <= end_date
    )
    if current_user.role != "admin":
        query = query.filter(Task.assigned_user_id == current_user.id)
    query = query.group_by(Task.scheduled_date, Task.status)
    results = query.all()
    stats_by_date = {}
    for task_date, task_status, count in results:
        date_key = task_date.isoformat()
        if date_key not in stats_by_date:
            stats_by_date[date_key] = {
                "date": date_key,
                "total": 0,
                "pending": 0,
                "in_progress": 0,
                "completed": 0,
                "cancelled": 0
            }
        stats_by_date[date_key]["total"] += count
        status_key = task_status.value if hasattr(task_status, "value") else task_status
        if status_key in stats_by_date[date_key]:
            stats_by_date[date_key][status_key] = count
    sorted_stats = sorted(
        stats_by_date.values(),
        key=lambda x: x["date"]
    )
    return sorted_stats
