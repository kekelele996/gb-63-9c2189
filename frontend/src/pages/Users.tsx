import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, Switch,
  Space, Tag, Popconfirm, message, Typography
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import api from '@/utils/api'
import { User, UserRole } from '@/types'

const { Option } = Select
const { Title } = Typography

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/users', {
        params: { page: 1, page_size: 100 },
      })
      setUsers(response.data.items || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        const { password, ...updateData } = values
        await api.put(`/api/users/${editingUser.id}`, updateData)
        message.success('用户更新成功')
      } else {
        await api.post('/api/users', values)
        message.success('用户创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const handleToggleActive = async (user: User, checked: boolean) => {
    try {
      await api.put(`/api/users/${user.id}`, { is_active: checked })
      message.success(`用户已${checked ? '启用' : '禁用'}`)
      fetchUsers()
    } catch (error) {
      console.error('Toggle active failed:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/users/${id}`)
      message.success('用户删除成功')
      fetchUsers()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: '管理员',
      technician: '技术员',
      operator: '操作员',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'red',
      technician: 'blue',
      operator: 'green',
    }
    return colors[role] || 'default'
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean, record: User) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record)
              form.setFieldsValue(record)
              setModalVisible(true)
            }}
          />
          <Popconfirm
            title="确定删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>用户管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUser(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          添加用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, total }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingUser(null)
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingUser ? (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item
            name="full_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="technician">技术员</Option>
              <Option value="operator">操作员</Option>
            </Select>
          </Form.Item>
          {editingUser ? (
            <Form.Item name="is_active" label="是否启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  )
}

export default Users
