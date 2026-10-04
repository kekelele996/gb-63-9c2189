import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, InputNumber,
  Space, Tag, Popconfirm, message, Drawer, Descriptions, DatePicker,
  List, Typography, Divider
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '@/utils/api'
import { PlantBatch, Zone, CareLog, Greenhouse, QualityGrade } from '@/types'
import { useAuthStore } from '@/store/authStore'

const { Option } = Select
const { Title, Text } = Typography
const { RangePicker } = DatePicker

const PlantBatches: React.FC = () => {
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [careLogs, setCareLogs] = useState<CareLog[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<PlantBatch | null>(null)
  const [editingBatch, setEditingBatch] = useState<PlantBatch | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [careLogForm] = Form.useForm()

  const { user } = useAuthStore()
  const canModify = user?.role === 'admin' || user?.role === 'technician'

  const statusOptions = [
    { label: '种植中', value: 'growing' },
    { label: '开花期', value: 'flowering' },
    { label: '待收获', value: 'ready' },
    { label: '已收获', value: 'harvested' },
    { label: '已完成', value: 'completed' },
  ]

  const qualityOptions = [
    { label: '优秀', value: 'excellent' },
    { label: '良好', value: 'good' },
    { label: '一般', value: 'fair' },
    { label: '较差', value: 'poor' },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const [batchesRes, ghRes] = await Promise.all([
        api.get<PlantBatch[]>('/api/plant-batches'),
        api.get<Greenhouse[]>('/api/greenhouses'),
      ])
      setBatches(batchesRes.data)
      setGreenhouses(ghRes.data)
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
        planting_date: values.planting_date?.format('YYYY-MM-DD'),
        expected_flowering_date: values.expected_flowering_date?.format('YYYY-MM-DD'),
        actual_harvest_date: values.actual_harvest_date?.format('YYYY-MM-DD'),
      }
      if (editingBatch) {
        await api.put(`/api/plant-batches/${editingBatch.id}`, payload)
        message.success('批次更新成功')
      } else {
        await api.post('/api/plant-batches', payload)
        message.success('批次创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      setEditingBatch(null)
      fetchData()
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const handleViewDetail = async (batch: PlantBatch) => {
    setSelectedBatch(batch)
    setDetailVisible(true)
    try {
      const logsRes = await api.get<CareLog[]>(`/api/plant-batches/${batch.id}/care-logs`)
      setCareLogs(logsRes.data)
    } catch (error) {
      console.error('Failed to fetch care logs:', error)
    }
  }

  const handleAddCareLog = async (values: any) => {
    if (!selectedBatch) return
    try {
      await api.post(`/api/plant-batches/${selectedBatch.id}/care-logs`, {
        ...values,
        log_date: values.log_date?.toISOString() || new Date().toISOString(),
      })
      message.success('养护日志添加成功')
      careLogForm.resetFields()
      const logsRes = await api.get<CareLog[]>(`/api/plant-batches/${selectedBatch.id}/care-logs`)
      setCareLogs(logsRes.data)
    } catch (error) {
      console.error('Failed to add care log:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/plant-batches/${id}`)
      message.success('批次删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      growing: 'blue',
      flowering: 'purple',
      ready: 'orange',
      harvested: 'gold',
      completed: 'green',
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      growing: '种植中',
      flowering: '开花期',
      ready: '待收获',
      harvested: '已收获',
      completed: '已完成',
    }
    return labels[status] || status
  }

  const getQualityLabel = (grade?: QualityGrade) => {
    if (!grade) return '-'
    const labels: Record<QualityGrade, string> = {
      excellent: '优秀',
      good: '良好',
      fair: '一般',
      poor: '较差',
    }
    return labels[grade] || grade
  }

  const columns = [
    {
      title: '批次代码',
      dataIndex: 'batch_code',
      key: 'batch_code',
    },
    {
      title: '花卉品种',
      dataIndex: 'flower_variety',
      key: 'flower_variety',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '种植日期',
      dataIndex: 'planting_date',
      key: 'planting_date',
    },
    {
      title: '预计花期',
      dataIndex: 'expected_flowering_date',
      key: 'expected_flowering_date',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '品质等级',
      dataIndex: 'quality_grade',
      key: 'quality_grade',
      render: (grade?: QualityGrade) => getQualityLabel(grade),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PlantBatch) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          {canModify && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingBatch(record)
                  form.setFieldsValue({
                    ...record,
                    planting_date: record.planting_date ? dayjs(record.planting_date) : null,
                    expected_flowering_date: record.expected_flowering_date ? dayjs(record.expected_flowering_date) : null,
                    actual_harvest_date: record.actual_harvest_date ? dayjs(record.actual_harvest_date) : null,
                  })
                  setModalVisible(true)
                }}
              />
              <Popconfirm
                title="确定删除这个批次吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>种植批次</h2>
        {canModify && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBatch(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            添加批次
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={batches}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingBatch ? '编辑种植批次' : '添加种植批次'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingBatch(null)
        }}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="batch_code"
            label="批次代码"
            rules={[{ required: true, message: '请输入批次代码' }]}
          >
            <Input placeholder="请输入批次代码" />
          </Form.Item>
          <Form.Item
            name="greenhouse_id"
            label="温室"
            rules={[{ required: true, message: '请选择温室' }]}
          >
            <Select placeholder="请选择温室">
              {greenhouses.map((gh) => (
                <Option key={gh.id} value={gh.id}>
                  {gh.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="zone_id"
            label="区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select placeholder="请选择区域">
              {zones.map((zone) => (
                <Option key={zone.id} value={zone.id}>
                  {zone.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="flower_variety"
            label="花卉品种"
            rules={[{ required: true, message: '请输入花卉品种' }]}
          >
            <Input placeholder="请输入花卉品种" />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            name="planting_date"
            label="种植日期"
            rules={[{ required: true, message: '请选择种植日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expected_flowering_date" label="预计花期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actual_harvest_date" label="实际收获日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quality_grade" label="品质等级">
            <Select placeholder="请选择品质等级">
              {qualityOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="yield_amount" label="产量">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入产量" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="批次详情"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {selectedBatch && (
          <div>
            <Title level={4}>基本信息</Title>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="批次代码">{selectedBatch.batch_code}</Descriptions.Item>
              <Descriptions.Item label="花卉品种">{selectedBatch.flower_variety}</Descriptions.Item>
              <Descriptions.Item label="数量">{selectedBatch.quantity}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedBatch.status)}>
                  {getStatusLabel(selectedBatch.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="种植日期">{selectedBatch.planting_date}</Descriptions.Item>
              <Descriptions.Item label="预计花期">{selectedBatch.expected_flowering_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="实际收获日期">{selectedBatch.actual_harvest_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="品质等级">{getQualityLabel(selectedBatch.quality_grade)}</Descriptions.Item>
              <Descriptions.Item label="产量">{selectedBatch.yield_amount || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedBatch.notes || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={4}>养护日志</Title>
            <Form
              form={careLogForm}
              layout="inline"
              onFinish={handleAddCareLog}
              style={{ marginBottom: 16 }}
            >
              <Form.Item
                name="log_type"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="类型" style={{ width: 120 }}>
                  <Option value="浇水">浇水</Option>
                  <Option value="施肥">施肥</Option>
                  <Option value="修剪">修剪</Option>
                  <Option value="打药">打药</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <Input placeholder="描述" style={{ width: 200 }} />
              </Form.Item>
              <Form.Item
                name="quantity"
              >
                <InputNumber placeholder="数量" style={{ width: 100 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  添加
                </Button>
              </Form.Item>
            </Form>

            <List
              dataSource={careLogs}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={
                      <Space>
                        <Tag>{item.log_type}</Tag>
                        <Text>{item.description}</Text>
                      </Space>
                    }
                    description={
                      <Space>
                        {item.quantity && <span>用量：{item.quantity}</span>}
                        {item.operator_name && <span>操作人：{item.operator_name}</span>}
                        <span>{item.log_date}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default PlantBatches
