# 简单问卷调查网站

一个基于Node.js + Express + SQLite的完整问卷调查系统，提供用户注册、问卷管理、问卷填写、结果分析等功能。

## 功能特性

- ✅ **用户认证系统** - 用户注册、登录、权限管理
- ✅ **问卷管理** - 创建、编辑、激活/停用问卷
- ✅ **生效时间控制** - 设置问卷开始和结束时间
- ✅ **多种题型支持** - 单行文本、多行文本、单选、多选、下拉选择
- ✅ **问卷填写** - 简洁的问卷填写界面
- ✅ **结果统计** - 回答数据汇总和分析
- ✅ **邮件通知** - 自动发送问卷结果到指定邮箱
- ✅ **响应式设计** - 支持桌面和移动设备
- ✅ **管理后台** - 完整的问卷管理界面

## 技术栈

**后端：**
- Node.js + Express
- SQLite 数据库
- JWT 身份认证
- Nodemailer 邮件发送
- bcrypt 密码加密

**前端：**
- 原生 HTML + CSS + JavaScript
- 响应式设计
- 现代化UI组件

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 配置邮件服务（可选）

在环境变量或直接修改 `server/app.js` 中的邮件配置：

```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail', // 或其他邮件服务
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

访问 http://localhost:3000

## 默认管理员账户

- **用户名：** admin
- **密码：** admin123

## 项目结构

```
SimpleSurvey/
├── server/                 # 后端代码
│   ├── app.js             # 主服务器文件
│   ├── init-db.js         # 数据库初始化
│   └── survey.db          # SQLite数据库文件
├── public/                # 前端静态文件
│   ├── css/
│   │   └── style.css      # 主样式文件
│   ├── js/
│   │   ├── auth.js        # 认证相关
│   │   ├── main.js        # 主页功能
│   │   └── admin.js       # 管理后台
│   ├── index.html         # 首页
│   ├── login.html         # 登录页
│   ├── register.html      # 注册页
│   ├── survey.html        # 问卷填写页
│   └── admin.html         # 管理后台
├── package.json
└── README.md
```

## 数据库设计

### 用户表 (users)
- id: 主键
- username: 用户名
- email: 邮箱
- password: 加密密码
- is_admin: 是否管理员
- created_at: 创建时间

### 问卷表 (surveys)
- id: 主键
- title: 问卷标题
- description: 问卷描述
- creator_id: 创建者ID
- is_active: 是否激活
- start_date: 开始时间
- end_date: 结束时间
- email_recipient: 结果接收邮箱
- created_at: 创建时间

### 问题表 (questions)
- id: 主键
- survey_id: 问卷ID
- question_text: 问题内容
- question_type: 问题类型
- options: 选项（JSON格式）
- is_required: 是否必填
- order_num: 排序号

### 回答表 (responses)
- id: 主键
- survey_id: 问卷ID
- respondent_name: 回答者姓名
- respondent_email: 回答者邮箱
- submitted_at: 提交时间

### 答案表 (answers)
- id: 主键
- response_id: 回答ID
- question_id: 问题ID
- answer_text: 答案内容

## API 接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/me` - 获取当前用户信息

### 问卷相关
- `GET /api/surveys` - 获取所有可用问卷
- `GET /api/surveys/:id` - 获取单个问卷详情
- `POST /api/surveys/:id/submit` - 提交问卷答案

### 管理员功能
- `GET /api/admin/surveys` - 获取所有问卷（管理员）
- `POST /api/admin/surveys` - 创建新问卷
- `PATCH /api/admin/surveys/:id/toggle` - 激活/停用问卷
- `GET /api/admin/surveys/:id/results` - 获取问卷结果

## 使用说明

### 普通用户
1. 访问首页查看可用问卷
2. 点击"参与问卷"填写问卷
3. 提交后系统自动发送邮件通知

### 管理员
1. 使用管理员账户登录
2. 进入管理后台创建问卷
3. 设置问卷标题、描述、有效期等
4. 添加各类型问题和选项
5. 激活问卷供用户填写
6. 查看问卷结果和统计

## 环境变量

```bash
PORT=3000                    # 服务端口
JWT_SECRET=your-secret-key   # JWT密钥
EMAIL_USER=your-email        # 邮件发送账户
EMAIL_PASS=your-password     # 邮件发送密码
```

## 部署建议

1. 使用 PM2 管理进程
2. 配置 Nginx 反向代理
3. 设置 HTTPS 证书
4. 定期备份数据库文件

## 许可证

MIT License
