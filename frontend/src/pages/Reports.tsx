import { useState, useEffect } from 'react'
import {
  Card, Button, Select, DatePicker, Space, Row, Col, Statistic,
  Table, Tag, Tabs, Progress, message
} from 'antd'
import {
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  DownloadOutlined, CalendarOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import api from '@/utils/api'

const { RangePicker } = DatePicker
const { Option } = Select

const Reports: React.FC = () => {
  const [productionReport, setProductionReport] = useState<any>(null)
  const [environmentReport, setEnvironmentReport] = useState<any[]>([])
  const [taskReport, setTaskReport] = useState<any>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [loading, setLoading] = useState(false)

  const fetchProductionReport = async () => {
    try {
      const response = await api.get('/api/reports/production', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setProductionReport(response.data)
    } catch (error) {
      console.error('Failed to fetch production report:', error)
    }
  }

  const fetchEnvironmentReport = async () => {
    try {
      const response = await api.get('/api/reports/environment', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setEnvironmentReport(response.data)
    } catch (error) {
      console.error('Failed to fetch environment report:', error)
    }
  }

  const fetchTaskReport = async () => {
    try {
      const response = await api.get('/api/reports/tasks', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setTaskReport(response.data)
    } catch (error) {
      console.error('Failed to fetch task report:', error)
    }
  }

  const fetchAllReports = async () => {
    setLoading(true)
    await Promise.all([
      fetchProductionReport(),
      fetchEnvironmentReport(),
      fetchTaskReport(),
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAllReports()
  }, [])

  const handleExport = async () => {
    try {
      const response = await api.get('/api/reports/production/export', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `production_report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('报表导出成功')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('报表导出失败')
    }
  }

  const productionQualityChart = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '品质分布',
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
          formatter: '{b}: {c} ({d}%)',
        },
        data: productionReport
          ? [
              { value: productionReport.quality_distribution?.excellent || 0, name: '优秀', itemStyle: { color: '#52c41a' } },
              { value: productionReport.quality_distribution?.good || 0, name: '良好', itemStyle: { color: '#1890ff' } },
              { value: productionReport.quality_distribution?.fair || 0, name: '一般', itemStyle: { color: '#faad14' } },
              { value: productionReport.quality_distribution?.poor || 0, name: '较差', itemStyle: { color: '#ff4d4f' } },
            ]
          : [],
      },
    ],
  }

  const taskChart = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        data: taskReport
          ? [
              { value: taskReport.status_distribution?.pending || 0, name: '待处理', itemStyle: { color: '#1890ff' } },
              { value: taskReport.status_distribution?.in_progress || 0, name: '进行中', itemStyle: { color: '#fa8c16' } },
              { value: taskReport.status_distribution?.completed || 0, name: '已完成', itemStyle: { color: '#52c41a' } },
              { value: taskReport.status_distribution?.cancelled || 0, name: '已取消', itemStyle: { color: '#d9d9d9' } },
            ]
          : [],
      },
    ],
  }

  const environmentChart = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: environmentReport.map((e: any) => e.sensor_name),
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
      data: environmentReport[0]?.readings?.slice(-24).map((r: any) =>
        dayjs(r.time).format('HH:mm')
      ) || [],
    },
    yAxis: {
      type: 'value',
    },
    series: environmentReport.map((e: any) => ({
      name: e.sensor_name,
      type: 'line',
      smooth: true,
      data: e.readings?.slice(-24).map((r: any) => r.value) || [],
    })),
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>生产报表</h2>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates: any) => {
              if (dates) setDateRange(dates)
            }}
          />
          <Button icon={<BarChartOutlined />} onClick={fetchAllReports} loading={loading}>
            查询
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出 Excel
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总产量"
              value={productionReport?.total_quantity || 0}
              suffix="株"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总产出"
              value={productionReport?.total_yield || 0}
              suffix="kg"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均单产"
              value={productionReport?.avg_yield_per_unit || 0}
              suffix="kg/株"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', marginBottom: 8 }}>任务完成率</div>
              <Progress
                type="circle"
                percent={Math.round((taskReport?.completion_rate || 0) * 100)}
                width={60}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'production',
            label: <span><BarChartOutlined /> 生产报表</span>,
            children: (
              <Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="品质等级分布">
                      <ReactECharts option={productionQualityChart} style={{ height: 300 }} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="按品种统计">
                      <Table
                        columns={[
                          { title: '品种', dataIndex: 'variety', key: 'variety' },
                          { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                          { title: '产量 (kg)', dataIndex: 'yield', key: 'yield' },
                        ]}
                        dataSource={
                          productionReport?.by_variety
                            ? Object.entries(productionReport.by_variety).map(([variety, data]: [string, any]) => ({
                                key: variety,
                                variety,
                                quantity: data.quantity,
                                yield: data.yield_amount?.toFixed(2) || 0,
                              }))
                            : []
                        }
                        pagination={false}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'environment',
            label: <span><LineChartOutlined /> 环境报表</span>,
            children: (
              <Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Card title="环境数据趋势">
                      {environmentReport.length > 0 ? (
                        <ReactECharts option={environmentChart} style={{ height: 400 }} />
                      ) : (
                        <div className="empty-state">暂无环境数据</div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card title="环境统计摘要">
                      <Table
                        columns={[
                          { title: '传感器', dataIndex: 'sensor_name', key: 'sensor_name' },
                          { title: '类型', dataIndex: 'sensor_type', key: 'sensor_type' },
                          { title: '平均值', dataIndex: 'avg_value', key: 'avg_value', render: (v: number, r: any) => `${v?.toFixed(2) || '-'} ${r.unit}` },
                          { title: '最小值', dataIndex: 'min_value', key: 'min_value', render: (v: number, r: any) => `${v?.toFixed(2) || '-'} ${r.unit}` },
                          { title: '最大值', dataIndex: 'max_value', key: 'max_value', render: (v: number, r: any) => `${v?.toFixed(2) || '-'} ${r.unit}` },
                          { title: '读数次数', dataIndex: 'reading_count', key: 'reading_count' },
                        ]}
                        dataSource={environmentReport}
                        rowKey="sensor_id"
                        pagination={false}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'tasks',
            label: <span><CalendarOutlined /> 任务报表</span>,
            children: (
              <Card>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="任务状态分布">
                      <ReactECharts option={taskChart} style={{ height: 300 }} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="任务类型分布">
                      <Table
                        columns={[
                          { title: '类型', dataIndex: 'type', key: 'type' },
                          { title: '数量', dataIndex: 'count', key: 'count' },
                        ]}
                        dataSource={
                          taskReport?.type_distribution
                            ? Object.entries(taskReport.type_distribution).map(([type, count]: [string, any]) => ({
                                key: type,
                                type,
                                count,
                              }))
                            : []
                        }
                        pagination={false}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}

export default Reports
