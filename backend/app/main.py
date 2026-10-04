from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import settings
from app.routers import auth, users, greenhouses, environment, alarms, plant_batches, tasks, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="温室大棚智能化管理系统",
    description="面向中小型花卉种植基地和温室经营者的智能化管理系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(greenhouses.router)
app.include_router(environment.router)
app.include_router(alarms.router)
app.include_router(plant_batches.router)
app.include_router(tasks.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "name": "温室大棚智能化管理系统",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/init-data")
def init_sample_data():
    from app.database import SessionLocal
    from app.models import (
        Greenhouse, Zone, Sensor, Device, SensorType, DeviceType
    )
    from app.auth import get_password_hash
    db = SessionLocal()
    try:
        if db.query(Greenhouse).count() == 0:
            greenhouse1 = Greenhouse(
                name="一号温室",
                code="GH-001",
                description="主要种植玫瑰花",
                location="东区",
                area=500.0
            )
            greenhouse2 = Greenhouse(
                name="二号温室",
                code="GH-002",
                description="主要种植百合花",
                location="西区",
                area=400.0
            )
            db.add_all([greenhouse1, greenhouse2])
            db.commit()
            db.refresh(greenhouse1)
            db.refresh(greenhouse2)
            zone1_1 = Zone(
                greenhouse_id=greenhouse1.id,
                name="A区",
                code="Z-A",
                description="红玫瑰种植区"
            )
            zone1_2 = Zone(
                greenhouse_id=greenhouse1.id,
                name="B区",
                code="Z-B",
                description="白玫瑰种植区"
            )
            zone2_1 = Zone(
                greenhouse_id=greenhouse2.id,
                name="A区",
                code="Z-A",
                description="百合种植区"
            )
            db.add_all([zone1_1, zone1_2, zone2_1])
            db.commit()
            db.refresh(zone1_1)
            db.refresh(zone1_2)
            db.refresh(zone2_1)
            sensors_config = [
                (SensorType.TEMPERATURE, "温度传感器", "T", "°C"),
                (SensorType.HUMIDITY, "湿度传感器", "H", "%"),
                (SensorType.LIGHT, "光照传感器", "L", "lux"),
                (SensorType.CO2, "CO2传感器", "C", "ppm"),
                (SensorType.SOIL_MOISTURE, "土壤湿度传感器", "SM", "%")
            ]
            for zone in [zone1_1, zone1_2, zone2_1]:
                for sensor_type, name, prefix, unit in sensors_config:
                    sensor = Sensor(
                        zone_id=zone.id,
                        name=f"{zone.name}-{name}",
                        code=f"{zone.greenhouse.code}-{zone.code}-{prefix}",
                        sensor_type=sensor_type,
                        unit=unit
                    )
                    db.add(sensor)
            devices_config = [
                (DeviceType.FAN, "风机", "FAN"),
                (DeviceType.ROLLING_SHUTTER, "卷帘", "RS"),
                (DeviceType.HUMIDIFIER, "加湿器", "HUM"),
                (DeviceType.SUPPLEMENT_LIGHT, "补光灯", "SL"),
                (DeviceType.IRRIGATION_PUMP, "灌溉水泵", "PUMP")
            ]
            for zone in [zone1_1, zone1_2, zone2_1]:
                for device_type, name, prefix in devices_config:
                    device = Device(
                        zone_id=zone.id,
                        name=f"{zone.name}-{name}",
                        code=f"{zone.greenhouse.code}-{zone.code}-{prefix}",
                        device_type=device_type
                    )
                    db.add(device)
            db.commit()
        return {"message": "示例数据初始化完成"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()
