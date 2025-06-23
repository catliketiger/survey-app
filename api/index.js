// Vercel Serverless Function Entry Point
const path = require('path');

console.log('API入口加载中...');
console.log('当前目录:', __dirname);
console.log('DATABASE_URL存在:', !!process.env.DATABASE_URL);

// 确保正确的路径解析
const appPath = path.join(__dirname, '..', 'server', 'app-mysql.js');
console.log('应用路径:', appPath);

const app = require(appPath);
console.log('应用加载完成');

module.exports = app;
