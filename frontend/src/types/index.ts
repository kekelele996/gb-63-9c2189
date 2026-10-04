export type UserRole = 'admin' | 'technician' | 'operator'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface TokenData {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Greenhouse {
  id: number
  name: string
  code: string
  description?: string
  location?: string
  area?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Zone {
  id: number
  greenhouse_id: number
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SensorType = 'temperature' | 'humidity' | 'light' | 'co2' | 'soil_moisture'

export interface Sensor {
  id: number
  zone_id: number
  name: string
  code: string
  sensor_type: SensorType
  unit: string
  min_value?: number
  max_value?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SensorReading {
  id: number
  sensor_id: number
  value: number
  reading_time: string
  created_at: string
}

export interface SensorStats {
  sensor_id: number
  sensor_name: string
  sensor_type: string
  current_value: number
  avg_value: number
  min_value: number
  max_value: number
  unit: string
}

export interface EnvironmentOverview {
  sensor_id: number
  sensor_name: string
  sensor_type: string
  zone_name?: string
  current_value?: number
  unit: string
  reading_time?: string
}

export type DeviceType = 'fan' | 'rolling_shutter' | 'humidifier' | 'supplement_light' | 'irrigation_pump'

export interface Device {
  id: number
  zone_id: number
  name: string
  code: string
  device_type: DeviceType
  is_on: boolean
  is_auto_mode: boolean
  is_active: boolean
  last_control_time?: string
  created_at: string
  updated_at: string
}

export interface DeviceOverview {
  device_id: number
  device_name: string
  device_type: string
  zone_name?: string
  is_on: boolean
  is_auto_mode: boolean
}

export interface AutoControlRule {
  id: number
  device_id: number
  sensor_id: number
  name: string
  threshold_value: number
  comparison_operator: string
  device_action: string
  is_enabled: boolean
  description?: string
  created_at: string
  updated_at: string
}

export type AlarmLevel = 'low' | 'medium' | 'high' | 'critical'
export type AlarmStatus = 'pending' | 'acknowledged' | 'resolved'

export interface AlarmRule {
  id: number
  sensor_id: number
  name: string
  threshold_value: number
  comparison_operator: string
  alarm_level: AlarmLevel
  is_enabled: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface Alarm {
  id: number
  rule_id: number
  user_id?: number
  title: string
  message: string
  level: AlarmLevel
  status: AlarmStatus
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

export type QualityGrade = 'excellent' | 'good' | 'fair' | 'poor'

export interface PlantBatch {
  id: number
  greenhouse_id: number
  zone_id: number
  batch_code: string
  flower_variety: string
  quantity: number
  planting_date: string
  expected_flowering_date?: string
  actual_harvest_date?: string
  quality_grade?: QualityGrade
  yield_amount?: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CareLog {
  id: number
  batch_id: number
  log_type: string
  description: string
  quantity?: number
  unit?: string
  operator_name?: string
  log_date: string
  created_at: string
}

export type TaskType = 'watering' | 'fertilizing' | 'pruning' | 'spraying' | 'other'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Task {
  id: number
  title: string
  description?: string
  task_type: TaskType
  zone_id?: number
  batch_id?: number
  assigned_user_id?: number
  status: TaskStatus
  priority: string
  scheduled_date: string
  scheduled_time?: string
  completed_date?: string
  completion_notes?: string
  is_recurring: boolean
  recurrence_rule?: string
  created_at: string
  updated_at: string
}

export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  completion_rate: number
}

export interface DashboardStats {
  total_greenhouses: number
  total_zones: number
  total_devices: number
  active_alarms: number
  pending_tasks: number
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  related_id?: number
  related_type?: string
  created_at: string
}

export interface ProductionRecord {
  id: number
  greenhouse_id: number
  zone_id?: number
  batch_id?: number
  flower_variety: string
  quantity: number
  quality_grade: QualityGrade
  harvest_date: string
  yield_amount?: number
  notes?: string
  created_at: string
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
  statusCode?: number
}
