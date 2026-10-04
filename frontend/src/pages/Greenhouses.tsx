import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, InputNumber,
  Space, Tag, Popconfirm, message, Tabs, Typography, Divider
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons'
import api from '@/utils/api'
import { Greenhouse, Zone } from '@/types'
import { useAuthStore } from '@/store/authStore'

const { Title } = Typography

const Greenhouses: React.FC = () => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null)
  const [greenhouseModalVisible, setGreenhouseModalVisible] = useState(false)
  const [zoneModalVisible, setZoneModalVisible] = useState(false)
  const [editingGreenhouse, setEditingGreenhouse] = useState<Greenhouse | null>(null)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(false)
  const [greenhouseForm] = Form.useForm()
  const [zoneForm] = Form.useForm()

  const { user } = useAuthStore()
  const canModify = user?.role === 'admin' || user?.role === 'technician'

  const fetchGreenhouses = async () => {
    setLoading(true)
    try {
      const response = await api.get<Greenhouse[]>('/api/greenhouses')
      setGreenhouses(response.data)
      if (response.data.length > 0 && !selectedGreenhouse) {
        setSelectedGreenhouse(response.data[0])
        fetchZones(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch greenhouses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchZones = async (greenhouseId: number) => {
    try {
      const response = await api.get<Zone[]>(`/api/greenhouses/${greenhouseId}/zones`)
      setZones(response.data)
    } catch (error) {
      console.error('Failed to fetch zones:', error)
    }
  }

  useEffect(() => {
    fetchGreenhouses()
  }, [])

  useEffect(() => {
    if (selectedGreenhouse) {
      fetchZones(selectedGreenhouse.id)
    }
  }, [selectedGreenhouse])

  const handleGreenhouseSubmit = async (values: any) => {
    try {
      if (editingGreenhouse) {
        await api.put(`/api/greenhouses/${editingGreenhouse.id}`, values)
        message.success('温室更新成功')
      } else {
        await api.post('/api/greenhouses', values)
        message.success('温室创建成功')
      }
      setGreenhouseModalVisible(false)
      greenhouseForm.resetFields()
      setEditingGreenhouse(null)
      fetchGreenhouses()
    } catch (error) {
      console.error('Greenhouse submit failed:', error)
    }
  }

  const handleZoneSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        greenhouse_id: selectedGreenhouse?.id,
      }
      if (editingZone) {
        await api.put(`/api/greenhouses/zones/${editingZone.id}`, values)
        message.success('区域更新成功')
      } else {
        await api.post('/api/greenhouses/zones', payload)
        message.success('区域创建成功')
      }
      setZoneModalVisible(false)
      zoneForm.resetFields()
      setEditingZone(null)
      if (selectedGreenhouse) {
        fetchZones(selectedGreenhouse.id)
      }
    } catch (error) {
      console.error('Zone submit failed:', error)
    }
  }

  const handleEditGreenhouse = (greenhouse: Greenhouse) => {
    setEditingGreenhouse(greenhouse)
    greenhouseForm.setFieldsValue(greenhouse)
    setGreenhouseModalVisible(true)
  }

  const handleDeleteGreenhouse = async (id: number) => {
    try {
      await api.delete(`/api/greenhouses/${id}`)
      message.success('温室删除成功')
      fetchGreenhouses()
      if (selectedGreenhouse?.id === id) {
        setSelectedGreenhouse(null)
      }
    } catch (error) {
      console.error('Delete greenhouse failed:', error)
    }
  }

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone)
    zoneForm.setFieldsValue(zone)
    setZoneModalVisible(true)
  }

  const handleDeleteZone = async (id: number) => {
    try {
      await api.delete(`/api/greenhouses/zones/${id}`)
      message.success('区域删除成功')
      if (selectedGreenhouse) {
        fetchZones(selectedGreenhouse.id)
      }
    } catch (error) {
      console.error('Delete zone failed:', error)
    }
  }

  const greenhouseColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '面积 (㎡)',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Greenhouse) => (
        <Space>
          {canModify && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditGreenhouse(record)}
              />
              <Popconfirm
                title="确定删除这个温室吗？"
                onConfirm={() => handleDeleteGreenhouse(record.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  const zoneColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Zone) => (
        <Space>
          {canModify && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditZone(record)}
              />
              <Popconfirm
                title="确定删除这个区域吗？"
                onConfirm={() => handleDeleteZone(record.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  const tabItems = greenhouses.map((gh) => ({
    key: gh.id.toString(),
    label: (
      <span onClick={() => setSelectedGreenhouse(gh)}>
        <EnvironmentOutlined /> {gh.name}
      </span>
    ),
    children: (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>位置：</strong>{gh.location || '未设置'} |
            <strong> 面积：</strong>{gh.area || '未设置'} ㎡ |
            <strong> 描述：</strong>{gh.description || '无'}
          </div>
          {canModify && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingZone(null)
                zoneForm.resetFields()
                setZoneModalVisible(true)
              }}
            >
              添加区域
            </Button>
          )}
        </div>
        <Table
          columns={zoneColumns}
          dataSource={zones}
          rowKey="id"
          pagination={false}
        />
      </div>
    ),
  }))

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>温室管理</h2>
        {canModify && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingGreenhouse(null)
              greenhouseForm.resetFields()
              setGreenhouseModalVisible(true)
            }}
          >
            添加温室
          </Button>
        )}
      </div>

      <Card>
        <Tabs
          activeKey={selectedGreenhouse?.id.toString()}
          items={tabItems}
          onChange={(key) => {
            const gh = greenhouses.find((g) => g.id.toString() === key)
            if (gh) setSelectedGreenhouse(gh)
          }}
        />
      </Card>

      <Divider />

      <Card title="所有温室列表">
        <Table
          columns={greenhouseColumns}
          dataSource={greenhouses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingGreenhouse ? '编辑温室' : '添加温室'}
        open={greenhouseModalVisible}
        onCancel={() => {
          setGreenhouseModalVisible(false)
          greenhouseForm.resetFields()
          setEditingGreenhouse(null)
        }}
        onOk={() => greenhouseForm.submit()}
        destroyOnClose
      >
        <Form
          form={greenhouseForm}
          layout="vertical"
          onFinish={handleGreenhouseSubmit}
        >
          <Form.Item
            name="name"
            label="温室名称"
            rules={[{ required: true, message: '请输入温室名称' }]}
          >
            <Input placeholder="请输入温室名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="温室代码"
            rules={[{ required: true, message: '请输入温室代码' }]}
          >
            <Input placeholder="请输入温室代码，如 GH-001" />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="area" label="面积 (㎡)">
            <InputNumber min={0} placeholder="请输入面积" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingZone ? '编辑区域' : '添加区域'}
        open={zoneModalVisible}
        onCancel={() => {
          setZoneModalVisible(false)
          zoneForm.resetFields()
          setEditingZone(null)
        }}
        onOk={() => zoneForm.submit()}
        destroyOnClose
      >
        <Form
          form={zoneForm}
          layout="vertical"
          onFinish={handleZoneSubmit}
        >
          <Form.Item
            name="name"
            label="区域名称"
            rules={[{ required: true, message: '请输入区域名称' }]}
          >
            <Input placeholder="请输入区域名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="区域代码"
            rules={[{ required: true, message: '请输入区域代码' }]}
          >
            <Input placeholder="请输入区域代码，如 Z-A" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Greenhouses
