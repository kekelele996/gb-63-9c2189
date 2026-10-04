# 温室大棚智能化管理系统

面向中小型花卉种植基地和温室经营者的智能化管理系统，实现温室环境数据监控、设备远程控制、种植任务管理和生产报表统计等功能。

## 快速启动

```bash
docker compose up -d
```

启动后访问：
- 前端：http://localhost:8104
- 后端 API：http://localhost:3104
- 后端文档：http://localhost:3104/docs

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 技术员 | technician | tech123 |
| 操作员 | operator | operator123 |

## 本地开发

### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 访问地址

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端 | 8104 | http://localhost:8104 |
| 后端 API | 3104 | http://localhost:3104 |
| PostgreSQL | 5604 | localhost:5604 |
| Redis | 6504 | localhost:6504 |

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| UI 组件库 | Ant Design 5 |
| 构建工具 | Vite |
| 图表库 | ECharts |
| 状态管理 | Zustand |
| 路由 | React Router |
| 后端框架 | FastAPI + Python 3.11 |
| ORM | SQLAlchemy 2.0 |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis 7 |
| 任务调度 | Celery + Redis |
| 认证 | JWT + RBAC |
| 部署 | Docker + Docker Compose |

## 项目目录结构

```
.
├── backend/                    # 后端项目
│   ├── app/                    # 应用代码
│   │   ├── __init__.py
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接
│   │   ├── auth.py            # 认证与权限
│   │   ├── models.py          # 数据模型
│   │   ├── schemas.py         # Pydantic Schema
│   │   ├── celery_app.py      # Celery 应用
│   │   ├── celery_tasks.py    # Celery 任务
│   │   └── routers/           # API 路由
│   │       ├── __init__.py
│   │       ├── auth.py        # 认证接口
│   │       ├── users.py       # 用户管理
│   │       ├── greenhouses.py # 温室管理
│   │       ├── environment.py # 环境监测
│   │       ├── alarms.py      # 告警管理
│   │       ├── plant_batches.py # 种植批次
│   │       ├── tasks.py       # 任务管理
│   │       └── reports.py     # 报表统计
│   ├── database/              # 数据库脚本
│   │   └── init.sql           # 初始化脚本
│   ├── Dockerfile             # 后端 Dockerfile
│   └── requirements.txt       # Python 依赖
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/        # 公共组件
│   │   │   ├── AppLayout.tsx  # 布局组件
│   │   │   └── PrivateRoute.tsx # 路由守卫
│   │   ├── pages/             # 页面组件
│   │   │   ├── Login.tsx      # 登录页
│   │   │   ├── Dashboard.tsx  # 仪表盘
│   │   │   ├── Greenhouses.tsx # 温室管理
│   │   │   ├── Devices.tsx    # 设备控制
│   │   │   ├── Alarms.tsx     # 告警管理
│   │   │   ├── PlantBatches.tsx # 种植批次
│   │   │   ├── Tasks.tsx      # 任务排程
│   │   │   ├── Reports.tsx    # 生产报表
│   │   │   └── Users.tsx      # 用户管理
│   │   ├── store/             # 状态管理
│   │   │   ├── authStore.ts   # 认证状态
│   │   │   └── notificationStore.ts # 通知状态
│   │   ├── types/             # 类型定义
│   │   │   └── index.ts
│   │   ├── utils/             # 工具函数
│   │   │   └── api.ts         # API 客户端
│   │   ├── App.tsx            # 主应用
│   │   ├── main.tsx           # 入口文件
│   │   └── index.css          # 全局样式
│   ├── Dockerfile             # 前端 Dockerfile
│   ├── nginx.conf             # Nginx 配置
│   ├── package.json           # Node 依赖
│   ├── vite.config.ts         # Vite 配置
│   ├── tsconfig.json          # TypeScript 配置
│   └── index.html             # HTML 模板
├── docker-compose.yml          # Docker Compose 配置
├── .env.example               # 环境变量示例
└── README.md                  # 项目文档
```

## 主要功能

1. **环境数据监控仪表盘**：实时展示温度、湿度、光照强度、CO2浓度、土壤湿度等环境数据，支持折线图和仪表盘展示历史趋势和当前状态。

2. **设备远程控制**：支持风机、卷帘、加湿器、补光灯、灌溉水泵等设备的远程开关控制，支持设置自动控制规则。

3. **告警规则配置**：为各项环境指标设置阈值告警，告警通过站内消息通知，告警历史可追溯查询。

4. **种植批次管理**：记录花卉品种、播种日期、预计花期、施肥记录、浇水记录等全生命周期信息，支持添加种植日志和照片。

5. **任务排程系统**：创建定期养护任务（浇水、施肥、修剪、打药等），支持任务周期和提醒，任务完成后标记状态。

6. **生产数据报表**：按周/月/季度统计各温室的产量、品质等级分布、环境数据均值等，支持导出 Excel 报表。

7. **温室区域管理**：支持添加多个温室大棚，每个温室可配置多个监控区域，区域关联对应的传感器和设备。

8. **用户权限管理**：支持管理员、技术员、操作员等不同角色，不同角色拥有不同的操作权限。

## 环境变量说明

```bash
# 数据库配置
POSTGRES_USER=greenhouse
POSTGRES_PASSWORD=greenhouse123
POSTGRES_DB=greenhouse_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# 前端配置
VITE_API_BASE_URL=http://localhost:3104
VITE_APP_TITLE=温室大棚管理系统
```

## Docker 部署说明

### 端口映射

| 服务 | 容器端口 | 主机端口 |
|------|----------|----------|
| 前端 (Nginx) | 80 | 8104 |
| 后端 (FastAPI) | 8000 | 3104 |
| PostgreSQL | 5432 | 5604 |
| Redis | 6379 | 6504 |

### 数据卷

- `greenhouse_postgres_data`：PostgreSQL 数据持久化
- `greenhouse_redis_data`：Redis 数据持久化

### 常用命令

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build

# 清理所有数据（谨慎使用）
docker compose down -v
```

### 常见问题

1. **服务启动失败**
   - 检查端口是否被占用
   - 查看日志：`docker compose logs <service-name>`

2. **数据库连接失败**
   - 确认 PostgreSQL 容器已启动：`docker compose ps postgres`
   - 检查健康检查状态

3. **前端无法访问后端**
   - 确认后端服务已启动
   - 检查 Nginx 配置和 API 反向代理

4. **数据丢失**
   - 确保使用了命名卷持久化数据
   - 不要随意使用 `docker compose down -v`

## License

MIT License
