# 🐘 Neon PostgreSQL + Vercel 部署指南

## 🎯 第一步：创建Neon数据库

### 1.1 注册Neon账户
1. 访问 [Neon.tech](https://neon.tech)
2. 点击 "Sign up" 
3. 选择 "Continue with GitHub"（推荐）
4. 授权GitHub访问

### 1.2 创建数据库项目
1. 登录后点击 "Create a project"
2. 项目配置：
   - **Project name**: `survey-app`
   - **Database name**: `survey_db`
   - **Region**: 选择 `US East (Virginia)` (最快)
   - **PostgreSQL version**: 保持默认 (最新版)
3. 点击 "Create project"

### 1.3 获取连接字符串
项目创建完成后：
1. 在Dashboard中找到 "Connection string"
2. 选择 "Pooled connection"（推荐）
3. 复制完整的连接字符串，格式如下：
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/survey_db?sslmode=require
   ```

## 🎯 第二步：准备代码部署

### 2.1 确认文件结构
确保你的项目包含以下文件：
```
SimpleSurvey/
├── server/
│   ├── app-mysql.js      # 通用数据库应用
│   └── database.js       # 数据库适配器
├── public/               # 前端文件
├── package.json
├── vercel.json          # Vercel配置
└── README.md
```

### 2.2 推送到GitHub
```bash
# 如果还没有Git仓库
git init
git add .
git commit -m "Ready for Neon + Vercel deployment"

# 创建GitHub仓库
# 访问 https://github.com/new
# 仓库名: survey-app
# 设为Public（免费用户）

# 推送代码
git remote add origin https://github.com/YOUR_USERNAME/survey-app.git
git branch -M main
git push -u origin main
```

## 🎯 第三步：部署到Vercel

### 3.1 连接Vercel
1. 访问 [Vercel.com](https://vercel.com)
2. 点击 "Sign up" 并选择 "Continue with GitHub"
3. 授权Vercel访问你的GitHub

### 3.2 导入项目
1. 在Vercel Dashboard点击 "New Project"
2. 找到你的 `survey-app` 仓库
3. 点击 "Import"
4. **框架预设**: 选择 "Other"
5. **Build和Output设置**: 保持默认
6. 点击 "Deploy"

### 3.3 配置环境变量
部署完成后（会失败是正常的，因为还没配置数据库）：

1. 进入项目设置：`Settings` > `Environment Variables`
2. 添加以下环境变量：

```bash
# 数据库连接（用你的Neon连接字符串替换）
DATABASE_URL
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/survey_db?sslmode=require

# JWT密钥（必须至少32个字符）
JWT_SECRET
your-super-secret-jwt-key-change-this-to-something-secure-and-random

# 邮件配置
EMAIL_USER
catliketiger@qq.com

EMAIL_PASS
onflaqllqsetjhfg

# 环境标识
NODE_ENV
production
```

### 3.4 触发重新部署
1. 在Vercel项目页面点击 "Deployments"
2. 点击最新部署右侧的 "..." 
3. 选择 "Redeploy"
4. 等待部署完成

## 🎯 第四步：验证部署

### 4.1 访问应用
1. 部署成功后，Vercel会提供一个域名，如：
   `https://survey-app-xxx.vercel.app`
2. 访问这个域名

### 4.2 功能测试
- [ ] 首页正常显示
- [ ] 点击"注册"创建新用户
- [ ] 使用管理员账户登录：
  - 用户名: `admin`
  - 密码: `admin123`
- [ ] 进入管理后台
- [ ] 点击"测试邮件"验证邮件功能
- [ ] 创建一个测试问卷
- [ ] 激活问卷
- [ ] 填写问卷测试

## 🎯 第五步：自定义域名（可选）

### 5.1 添加域名
如果你有自己的域名：
1. 在Vercel项目设置中点击 "Domains"
2. 添加你的域名，如：`survey.yourdomain.com`
3. 按照提示配置DNS记录

### 5.2 DNS配置
在你的域名提供商处添加CNAME记录：
```
Type: CNAME
Name: survey (或 @)
Value: cname.vercel-dns.com
```

## 🎯 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查DATABASE_URL格式是否正确
# 确保包含 ?sslmode=require
# 验证用户名密码正确
```

#### 2. 函数超时
```bash
# Neon有自动休眠功能
# 第一次访问可能较慢（冷启动）
# 后续访问会很快
```

#### 3. 邮件发送失败
```bash
# 在管理后台使用"测试邮件"功能
# 检查QQ邮箱授权码是否正确
# 确认邮箱服务是否开启SMTP
```

## 📊 监控和维护

### Neon Dashboard
- 访问 [Neon Console](https://console.neon.tech)
- 监控数据库使用情况
- 查看连接数和查询统计

### Vercel Analytics
- 在Vercel项目中启用Analytics
- 监控访问量和性能
- 查看函数执行时间

## 🎉 部署成功！

如果所有测试都通过，恭喜你！你的问卷调查系统现在已经：

- ✅ **完全免费**运行在云端
- ✅ **全球CDN加速**，访问速度快
- ✅ **自动HTTPS**，安全可靠
- ✅ **无服务器架构**，自动扩展
- ✅ **PostgreSQL数据库**，功能强大

## 🚀 下一步

1. **分享你的应用**：把Vercel域名分享给朋友测试
2. **创建真实问卷**：开始收集真实的调查数据
3. **监控使用情况**：关注Neon的3GB存储限制
4. **备份数据**：定期导出重要数据
5. **升级计划**：如需更多资源可考虑付费计划

享受你的云端问卷调查系统吧！🎊
