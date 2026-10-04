import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select,
  Space, Tag, Popconfirm, message, Tabs, InputNumber
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, BellOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import api from '@/utils/api'
import { Alarm, AlarmRule, Sensor, AlarmLevel, AlarmStatus } from '@/types'
import { useAuthStore } from '@/store/authStore'

const { Option } = Select

const Alarms: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<AlarmRule | null>(null)
  const [loading, setLoading] = useState(false)
  const [ruleForm] = Form.useForm()

  const { user } = useAuthStore()
  const canModify = user?.role === 'admin' || user?.role === 'technician'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [alarmsRes, rulesRes, sensorsRes] = await Promise.all([
        api.get<Alarm[]>('/api/alarms'),
        api.get<AlarmRule[]>('/api/alarm-rules'),
        api.get<Sensor[]>('/api/sensors'),
      ])
      setAlarms(alarmsRes.data)
      setAlarmRules(rulesRes.data)
      setSensors(sensorsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAcknowledge = async (alarm: Alarm) => {
    try {
      await api.put(`/api/alarms/${alarm.id}/acknowledge`)
      message.success('告警已确认')
      fetchData()
    } catch (error) {
      console.error('Acknowledge failed:', error)
    }
  }

  const handleResolve = async (alarm: Alarm) => {
    try {
      await api.put(`/api/alarms/${alarm.id}/resolve`)
      message.success('告警已解决')
      fetchData()
    } catch (error) {
      console.error('Resolve failed:', error)
    }
  }

  const handleRuleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        await api.put(`/api/alarm-rules/${editingRule.id}`, values)
        message.success('告警规则更新成功')
      } else {
        await api.post('/api/alarm-rules', values)
        message.success('告警规则创建成功')
      }
      setRuleModalVisible(false)
      ruleForm.resetFields()
      setEditingRule(null)
      fetchData()
    } catch (error) {
      console.error('Rule submit failed:', error)
    }
  }

  const handleDeleteRule = async (id: number) => {
    try {
      await api.delete(`/api/alarm-rules/${id}`)
      message.success('规则删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete rule failed:', error)
    }
  }

  const handleToggleRule = async (rule: AlarmRule) => {
    try {
      await api.put(`/api/alarm-rules/${rule.id}`, { is_enabled: !rule.is_enabled })
      message.success(`规则已${!rule.is_enabled ? '启用' : '禁用'}`)
      fetchData()
    } catch (error) {
      console.error('Toggle rule failed:', error)
    }
  }

  const getAlarmLevelColor = (level: AlarmLevel) => {
    const colors: Record<AlarmLevel, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green',
    }
    return colors[level] || 'default'
  }

  const getAlarmLevelLabel = (level: AlarmLevel) => {
    const labels: Record<AlarmLevel, string> = {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低',
    }
    return labels[level] || level
  }

  const getAlarmStatusColor = (status: AlarmStatus) => {
    const colors: Record<AlarmStatus, string> = {
      pending: 'red',
      acknowledged: 'orange',
      resolved: 'green',
    }
    return colors[status] || 'default'
  }

  const getAlarmStatusLabel = (status: AlarmStatus) => {
    const labels: Record<AlarmStatus, string> = {
      pending: '待处理',
      acknowledged: '已确认',
      resolved: '已解决',
    }
    return labels[status] || status
  }

  const alarmColumns = [
    {
      title: '告警标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: AlarmLevel) => (
        <Tag color={getAlarmLevelColor(level)}>
          {getAlarmLevelLabel(level)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AlarmStatus) => (
        <Tag color={getAlarmStatusColor(status)}>
          {getAlarmStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Alarm) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAcknowledge(record)}
            >
              确认
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'acknowledged') && (
            <Button
              type="text"
              onClick={() => handleResolve(record)}
            >
              解决
            </Button>
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
        return sensor ? sensor.name : sensorId
      },
    },
    {
      title: '触发条件',
      key: 'condition',
      render: (_: any, record: AlarmRule) => (
        <span>
          {record.comparison_operator} {record.threshold_value}
        </span>
      ),
    },
    {
      title: '告警级别',
      dataIndex: 'alarm_level',
      key: 'alarm_level',
      render: (level: AlarmLevel) => (
        <Tag color={getAlarmLevelColor(level)}>
          {getAlarmLevelLabel(level)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean, record: AlarmRule) => (
        <Button
          type="link"
          onClick={() => canModify && handleToggleRule(record)}
          disabled={!canModify}
        >
          {enabled ? '启用' : '禁用'}
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlarmRule) => (
        canModify ? (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRule(record)
                ruleForm.setFieldsValue(record)
                setRuleModalVisible(true)
              }}
            />
            <Popconfirm
              title="确定删除这个规则吗？"
              onConfirm={() => handleDeleteRule(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>告警管理</h2>
      </div>

      <Tabs
        items={[
          {
            key: 'alarms',
            label: <span><BellOutlined /> 告警历史</span>,
            children: (
              <Card>
                <Table
                  columns={alarmColumns}
                  dataSource={alarms}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'rules',
            label: <span><SafetyCertificateOutlined /> 告警规则</span>,
            children: (
              <Card
                extra={
                  canModify ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingRule(null)
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
                  dataSource={alarmRules}
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
        title={editingRule ? '编辑告警规则' : '添加告警规则'}
        open={ruleModalVisible}
        onCancel={() => {
          setRuleModalVisible(false)
          ruleForm.resetFields()
          setEditingRule(null)
        }}
        onOk={() => ruleForm.submit()}
        destroyOnClose
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleRuleSubmit}
          initialValues={{ comparison_operator: '>', alarm_level: 'medium' }}
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
                  {sensor.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
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
          <Form.Item
            name="threshold_value"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入阈值" />
          </Form.Item>
          <Form.Item
            name="alarm_level"
            label="告警级别"
            rules={[{ required: true, message: '请选择告警级别' }]}
          >
            <Select placeholder="请选择告警级别">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">严重</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Alarms
