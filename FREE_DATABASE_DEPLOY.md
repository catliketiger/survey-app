# 🆓 免费数据库部署方案

PlanetScale已取消免费计划，以下是**真正免费**的替代方案：

## 🏆 推荐方案对比

| 数据库服务 | 免费额度 | 特点 | 推荐度 |
|-----------|---------|------|-------|
| **Neon PostgreSQL** | 3GB存储 + 无限查询 | 自动休眠，现代化 | ⭐️⭐️⭐️⭐️⭐️ |
| **Supabase** | 500MB存储 + 2个项目 | 实时功能，Auth | ⭐️⭐️⭐️⭐️ |
| **Railway PostgreSQL** | $5/月免费额度 | 简单部署 | ⭐️⭐️⭐️⭐️ |
| **Aiven PostgreSQL** | 1个月免费试用 | 企业级 | ⭐️⭐️⭐️ |

## 🚀 方案1：Vercel + Neon (推荐)

### 优势
- ✅ **完全免费**：3GB存储 + 无限查询
- ✅ **现代化**：支持分支、自动休眠
- ✅ **兼容性好**：标准PostgreSQL
- ✅ **性能优秀**：延迟低，速度快

### 部署步骤

#### 1. 创建Neon数据库
```bash
# 1. 访问 https://neon.tech
# 2. 注册账户（GitHub登录）
# 3. 创建新项目 "survey-app"
# 4. 复制连接字符串，格式如：
# postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### 2. 更新Vercel配置
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/app-mysql.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/app-mysql.js"
    },
    {
      "src": "/(.*)",
      "dest": "public/$1"
    }
  ]
}
```

#### 3. 设置环境变量
在Vercel项目设置中添加：
```bash
DATABASE_URL=postgresql://your-neon-connection-string
JWT_SECRET=your-super-secret-key-at-least-32-characters
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-authorization-code
NODE_ENV=production
```

#### 4. 部署验证
- 数据库表会自动创建
- 默认管理员：admin/admin123

---

## 🚀 方案2：Vercel + Supabase

### 优势
- ✅ **免费**：500MB存储 + 50MB文件存储
- ✅ **功能丰富**：内置认证、实时功能
- ✅ **Dashboard**：可视化数据库管理
- ✅ **API自动生成**：RESTful + GraphQL

### 部署步骤

#### 1. 创建Supabase项目
```bash
# 1. 访问 https://supabase.com
# 2. 创建新项目 "survey-app"
# 3. 等待数据库初始化
# 4. 获取连接字符串：
#    Settings > Database > Connection string
```

#### 2. 环境变量配置
```bash
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-pass
NODE_ENV=production
```

---

## 🚀 方案3：Railway (一键部署)

### 优势
- ✅ **简单**：一键从GitHub部署
- ✅ **免费额度**：$5/月
- ✅ **自动配置**：数据库+应用一起部署

### 部署步骤

#### 1. 一键部署
```bash
# 1. 访问 https://railway.app
# 2. 连接GitHub仓库
# 3. 选择PostgreSQL模板
# 4. 自动部署完成
```

#### 2. 配置环境变量
Railway会自动设置`DATABASE_URL`，只需添加：
```bash
JWT_SECRET=your-secret-key
EMAIL_USER=your-email
EMAIL_PASS=your-email-pass
```

---

## 📊 成本对比

| 方案 | 月费用 | 存储限制 | 查询限制 | 适用场景 |
|------|--------|---------|---------|----------|
| Neon | **免费** | 3GB | 无限制 | 中小型应用 |
| Supabase | **免费** | 500MB | 50万次/月 | 小型应用 |
| Railway | **免费** | 1GB | 无限制 | 个人项目 |

## 🛠️ 快速部署命令

### 安装PostgreSQL驱动
```bash
npm install pg
```

### 测试数据库连接
```bash
# 设置环境变量
export DATABASE_URL="your-postgres-connection-string"

# 启动应用
node server/app-mysql.js
```

### 推送到Git并部署
```bash
git add .
git commit -m "Add PostgreSQL support for free deployment"
git push origin main

# 在Vercel/Railway中连接仓库并部署
```

## ✅ 部署验证清单

- [ ] 数据库连接成功
- [ ] 表结构自动创建
- [ ] 管理员账户可登录 (admin/admin123)
- [ ] 可以创建问卷
- [ ] 可以填写问卷
- [ ] 邮件发送正常

## 🎉 推荐选择

**新手推荐：** Neon PostgreSQL
- 完全免费，额度充足
- 设置简单，兼容性好
- 性能优秀，稳定可靠

**功能丰富：** Supabase
- 免费版功能丰富
- 可视化管理界面
- 可扩展为全栈解决方案

**快速部署：** Railway
- 一键部署，配置简单
- 适合快速原型验证
- 从GitHub自动部署

选择任何一个方案都能让你的问卷系统**完全免费**运行！
