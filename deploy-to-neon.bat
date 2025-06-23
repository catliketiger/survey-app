@echo off
echo ==========================================
echo 🚀 Neon PostgreSQL + Vercel 部署助手
echo ==========================================
echo.

echo 📋 部署前检查...
echo.

echo ✅ 检查Node.js依赖...
if not exist "node_modules" (
    echo 🔄 安装依赖中...
    npm install
)

echo ✅ 检查必要文件...
if not exist "server\app-mysql.js" (
    echo ❌ 缺少 server\app-mysql.js 文件
    pause
    exit /b 1
)

if not exist "server\database.js" (
    echo ❌ 缺少 server\database.js 文件
    pause
    exit /b 1
)

if not exist "vercel.json" (
    echo ❌ 缺少 vercel.json 文件
    pause
    exit /b 1
)

echo.
echo 🎯 接下来的步骤:
echo.
echo 1. 🐘 创建Neon数据库:
echo    - 访问 https://neon.tech
echo    - 用GitHub登录
echo    - 创建项目 'survey-app'
echo    - 复制连接字符串
echo.
echo 2. 📁 推送到GitHub:
echo    - git init
echo    - git add .
echo    - git commit -m "Ready for deployment"
echo    - 在GitHub创建仓库 'survey-app'
echo    - git remote add origin [你的仓库地址]
echo    - git push -u origin main
echo.
echo 3. 🚀 部署到Vercel:
echo    - 访问 https://vercel.com
echo    - 用GitHub登录
echo    - 导入 survey-app 仓库
echo    - 添加环境变量:
echo      * DATABASE_URL=postgresql://...
echo      * JWT_SECRET=your-32-char-secret
echo      * EMAIL_USER=catliketiger@qq.com
echo      * EMAIL_PASS=your-email-auth-code
echo      * NODE_ENV=production
echo    - 重新部署
echo.
echo 4. ✅ 测试部署:
echo    - 访问Vercel分配的域名
echo    - 管理员登录: admin/admin123
echo    - 测试所有功能
echo.
echo 📚 详细指南请查看:
echo    - NEON_DEPLOY_GUIDE.md
echo    - DEPLOY_CHECKLIST_NEON.md
echo.
echo 💡 准备好了吗？按任意键开始检查Git状态...
pause > nul

echo.
echo 🔍 检查Git状态...
git status

echo.
echo 🎯 下一步: 如果文件状态正常，运行以下命令推送到GitHub:
echo.
echo git init
echo git add .
echo git commit -m "Ready for Neon + Vercel deployment"
echo.
echo 然后在GitHub创建仓库并推送代码。
echo.
pause
