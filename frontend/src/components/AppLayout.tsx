import { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge, Button, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

const { Header, Sider, Content } = Layout

const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/greenhouses',
      icon: <EnvironmentOutlined />,
      label: '温室管理',
    },
    {
      key: '/devices',
      icon: <SettingOutlined />,
      label: '设备控制',
    },
    {
      key: '/alarms',
      icon: <SafetyCertificateOutlined />,
      label: '告警管理',
    },
    {
      key: '/plant-batches',
      icon: <FileTextOutlined />,
      label: '种植批次',
    },
    {
      key: '/tasks',
      icon: <CalendarOutlined />,
      label: '任务排程',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '生产报表',
    },
  ]

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    })
  }

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'user-info',
      icon: <UserOutlined />,
      label: `${user?.full_name} (${user?.role})`,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const notificationItems: MenuProps['items'] = notifications.slice(0, 5).map((n) => ({
    key: n.id.toString(),
    label: (
      <div style={{ maxWidth: 300 }}>
        <div style={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.title}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{n.message}</div>
      </div>
    ),
  }))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '温室' : '温室大棚管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Space size="middle">
            <Dropdown
              menu={{
                items: notificationItems.concat([
                  { type: 'divider' },
                  {
                    key: 'mark-all',
                    label: '全部标记已读',
                    onClick: markAllAsRead,
                  },
                ]),
              }}
              placement="bottomRight"
            >
              <Badge count={unreadCount}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.full_name}</span>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
