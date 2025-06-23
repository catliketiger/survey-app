# Vercel + PlanetScale 部署指南

## 🚀 快速部署步骤

### 1. 准备工作

确保你有以下账户：
- [GitHub](https://github.com) 账户
- [Vercel](https://vercel.com) 账户
- [PlanetScale](https://planetscale.com) 账户

### 2. 设置PlanetScale数据库

#### 2.1 创建数据库
1. 登录 [PlanetScale Dashboard](https://app.planetscale.com)
2. 点击 "Create database"
3. 输入数据库名称，如：`survey-app`
4. 选择地区（推荐：AWS us-east-1）
5. 点击 "Create database"

#### 2.2 获取连接字符串
1. 在数据库详情页面，点击 "Connect"
2. 选择 "Connect with: Node.js"
3. 复制 DATABASE_URL，格式类似：
   ```
   mysql://username:password@host/database?sslaccept=strict
   ```

### 3. 推送代码到GitHub

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Survey app with MySQL support"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/survey-app.git

# 推送到GitHub
git push -u origin main
```

### 4. 部署到Vercel

#### 4.1 连接GitHub仓库
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. 点击 "Import"

#### 4.2 配置环境变量
在Vercel项目设置中添加以下环境变量：

```bash
NODE_ENV=production
DATABASE_URL=mysql://your-planetscale-connection-string
JWT_SECRET=your-super-secret-jwt-key-change-this
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-authorization-code
```

#### 4.3 部署
1. 点击 "Deploy"
2. 等待部署完成
3. 访问分配的域名测试应用

### 5. 验证部署

访问你的Vercel域名，应该能看到：
- ✅ 问卷首页正常显示
- ✅ 用户注册登录功能正常
- ✅ 管理员后台可以创建问卷
- ✅ 邮件发送功能正常

默认管理员账户：
- 用户名：`admin`
- 密码：`admin123`

## 🔧 高级配置

### 自定义域名
1. 在Vercel项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照提示配置DNS记录

### 监控和日志
- 在Vercel Dashboard查看函数日志
- 在PlanetScale Dashboard监控数据库性能

### 扩展功能
- 配置Vercel Analytics进行访问统计
- 设置Vercel的Edge Functions提升性能

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查DATABASE_URL是否正确
   - 确认PlanetScale数据库状态正常

2. **函数超时**
   - 检查vercel.json中的maxDuration设置
   - 优化数据库查询性能

3. **邮件发送失败**
   - 验证邮箱配置和授权码
   - 在管理后台使用"测试邮件"功能

### 本地开发

如果需要本地开发，创建 `.env` 文件：

```bash
DATABASE_URL=mysql://your-planetscale-connection-string
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password
```

然后运行：
```bash
npm install
node server/app-mysql.js
```

## 📊 成本估算

- **Vercel**: 免费版足够个人和小型项目使用
- **PlanetScale**: 
  - 免费版：5GB存储，1亿行读取/月
  - 付费版：$29/月起

总计：完全免费开始使用！

## 🎉 部署完成

恭喜！你的问卷调查系统现在已经部署到云端，具备：
- 全球CDN加速
- 自动HTTPS
- 无服务器架构
- 云数据库支持
- 自动扩展能力

享受你的云端问卷系统吧！
