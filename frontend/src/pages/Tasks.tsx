import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, InputNumber,
  Space, Tag, Popconfirm, message, Tabs, DatePicker, TimePicker,
  Row, Col, Statistic, Progress
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CalendarOutlined, BarChartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import api from '@/utils/api'
import { Task, TaskStatus, TaskType, TaskStats, User, Zone, PlantBatch } from '@/types'

const { Option } = Select
const { RangePicker } = DatePicker

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const taskTypeOptions = [
    { label: '浇水', value: 'watering' },
    { label: '施肥', value: 'fertilizing' },
    { label: '修剪', value: 'pruning' },
    { label: '打药', value: 'spraying' },
    { label: '其他', value: 'other' },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, statsRes, usersRes, zonesRes, batchesRes] = await Promise.all([
        api.get<Task[]>('/api/tasks'),
        api.get<TaskStats>('/api/tasks/stats/overview'),
        api.get('/api/users', { params: { page: 1, page_size: 100 } }),
        api.get('/api/sensors'),
        api.get('/api/plant-batches'),
      ])
      setTasks(tasksRes.data)
      setStats(statsRes.data)
      if (usersRes.data?.items) {
        setUsers(usersRes.data.items)
      }
      setBatches(batchesRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        scheduled_date: values.scheduled_date?.format('YYYY-MM-DD'),
        scheduled_time: values.scheduled_time?.format('HH:mm:ss'),
      }
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, payload)
        message.success('任务更新成功')
      } else {
        await api.post('/api/tasks', payload)
        message.success('任务创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      setEditingTask(null)
      fetchData()
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const handleComplete = async (task: Task) => {
    try {
      await api.post(`/api/tasks/${task.id}/complete`, {
        completion_notes: '任务已完成',
      })
      message.success('任务已完成')
      fetchData()
    } catch (error) {
      console.error('Complete failed:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/tasks/${id}`)
      message.success('任务删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getTaskTypeLabel = (type: TaskType) => {
    const labels: Record<TaskType, string> = {
      watering: '浇水',
      fertilizing: '施肥',
      pruning: '修剪',
      spraying: '打药',
      other: '其他',
    }
    return labels[type] || type
  }

  const getTaskStatusColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      pending: 'blue',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'default',
    }
    return colors[status] || 'default'
  }

  const getTaskStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return labels[status] || status
  }

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: TaskType) => <Tag>{getTaskTypeLabel(type)}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
          {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '计划日期',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
    },
    {
      title: '计划时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getTaskStatusColor(status)}>
          {getTaskStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space>
          {(record.status === 'pending' || record.status === 'in_progress') && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTask(record)
              form.setFieldsValue({
                ...record,
                scheduled_date: record.scheduled_date ? dayjs(record.scheduled_date) : null,
                scheduled_time: record.scheduled_time ? dayjs(record.scheduled_time, 'HH:mm:ss') : null,
              })
              setModalVisible(true)
            }}
          />
          <Popconfirm
            title="确定删除这个任务吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const statsChartOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '任务统计',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        data: stats
          ? [
              { value: stats.pending, name: '待处理', itemStyle: { color: '#1890ff' } },
              { value: stats.in_progress, name: '进行中', itemStyle: { color: '#fa8c16' } },
              { value: stats.completed, name: '已完成', itemStyle: { color: '#52c41a' } },
              { value: stats.cancelled, name: '已取消', itemStyle: { color: '#d9d9d9' } },
            ]
          : [],
      },
    ],
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>任务排程</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          添加任务
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats?.total || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats?.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', marginBottom: 8 }}>完成率</div>
              <Progress
                type="circle"
                percent={Math.round((stats?.completion_rate || 0) * 100)}
                width={60}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'tasks',
            label: <span><CalendarOutlined /> 任务列表</span>,
            children: (
              <Card>
                <Table
                  columns={columns}
                  dataSource={tasks}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'stats',
            label: <span><BarChartOutlined /> 统计报表</span>,
            children: (
              <Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="任务状态分布">
                      <ReactECharts option={statsChartOption} style={{ height: 300 }} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="任务类型分布">
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <p>可根据需要添加更多统计图表</p>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingTask(null)
        }}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium' }}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="task_type"
                label="任务类型"
                rules={[{ required: true, message: '请选择任务类型' }]}
              >
                <Select placeholder="请选择任务类型">
                  {taskTypeOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="请选择优先级">
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduled_date"
                label="计划日期"
                rules={[{ required: true, message: '请选择计划日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduled_time" label="计划时间">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assigned_user_id" label="分配给">
            <Select placeholder="请选择人员" allowClear>
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Tasks
