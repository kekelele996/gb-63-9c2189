from datetime import datetime, timedelta
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import (
    Sensor, SensorReading, AutoControlRule, AlarmRule,
    Alarm, Device, DeviceControlLog, Notification, User, Task
)


def evaluate_condition(value: float, operator: str, threshold: float) -> bool:
    if operator == ">":
        return value > threshold
    elif operator == ">=":
        return value >= threshold
    elif operator == "<":
        return value < threshold
    elif operator == "<=":
        return value <= threshold
    elif operator == "==":
        return value == threshold
    return False


@celery_app.task(name="check_auto_control_rules")
def check_auto_control_rules():
    db = SessionLocal()
    try:
        rules = db.query(AutoControlRule).filter(
            AutoControlRule.is_enabled == True
        ).all()
        for rule in rules:
            sensor = db.query(Sensor).filter(Sensor.id == rule.sensor_id).first()
            if not sensor or not sensor.is_active:
                continue
            latest_reading = db.query(SensorReading).filter(
                SensorReading.sensor_id == sensor.id
            ).order_by(SensorReading.reading_time.desc()).first()
            if not latest_reading:
                continue
            device = db.query(Device).filter(Device.id == rule.device_id).first()
            if not device or not device.is_active or not device.is_auto_mode:
                continue
            condition_met = evaluate_condition(
                latest_reading.value,
                rule.comparison_operator,
                rule.threshold_value
            )
            if condition_met:
                should_turn_on = rule.device_action.lower() == "on"
                if device.is_on != should_turn_on:
                    device.is_on = should_turn_on
                    device.last_control_time = datetime.utcnow()
                    log = DeviceControlLog(
                        device_id=device.id,
                        action=rule.device_action.lower(),
                        triggered_by="auto",
                        reason=f"自动控制规则触发: {rule.name}"
                    )
                    db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Auto control check error: {e}")
    finally:
        db.close()


@celery_app.task(name="check_alarm_rules")
def check_alarm_rules():
    db = SessionLocal()
    try:
        rules = db.query(AlarmRule).filter(
            AlarmRule.is_enabled == True
        ).all()
        for rule in rules:
            sensor = db.query(Sensor).filter(Sensor.id == rule.sensor_id).first()
            if not sensor or not sensor.is_active:
                continue
            latest_reading = db.query(SensorReading).filter(
                SensorReading.sensor_id == sensor.id
            ).order_by(SensorReading.reading_time.desc()).first()
            if not latest_reading:
                continue
            condition_met = evaluate_condition(
                latest_reading.value,
                rule.comparison_operator,
                rule.threshold_value
            )
            if condition_met:
                recent_alarm = db.query(Alarm).filter(
                    Alarm.rule_id == rule.id,
                    Alarm.created_at >= datetime.utcnow() - timedelta(hours=1)
                ).first()
                if recent_alarm:
                    continue
                alarm = Alarm(
                    rule_id=rule.id,
                    sensor_reading_id=latest_reading.id,
                    title=f"{rule.name}",
                    message=f"传感器 {sensor.name} 当前值 {latest_reading.value}{sensor.unit} 触发告警规则",
                    level=rule.alarm_level
                )
                db.add(alarm)
                db.flush()
                admins = db.query(User).filter(User.role == "admin").all()
                for admin in admins:
                    notification = Notification(
                        user_id=admin.id,
                        title=f"新告警: {rule.name}",
                        message=f"传感器 {sensor.name} 触发告警，当前值: {latest_reading.value}{sensor.unit}",
                        notification_type="alarm",
                        related_id=alarm.id,
                        related_type="alarm"
                    )
                    db.add(notification)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Alarm check error: {e}")
    finally:
        db.close()


@celery_app.task(name="generate_sensor_data")
def generate_sensor_data():
    db = SessionLocal()
    try:
        sensors = db.query(Sensor).filter(Sensor.is_active == True).all()
        from random import uniform, random
        sensor_ranges = {
            "temperature": (15, 35),
            "humidity": (40, 90),
            "light": (100, 10000),
            "co2": (300, 1500),
            "soil_moisture": (20, 80)
        }
        for sensor in sensors:
            sensor_type = sensor.sensor_type.value if hasattr(sensor.sensor_type, "value") else sensor.sensor_type
            min_val, max_val = sensor_ranges.get(sensor_type, (0, 100))
            if sensor.min_value is not None:
                min_val = max(min_val, sensor.min_value)
            if sensor.max_value is not None:
                max_val = min(max_val, sensor.max_value)
            latest_reading = db.query(SensorReading).filter(
                SensorReading.sensor_id == sensor.id
            ).order_by(SensorReading.reading_time.desc()).first()
            if latest_reading and random() > 0.3:
                change = uniform(-2, 2)
                new_value = latest_reading.value + change
                new_value = max(min_val, min(max_val, new_value))
            else:
                new_value = uniform(min_val, max_val)
            reading = SensorReading(
                sensor_id=sensor.id,
                value=round(new_value, 2)
            )
            db.add(reading)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Sensor data generation error: {e}")
    finally:
        db.close()


@celery_app.task(name="check_task_reminders")
def check_task_reminders():
    db = SessionLocal()
    try:
        from app.models import TaskStatus
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        tasks_today = db.query(Task).filter(
            Task.scheduled_date == today,
            Task.status == TaskStatus.PENDING
        ).all()
        for task in tasks_today:
            if task.assigned_user_id:
                notification = Notification(
                    user_id=task.assigned_user_id,
                    title=f"今日任务提醒: {task.title}",
                    message=f"您有一个任务安排在今日: {task.description or ''}",
                    notification_type="task",
                    related_id=task.id,
                    related_type="task"
                )
                db.add(notification)
        tasks_tomorrow = db.query(Task).filter(
            Task.scheduled_date == tomorrow,
            Task.status == TaskStatus.PENDING
        ).all()
        for task in tasks_tomorrow:
            if task.assigned_user_id:
                notification = Notification(
                    user_id=task.assigned_user_id,
                    title=f"明日任务提醒: {task.title}",
                    message=f"您有一个任务安排在明天: {task.description or ''}",
                    notification_type="task",
                    related_id=task.id,
                    related_type="task"
                )
                db.add(notification)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Task reminder error: {e}")
    finally:
        db.close()
