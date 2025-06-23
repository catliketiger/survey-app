# 🚀 Vercel + 免费数据库 部署检查清单

## ⚠️ 重要提醒
**PlanetScale已取消免费计划！** 请选择以下免费替代方案：
- 🏆 **Neon PostgreSQL** (推荐) - 3GB免费存储
- 🔥 **Supabase** - 500MB免费存储  
- ⚡ **Railway** - $5/月免费额度

## ✅ 部署前检查

### 代码准备
- [x] MySQL驱动已安装 (`mysql2`)
- [x] PostgreSQL驱动已安装 (`pg`)
- [x] 数据库适配器已创建 (`server/database.js`)
- [x] 通用版本应用已创建 (`server/app-mysql.js`)
- [x] Vercel配置已更新 (`vercel.json`)
- [x] 免费数据库部署指南已准备 (`FREE_DATABASE_DEPLOY.md`)

### 环境变量准备
准备以下环境变量：
- [ ] `DATABASE_URL` - 数据库连接字符串（支持PostgreSQL/MySQL）
- [ ] `JWT_SECRET` - JWT密钥
- [ ] `EMAIL_USER` - 邮箱用户名
- [ ] `EMAIL_PASS` - 邮箱授权码
- [ ] `NODE_ENV=production`

## 🆓 免费数据库设置步骤

### 选项1：Neon PostgreSQL (推荐)
```bash
# 1. 访问 https://neon.tech
# 2. GitHub登录创建账户
# 3. 创建新项目 "survey-app"
# 4. 复制PostgreSQL连接字符串
# 格式：postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 选项2：Supabase
```bash
# 1. 访问 https://supabase.com
# 2. 创建新项目 "survey-app"
# 3. Settings > Database > Connection string
# 格式：postgresql://postgres:[password]@[host]:5432/postgres
```

### 选项3：Railway
```bash
# 1. 访问 https://railway.app
# 2. 从GitHub部署，自动添加PostgreSQL
# 3. 环境变量自动配置
```

## 🌐 Vercel 部署步骤

### 1. 推送到GitHub
```bash
git init
git add .
git commit -m "Ready for Vercel + PlanetScale deployment"
git remote add origin https://github.com/YOUR_USERNAME/survey-app.git
git push -u origin main
```

### 2. 连接Vercel
```bash
# 访问 https://vercel.com/dashboard
# 点击 "New Project"
# 选择你的GitHub仓库
# 点击 "Import"
```

### 3. 配置环境变量
在Vercel项目设置中添加：
```bash
DATABASE_URL=mysql://xxxx:xxxx@xxxx.us-east-1.psdb.cloud/survey-app?sslaccept=strict
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
EMAIL_USER=catliketiger@qq.com
EMAIL_PASS=onflaqllqsetjhfg
NODE_ENV=production
```

### 4. 部署
点击 "Deploy" 按钮，等待部署完成。

## 🧪 部署后测试

### 基本功能测试
- [ ] 访问首页是否正常显示
- [ ] 用户注册功能是否正常
- [ ] 管理员登录 (admin/admin123)
- [ ] 创建测试问卷
- [ ] 激活问卷
- [ ] 填写问卷测试
- [ ] 邮件发送测试

### 性能测试
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 数据库查询性能

## 🔧 故障排除

### 常见问题及解决方案

1. **数据库连接失败**
   ```bash
   # 检查DATABASE_URL格式
   # 确认PlanetScale数据库状态
   # 验证SSL配置
   ```

2. **函数超时**
   ```bash
   # 检查vercel.json中maxDuration设置
   # 优化数据库查询
   # 检查网络连接
   ```

3. **环境变量问题**
   ```bash
   # 确认所有环境变量已设置
   # 检查变量名拼写
   # 验证变量值正确性
   ```

## 📊 监控和维护

### 监控指标
- Vercel函数执行时间
- PlanetScale数据库连接数
- 邮件发送成功率
- 用户访问量

### 定期维护
- 检查错误日志
- 备份重要数据
- 更新依赖包
- 监控成本使用

## 🎯 优化建议

### 性能优化
- 启用Vercel Analytics
- 配置适当的缓存策略
- 优化数据库索引
- 使用CDN加速静态资源

### 安全加固
- 定期更新JWT密钥
- 启用邮箱二次验证
- 监控异常访问
- 定期安全审计

## ✨ 成功部署标志

如果看到以下内容，说明部署成功：
- ✅ Vercel域名可以正常访问
- ✅ 所有页面正常加载
- ✅ 数据库操作正常
- ✅ 邮件发送功能正常
- ✅ 管理后台功能完整

## 🚀 下一步

部署成功后，你可以：
1. 绑定自定义域名
2. 设置DNS解析
3. 配置SSL证书
4. 启用访问统计
5. 设置监控告警

恭喜！你的问卷调查系统现在已经在云端运行了！🎉
