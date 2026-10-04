-- 温室大棚管理系统数据库初始化脚本

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 温室表
CREATE TABLE IF NOT EXISTS greenhouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(200),
    area FLOAT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 区域表
CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(greenhouse_id, code)
);

-- 传感器表
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES zones(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_value FLOAT,
    max_value FLOAT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 传感器读数表
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    value FLOAT NOT NULL,
    reading_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensor_readings_time ON sensor_readings(reading_time);
CREATE INDEX idx_sensor_readings_sensor ON sensor_readings(sensor_id);

-- 设备表
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES zones(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    is_on BOOLEAN NOT NULL DEFAULT FALSE,
    is_auto_mode BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_control_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 设备控制日志
CREATE TABLE IF NOT EXISTS device_control_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    action VARCHAR(20) NOT NULL,
    triggered_by VARCHAR(50) NOT NULL,
    reason VARCHAR(200),
    control_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 自动控制规则
CREATE TABLE IF NOT EXISTS auto_control_rules (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    name VARCHAR(100) NOT NULL,
    threshold_value FLOAT NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL,
    device_action VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 告警规则
CREATE TABLE IF NOT EXISTS alarm_rules (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    name VARCHAR(100) NOT NULL,
    threshold_value FLOAT NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL,
    alarm_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 告警
CREATE TABLE IF NOT EXISTS alarms (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES alarm_rules(id),
    user_id INTEGER REFERENCES users(id),
    sensor_reading_id INTEGER REFERENCES sensor_readings(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    level VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alarms_created ON alarms(created_at);
CREATE INDEX idx_alarms_status ON alarms(status);

-- 种植批次
CREATE TABLE IF NOT EXISTS plant_batches (
    id SERIAL PRIMARY KEY,
    greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id),
    zone_id INTEGER NOT NULL REFERENCES zones(id),
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    flower_variety VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    planting_date DATE NOT NULL,
    expected_flowering_date DATE,
    actual_harvest_date DATE,
    quality_grade VARCHAR(20),
    yield_amount FLOAT,
    status VARCHAR(50) NOT NULL DEFAULT 'growing',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 养护日志
CREATE TABLE IF NOT EXISTS care_logs (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES plant_batches(id),
    log_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity FLOAT,
    unit VARCHAR(20),
    operator_name VARCHAR(100),
    log_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 种植照片
CREATE TABLE IF NOT EXISTS plant_photos (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES plant_batches(id),
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(200),
    taken_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    zone_id INTEGER REFERENCES zones(id),
    batch_id INTEGER REFERENCES plant_batches(id),
    assigned_user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    completed_date TIMESTAMP,
    completion_notes TEXT,
    recurrence_rule VARCHAR(100),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- 生产记录
CREATE TABLE IF NOT EXISTS production_records (
    id SERIAL PRIMARY KEY,
    greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id),
    zone_id INTEGER REFERENCES zones(id),
    batch_id INTEGER REFERENCES plant_batches(id),
    flower_variety VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    quality_grade VARCHAR(20) NOT NULL,
    harvest_date DATE NOT NULL,
    yield_amount FLOAT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_production_harvest ON production_records(harvest_date);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);

-- 默认管理员账号 (密码: admin123)
INSERT INTO users (username, email, hashed_password, full_name, role) VALUES
('admin', 'admin@greenhouse.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqDmyrL1nC2', '系统管理员', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 默认技术员账号 (密码: tech123)
INSERT INTO users (username, email, hashed_password, full_name, role) VALUES
('technician', 'tech@greenhouse.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqDmyrL1nC2', '技术员', 'technician')
ON CONFLICT (username) DO NOTHING;

-- 默认操作员账号 (密码: operator123)
INSERT INTO users (username, email, hashed_password, full_name, role) VALUES
('operator', 'operator@greenhouse.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqDmyrL1nC2', '操作员', 'operator')
ON CONFLICT (username) DO NOTHING;
