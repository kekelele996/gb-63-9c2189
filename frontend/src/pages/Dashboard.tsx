import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Button, Space, Tooltip } from 'antd'
import {
  EnvironmentOutlined,
  ThunderboltOutlined,
  BellOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import api from '@/utils/api'
import { DashboardStats, EnvironmentOverview, DeviceOverview, Alarm, Task } from '@/types'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [environmentData, setEnvironmentData] = useState<EnvironmentOverview[]>([])
  const [devices, setDevices] = useState<DeviceOverview[]>([])
  const [recentAlarms, setRecentAlarms] = useState<Alarm[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [environmentChartData, setEnvironmentChartData] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [
        statsRes,
        envRes,
        devicesRes,
        alarmsRes,
        tasksRes,
      ] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<EnvironmentOverview[]>('/api/dashboard/environment'),
        api.get<DeviceOverview[]>('/api/dashboard/devices'),
        api.get<Alarm[]>('/api/dashboard/recent-alarms', { params: { limit: 5 } }),
        api.get<Task[]>('/api/dashboard/today-tasks'),
      ])

      setStats(statsRes.data)
      setEnvironmentData(envRes.data)
      setDevices(devicesRes.data)
      setRecentAlarms(alarmsRes.data)
      setTodayTasks(tasksRes.data)

      generateEnvironmentChart(envRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateEnvironmentChart = (data: EnvironmentOverview[]) => {
    const temperatureData = data.filter((d) => d.sensor_type === 'temperature')
    const humidityData = data.filter((d) => d.sensor_type === 'humidity')
    const timeData = Array.from({ length: 24 }, (_, i) => `${i}:00`)

    setEnvironmentChartData({
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['温度', '湿度'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData,
      },
      yAxis: [
        {
          type: 'value',
          name: '温度 (°C)',
          position: 'left',
        },
        {
          type: 'value',
          name: '湿度 (%)',
          position: 'right',
        },
      ],
      series: [
        {
          name: '温度',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: temperatureData.length > 0
            ? Array.from({ length: 24 }, () =>
                (temperatureData[0]?.current_value ?? 0) + (Math.random() - 0.5) * 5
              )
            : [],
          areaStyle: {
            color: 'rgba(255, 153, 0, 0.1)',
          },
          itemStyle: {
            color: '#ff9900',
          },
        },
        {
          name: '湿度',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: humidityData.length > 0
            ? Array.from({ length: 24 }, () =>
                (humidityData[0]?.current_value ?? 0) + (Math.random() - 0.5) * 10
              )
            : [],
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.1)',
          },
          itemStyle: {
            color: '#1890ff',
          },
        },
      ],
    })
  }

  const handleDeviceControl = async (device: DeviceOverview, action: 'on' | 'off') => {
    try {
      await api.post(`/api/devices/${device.device_id}/control`, {
        action,
        reason: '手动控制',
      })
      fetchData()
    } catch (error) {
      console.error('Device control failed:', error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getAlarmLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green',
    }
    return colors[level] || 'default'
  }

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'blue',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'default',
    }
    return colors[status] || 'default'
  }

  const getSensorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      temperature: '温度',
      humidity: '湿度',
      light: '光照',
      co2: 'CO2',
      soil_moisture: '土壤湿度',
    }
    return labels[type] || type
  }

  const getDeviceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fan: '风机',
      rolling_shutter: '卷帘',
      humidifier: '加湿器',
      supplement_light: '补光灯',
      irrigation_pump: '灌溉水泵',
    }
    return labels[type] || type
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>仪表盘</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card" loading={!stats}>
            <Statistic
              title="温室数量"
              value={stats?.total_greenhouses || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card" loading={!stats}>
            <Statistic
              title="区域数量"
              value={stats?.total_zones || 0}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card" loading={!stats}>
            <Statistic
              title="设备数量"
              value={stats?.total_devices || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card" loading={!stats}>
            <Statistic
              title="活动告警"
              value={stats?.active_alarms || 0}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="环境数据趋势" extra={
            <Tag color="blue">最近24小时</Tag>
          }>
            {environmentChartData && (
              <ReactECharts option={environmentChartData} style={{ height: 300 }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="待办任务" extra={
            <Button type="link" onClick={() => window.location.hash = '#/tasks'}>
              查看全部
            </Button>
          }>
            {todayTasks.length > 0 ? (
              <List
                dataSource={todayTasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CalendarOutlined />}
                      title={task.title}
                      description={
                        <Space>
                          <Tag color={getTaskStatusColor(task.status)}>
                            {task.status === 'pending' ? '待处理' :
                             task.status === 'in_progress' ? '进行中' :
                             task.status === 'completed' ? '已完成' : '已取消'}
                          </Tag>
                          {task.scheduled_time && <span>{task.scheduled_time}</span>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="empty-state">今日暂无任务</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="环境监测">
            <Row gutter={[8, 8]}>
              {environmentData.map((item) => (
                <Col key={item.sensor_id} xs={12} sm={8}>
                  <Card size="small" className="environment-card">
                    <div style={{ color: '#666', marginBottom: 8 }}>
                      {getSensorTypeLabel(item.sensor_type)}
                    </div>
                    <div className="environment-value">
                      {item.current_value?.toFixed(1) || '--'}
                      <span className="environment-unit">{item.unit}</span>
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {item.zone_name}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="设备状态">
            <Row gutter={[8, 8]}>
              {devices.slice(0, 6).map((device) => (
                <Col key={device.device_id} xs={12} sm={8}>
                  <Card
                    size="small"
                    className={`device-card ${device.is_on ? 'on' : 'off'}`}
                    style={{
                      borderColor: device.is_on ? '#52c41a' : '#d9d9d9',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {getDeviceTypeLabel(device.device_type)}
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                      {device.zone_name}
                    </div>
                    <Space>
                      <Tag color={device.is_on ? 'green' : 'default'}>
                        {device.is_on ? '运行中' : '已关闭'}
                      </Tag>
                      <Tooltip title={device.is_on ? '关闭' : '开启'}>
                        <Button
                          type="text"
                          icon={device.is_on ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                          onClick={() => handleDeviceControl(device, device.is_on ? 'off' : 'on')}
                          size="small"
                        />
                      </Tooltip>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="最近告警" extra={
            <Button type="link" onClick={() => window.location.hash = '#/alarms'}>
              查看全部
            </Button>
          }>
            {recentAlarms.length > 0 ? (
              <List
                dataSource={recentAlarms}
                renderItem={(alarm) => (
                  <List.Item className={`alarm-item ${alarm.level}`}>
                    <List.Item.Meta
                      avatar={<BellOutlined />}
                      title={
                        <Space>
                          {alarm.title}
                          <Tag color={getAlarmLevelColor(alarm.level)}>
                            {alarm.level === 'critical' ? '严重' :
                             alarm.level === 'high' ? '高' :
                             alarm.level === 'medium' ? '中' : '低'}
                          </Tag>
                        </Space>
                      }
                      description={alarm.message}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="empty-state">暂无告警</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
