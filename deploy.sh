#!/bin/bash

# 阿里云ECS部署脚本

echo "开始部署问卷调查系统..."

# 更新系统
sudo yum update -y

# 安装Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 创建应用目录
sudo mkdir -p /var/www/survey
cd /var/www/survey

# 克隆代码（需要先上传到Git仓库）
# git clone your-repository-url .

# 安装依赖
npm install

# 初始化数据库
npm run init-db

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'survey-app',
    script: 'server/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      JWT_SECRET: 'your-production-jwt-secret'
    }
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save

# 安装Nginx
sudo yum install -y nginx

# 配置Nginx
sudo cat > /etc/nginx/conf.d/survey.conf << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启动Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "部署完成！"
echo "应用运行在: http://your-server-ip"
