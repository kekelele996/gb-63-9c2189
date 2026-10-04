from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, Date, Time
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    OPERATOR = "operator"


class DeviceType(str, enum.Enum):
    FAN = "fan"
    ROLLING_SHUTTER = "rolling_shutter"
    HUMIDIFIER = "humidifier"
    SUPPLEMENT_LIGHT = "supplement_light"
    IRRIGATION_PUMP = "irrigation_pump"


class SensorType(str, enum.Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    LIGHT = "light"
    CO2 = "co2"
    SOIL_MOISTURE = "soil_moisture"


class AlarmLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlarmStatus(str, enum.Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskType(str, enum.Enum):
    WATERING = "watering"
    FERTILIZING = "fertilizing"
    PRUNING = "pruning"
    SPRAYING = "spraying"
    OTHER = "other"


class QualityGrade(str, enum.Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    alarms = relationship("Alarm", back_populates="user")
    tasks = relationship("Task", back_populates="assigned_user")


class Greenhouse(Base):
    __tablename__ = "greenhouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    area = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    zones = relationship("Zone", back_populates="greenhouse")
    batches = relationship("PlantBatch", back_populates="greenhouse")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    greenhouse = relationship("Greenhouse", back_populates="zones")
    sensors = relationship("Sensor", back_populates="zone")
    devices = relationship("Device", back_populates="zone")
    batches = relationship("PlantBatch", back_populates="zone")


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    unit = Column(String(20), nullable=False)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    zone = relationship("Zone", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor")
    alarm_rules = relationship("AlarmRule", back_populates="sensor")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    value = Column(Float, nullable=False)
    reading_time = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sensor = relationship("Sensor", back_populates="readings")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    device_type = Column(Enum(DeviceType), nullable=False)
    is_on = Column(Boolean, default=False, nullable=False)
    is_auto_mode = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_control_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    zone = relationship("Zone", back_populates="devices")
    control_logs = relationship("DeviceControlLog", back_populates="device")
    auto_rules = relationship("AutoControlRule", back_populates="device")


class DeviceControlLog(Base):
    __tablename__ = "device_control_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    action = Column(String(20), nullable=False)
    triggered_by = Column(String(50), nullable=False)
    reason = Column(String(200), nullable=True)
    control_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    device = relationship("Device", back_populates="control_logs")


class AutoControlRule(Base):
    __tablename__ = "auto_control_rules"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    name = Column(String(100), nullable=False)
    threshold_value = Column(Float, nullable=False)
    comparison_operator = Column(String(10), nullable=False)
    device_action = Column(String(20), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    device = relationship("Device", back_populates="auto_rules")
    sensor = relationship("Sensor")


class AlarmRule(Base):
    __tablename__ = "alarm_rules"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    name = Column(String(100), nullable=False)
    threshold_value = Column(Float, nullable=False)
    comparison_operator = Column(String(10), nullable=False)
    alarm_level = Column(Enum(AlarmLevel), default=AlarmLevel.MEDIUM, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sensor = relationship("Sensor", back_populates="alarm_rules")
    alarms = relationship("Alarm", back_populates="rule")


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alarm_rules.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sensor_reading_id = Column(Integer, ForeignKey("sensor_readings.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(Enum(AlarmLevel), nullable=False)
    status = Column(Enum(AlarmStatus), default=AlarmStatus.PENDING, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    rule = relationship("AlarmRule", back_populates="alarms")
    user = relationship("User", back_populates="alarms")
    sensor_reading = relationship("SensorReading")


class PlantBatch(Base):
    __tablename__ = "plant_batches"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    flower_variety = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    planting_date = Column(Date, nullable=False)
    expected_flowering_date = Column(Date, nullable=True)
    actual_harvest_date = Column(Date, nullable=True)
    quality_grade = Column(Enum(QualityGrade), nullable=True)
    yield_amount = Column(Float, nullable=True)
    status = Column(String(50), default="growing", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    greenhouse = relationship("Greenhouse", back_populates="batches")
    zone = relationship("Zone", back_populates="batches")
    care_logs = relationship("CareLog", back_populates="batch")
    photos = relationship("PlantPhoto", back_populates="batch")


class CareLog(Base):
    __tablename__ = "care_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("plant_batches.id"), nullable=False)
    log_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    operator_name = Column(String(100), nullable=True)
    log_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    batch = relationship("PlantBatch", back_populates="care_logs")


class PlantPhoto(Base):
    __tablename__ = "plant_photos"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("plant_batches.id"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(200), nullable=True)
    taken_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    batch = relationship("PlantBatch", back_populates="photos")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(Enum(TaskType), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("plant_batches.id"), nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    priority = Column(String(20), default="medium", nullable=False)
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    recurrence_rule = Column(String(100), nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assigned_user = relationship("User", back_populates="tasks")
    zone = relationship("Zone")
    batch = relationship("PlantBatch")


class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("plant_batches.id"), nullable=True)
    flower_variety = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    quality_grade = Column(Enum(QualityGrade), nullable=False)
    harvest_date = Column(Date, nullable=False)
    yield_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    greenhouse = relationship("Greenhouse")
    zone = relationship("Zone")
    batch = relationship("PlantBatch")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    related_id = Column(Integer, nullable=True)
    related_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    user = relationship("User")
