import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Select, Switch,
  Space, Tag, Popconfirm, message, Tabs, Row, Col, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  PlayCircleOutlined, PauseCircleOutlined, SettingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import api from '@/utils/api'
import { Device, Sensor, AutoControlRule, DeviceType, SensorType } from '@/types'
import { useAuthStore } from '@/store/authStore'

const { Option } = Select

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [autoRules, setAutoRules] = useState<AutoControlRule[]>([])
  const [deviceModalVisible, setDeviceModalVisible] = useState(false)
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(false)
  const [deviceForm] = Form.useForm()
  const [ruleForm] = Form.useForm()

  const { user } = useAuthStore()
  const canModify = user?.role === 'admin' || user?.role === 'technician'

  const deviceTypeOptions = [
    { label: '风机', value: 'fan' },
    { label: '卷帘', value: 'rolling_shutter' },
    { label: '加湿器', value: 'humidifier' },
    { label: '补光灯', value: 'supplement_light' },
    { label: '灌溉水泵', value: 'irrigation_pump' },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const [devicesRes, sensorsRes, rulesRes] = await Promise.all([
        api.get<Device[]>('/api/devices'),
        api.get<Sensor[]>('/api/sensors'),
        api.get<AutoControlRule[]>('/api/auto-control-rules'),
      ])
      setDevices(devicesRes.data)
      setSensors(sensorsRes.data)
      setAutoRules(rulesRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeviceControl = async (device: Device, action: 'on' | 'off') => {
    try {
      await api.post(`/api/devices/${device.id}/control`, {
        action,
        reason: '手动控制',
      })
      message.success(`设备已${action === 'on' ? '开启' : '关闭'}`)
      fetchData()
    } catch (error) {
      console.error('Device control failed:', error)
    }
  }

  const handleDeviceSubmit = async (values: any) => {
    try {
      if (editingDevice) {
        await api.put(`/api/devices/${editingDevice.id}`, values)
        message.success('设备更新成功')
      } else {
        await api.post('/api/devices', values)
        message.success('设备创建成功')
      }
      setDeviceModalVisible(false)
      deviceForm.resetFields()
      setEditingDevice(null)
      fetchData()
    } catch (error) {
      console.error('Device submit failed:', error)
    }
  }

  const handleRuleSubmit = async (values: any) => {
    try {
      await api.post('/api/auto-control-rules', values)
      message.success('自动控制规则创建成功')
      setRuleModalVisible(false)
      ruleForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('Rule submit failed:', error)
    }
  }

  const handleToggleAutoMode = async (device: Device, checked: boolean) => {
    try {
      await api.put(`/api/devices/${device.id}`, { is_auto_mode: checked })
      message.success(`自动模式已${checked ? '开启' : '关闭'}`)
      fetchData()
    } catch (error) {
      console.error('Toggle auto mode failed:', error)
    }
  }

  const handleDeleteDevice = async (id: number) => {
    try {
      await api.delete(`/api/devices/${id}`)
      message.success('设备删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete device failed:', error)
    }
  }

  const handleDeleteRule = async (id: number) => {
    try {
      await api.delete(`/api/auto-control-rules/${id}`)
      message.success('规则删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete rule failed:', error)
    }
  }

  const handleToggleRule = async (rule: AutoControlRule) => {
    try {
      await api.put(`/api/auto-control-rules/${rule.id}`, { is_enabled: !rule.is_enabled })
      message.success(`规则已${!rule.is_enabled ? '启用' : '禁用'}`)
      fetchData()
    } catch (error) {
      console.error('Toggle rule failed:', error)
    }
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

  const deviceColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '类型',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (type: DeviceType) => (
        <Tag>{getDeviceTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_on',
      key: 'is_on',
      render: (on: boolean) => (
        <Tag color={on ? 'green' : 'default'}>
          {on ? '运行中' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '自动模式',
      dataIndex: 'is_auto_mode',
      key: 'is_auto_mode',
      render: (auto: boolean, record: Device) => (
        <Switch
          checked={auto}
          onChange={(checked) => handleToggleAutoMode(record, checked)}
          disabled={!canModify}
        />
      ),
    },
    {
      title: '最后控制时间',
      dataIndex: 'last_control_time',
      key: 'last_control_time',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
        <Space>
          <Tooltip title={record.is_on ? '关闭' : '开启'}>
            <Button
              type="text"
              icon={record.is_on ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleDeviceControl(record, record.is_on ? 'off' : 'on')}
            />
          </Tooltip>
          {canModify && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingDevice(record)
                  deviceForm.setFieldsValue(record)
                  setDeviceModalVisible(true)
                }}
              />
              <Popconfirm
                title="确定删除这个设备吗？"
                onConfirm={() => handleDeleteDevice(record.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '传感器',
      dataIndex: 'sensor_id',
      key: 'sensor_id',
      render: (sensorId: number) => {
        const sensor = sensors.find((s) => s.id === sensorId)
        return sensor ? `${getSensorTypeLabel(sensor.sensor_type)} (${sensor.name})` : sensorId
      },
    },
    {
      title: '触发条件',
      key: 'condition',
      render: (_: any, record: AutoControlRule) => (
        <span>
          {getSensorTypeLabel(sensors.find((s) => s.id === record.sensor_id)?.sensor_type || '')}
          {' '}{record.comparison_operator}{' '}
          {record.threshold_value}
        </span>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device_id',
      key: 'device_id',
      render: (deviceId: number) => {
        const device = devices.find((d) => d.id === deviceId)
        return device ? `${getDeviceTypeLabel(device.device_type)} (${device.name})` : deviceId
      },
    },
    {
      title: '操作',
      dataIndex: 'device_action',
      key: 'device_action',
      render: (action: string) => (
        <Tag color={action === 'on' ? 'green' : 'red'}>
          {action === 'on' ? '开启' : '关闭'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean, record: AutoControlRule) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleRule(record)}
          disabled={!canModify}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AutoControlRule) => (
        canModify ? (
          <Popconfirm
            title="确定删除这个规则吗？"
            onConfirm={() => handleDeleteRule(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>设备控制</h2>
      </div>

      <Tabs
        items={[
          {
            key: 'devices',
            label: <span><ThunderboltOutlined /> 设备管理</span>,
            children: (
              <Card
                extra={
                  canModify ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingDevice(null)
                        deviceForm.resetFields()
                        setDeviceModalVisible(true)
                      }}
                    >
                      添加设备
                    </Button>
                  ) : null
                }
              >
                <Table
                  columns={deviceColumns}
                  dataSource={devices}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'rules',
            label: <span><SettingOutlined /> 自动控制规则</span>,
            children: (
              <Card
                extra={
                  canModify ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        ruleForm.resetFields()
                        setRuleModalVisible(true)
                      }}
                    >
                      添加规则
                    </Button>
                  ) : null
                }
              >
                <Table
                  columns={ruleColumns}
                  dataSource={autoRules}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={deviceModalVisible}
        onCancel={() => {
          setDeviceModalVisible(false)
          deviceForm.resetFields()
          setEditingDevice(null)
        }}
        onOk={() => deviceForm.submit()}
        destroyOnClose
      >
        <Form
          form={deviceForm}
          layout="vertical"
          onFinish={handleDeviceSubmit}
        >
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="设备代码"
            rules={[{ required: true, message: '请输入设备代码' }]}
          >
            <Input placeholder="请输入设备代码" />
          </Form.Item>
          <Form.Item
            name="zone_id"
            label="所属区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select placeholder="请选择区域">
              {/* 这里可以从API获取区域列表 */}
            </Select>
          </Form.Item>
          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="请选择设备类型">
              {deviceTypeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_auto_mode" label="自动模式" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加自动控制规则"
        open={ruleModalVisible}
        onCancel={() => {
          setRuleModalVisible(false)
          ruleForm.resetFields()
        }}
        onOk={() => ruleForm.submit()}
        destroyOnClose
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleRuleSubmit}
          initialValues={{ comparison_operator: '>', device_action: 'on' }}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item
            name="sensor_id"
            label="传感器"
            rules={[{ required: true, message: '请选择传感器' }]}
          >
            <Select placeholder="请选择传感器">
              {sensors.map((sensor) => (
                <Option key={sensor.id} value={sensor.id}>
                  {getSensorTypeLabel(sensor.sensor_type)} - {sensor.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="comparison_operator"
                label="比较运算符"
                rules={[{ required: true, message: '请选择运算符' }]}
              >
                <Select placeholder="请选择运算符">
                  <Option value=">">大于 (&gt;)</Option>
                  <Option value=">=">大于等于 (&gt;=)</Option>
                  <Option value="<">小于 (&lt;)</Option>
                  <Option value="<=">小于等于 (&lt;=)</Option>
                  <Option value="==">等于 (==)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="threshold_value"
                label="阈值"
                rules={[{ required: true, message: '请输入阈值' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入阈值" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="device_id"
            label="控制设备"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select placeholder="请选择设备">
              {devices.map((device) => (
                <Option key={device.id} value={device.id}>
                  {getDeviceTypeLabel(device.device_type)} - {device.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="device_action"
            label="执行操作"
            rules={[{ required: true, message: '请选择操作' }]}
          >
            <Select placeholder="请选择操作">
              <Option value="on">开启设备</Option>
              <Option value="off">关闭设备</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Devices
