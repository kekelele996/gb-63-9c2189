from celery import Celery
from app.config import settings

celery_app = Celery(
    "greenhouse_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)

import app.celery_tasks

celery_app.autodiscover_tasks(["app.celery_tasks"])
