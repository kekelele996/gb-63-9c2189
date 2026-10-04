from datetime import datetime, date, time
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from app.models import (
    UserRole, DeviceType, SensorType, AlarmLevel,
    AlarmStatus, TaskStatus, TaskType, QualityGrade
)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.OPERATOR
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    total: int
    items: List[UserResponse]


class GreenhouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    location: Optional[str] = None
    area: Optional[float] = None
    is_active: bool = True


class GreenhouseCreate(GreenhouseBase):
    pass


class GreenhouseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    area: Optional[float] = None
    is_active: Optional[bool] = None


class GreenhouseResponse(GreenhouseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ZoneBase(BaseModel):
    greenhouse_id: int
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: bool = True


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ZoneResponse(ZoneBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SensorBase(BaseModel):
    zone_id: int
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    sensor_type: SensorType
    unit: str = Field(..., max_length=20)
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    is_active: bool = True


class SensorCreate(SensorBase):
    pass


class SensorUpdate(BaseModel):
    name: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    is_active: Optional[bool] = None


class SensorResponse(SensorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SensorReadingResponse(BaseModel):
    id: int
    sensor_id: int
    value: float
    reading_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class DeviceBase(BaseModel):
    zone_id: int
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    device_type: DeviceType
    is_on: bool = False
    is_auto_mode: bool = False
    is_active: bool = True


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    is_auto_mode: Optional[bool] = None
    is_active: Optional[bool] = None


class DeviceControl(BaseModel):
    action: str = Field(..., description="on or off")
    reason: Optional[str] = None


class DeviceResponse(DeviceBase):
    id: int
    last_control_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AutoControlRuleBase(BaseModel):
    device_id: int
    sensor_id: int
    name: str = Field(..., min_length=1, max_length=100)
    threshold_value: float
    comparison_operator: str = Field(..., description=">, >=, <, <=, ==")
    device_action: str = Field(..., description="on or off")
    is_enabled: bool = True
    description: Optional[str] = None


class AutoControlRuleCreate(AutoControlRuleBase):
    pass


class AutoControlRuleUpdate(BaseModel):
    threshold_value: Optional[float] = None
    comparison_operator: Optional[str] = None
    device_action: Optional[str] = None
    is_enabled: Optional[bool] = None
    description: Optional[str] = None


class AutoControlRuleResponse(AutoControlRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlarmRuleBase(BaseModel):
    sensor_id: int
    name: str = Field(..., min_length=1, max_length=100)
    threshold_value: float
    comparison_operator: str = Field(..., description=">, >=, <, <=, ==")
    alarm_level: AlarmLevel = AlarmLevel.MEDIUM
    is_enabled: bool = True
    description: Optional[str] = None


class AlarmRuleCreate(AlarmRuleBase):
    pass


class AlarmRuleUpdate(BaseModel):
    threshold_value: Optional[float] = None
    comparison_operator: Optional[str] = None
    alarm_level: Optional[AlarmLevel] = None
    is_enabled: Optional[bool] = None
    description: Optional[str] = None


class AlarmRuleResponse(AlarmRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlarmBase(BaseModel):
    rule_id: int
    title: str = Field(..., min_length=1, max_length=200)
    message: str
    level: AlarmLevel


class AlarmResponse(AlarmBase):
    id: int
    user_id: Optional[int] = None
    status: AlarmStatus
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlantBatchBase(BaseModel):
    greenhouse_id: int
    zone_id: int
    batch_code: str = Field(..., min_length=1, max_length=50)
    flower_variety: str = Field(..., min_length=1, max_length=100)
    quantity: int
    planting_date: date
    expected_flowering_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    quality_grade: Optional[QualityGrade] = None
    yield_amount: Optional[float] = None
    status: str = "growing"
    notes: Optional[str] = None


class PlantBatchCreate(PlantBatchBase):
    pass


class PlantBatchUpdate(BaseModel):
    flower_variety: Optional[str] = None
    quantity: Optional[int] = None
    expected_flowering_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    quality_grade: Optional[QualityGrade] = None
    yield_amount: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PlantBatchResponse(PlantBatchBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CareLogBase(BaseModel):
    batch_id: int
    log_type: str = Field(..., min_length=1, max_length=50)
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    operator_name: Optional[str] = None
    log_date: Optional[datetime] = None


class CareLogCreate(CareLogBase):
    pass


class CareLogResponse(CareLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    task_type: TaskType
    zone_id: Optional[int] = None
    batch_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    priority: str = "medium"
    scheduled_date: date
    scheduled_time: Optional[time] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    assigned_user_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    completion_notes: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    completed_date: Optional[datetime] = None
    completion_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductionRecordBase(BaseModel):
    greenhouse_id: int
    zone_id: Optional[int] = None
    batch_id: Optional[int] = None
    flower_variety: str
    quantity: int
    quality_grade: QualityGrade
    harvest_date: date
    yield_amount: Optional[float] = None
    notes: Optional[str] = None


class ProductionRecordCreate(ProductionRecordBase):
    pass


class ProductionRecordResponse(ProductionRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_greenhouses: int
    total_zones: int
    total_devices: int
    active_alarms: int
    pending_tasks: int


class EnvironmentalStats(BaseModel):
    sensor_id: int
    sensor_name: str
    sensor_type: str
    current_value: float
    avg_value: float
    min_value: float
    max_value: float
    unit: str


class ProductionReport(BaseModel):
    period: str
    greenhouse_id: int
    greenhouse_name: str
    total_quantity: int
    avg_yield: float
    quality_distribution: dict
    environment_stats: List[EnvironmentalStats]


class TaskStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    completed: int
    cancelled: int
    completion_rate: float
