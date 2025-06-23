const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 数据库连接
const database = new Database();

// 中间件
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// 邮件配置（支持多种邮件服务）
const transporter = nodemailer.createTransport({
  service: 'QQ',
  auth: {
    user: process.env.EMAIL_USER || 'catliketiger@qq.com',
    pass: process.env.EMAIL_PASS || 'onflaqllqsetjhfg'
  }
});

// 认证中间件
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效令牌' });
    }
    req.user = user;
    next();
  });
};

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// 路由

// 用户注册
app.post('/api/register', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('email').isEmail().withMessage('请输入有效邮箱'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await database.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    res.json({ message: '注册成功', userId: result.lastID });
  } catch (error) {
    if (error.message && (error.message.includes('username') || error.message.includes('email'))) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await database.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ 
      message: '登录成功', 
      user: { 
        id: user.id, 
        username: user.username, 
        is_admin: user.is_admin 
      } 
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 用户登出
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '登出成功' });
});

// 获取当前用户信息
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 获取所有激活的问卷（公开访问）
app.get('/api/surveys', async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.username as creator_name 
      FROM surveys s 
      JOIN users u ON s.creator_id = u.id 
      WHERE s.is_active = 1 
      AND (s.start_date IS NULL OR s.start_date <= NOW())
      AND (s.end_date IS NULL OR s.end_date >= NOW())
      ORDER BY s.created_at DESC
    `;
    
    const surveys = await database.query(query);
    res.json(surveys);
  } catch (error) {
    console.error('获取问卷失败:', error);
    res.status(500).json({ error: '获取问卷失败' });
  }
});

// 获取单个问卷详情（包含问题）
app.get('/api/surveys/:id', async (req, res) => {
  const surveyId = req.params.id;
  
  try {
    // 获取问卷基本信息
    const survey = await database.get('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    
    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 检查问卷是否在有效期内
    const now = new Date();
    if (!survey.is_active || 
        (survey.start_date && new Date(survey.start_date) > now) ||
        (survey.end_date && new Date(survey.end_date) < now)) {
      return res.status(403).json({ error: '问卷当前不可用' });
    }

    // 获取问卷问题
    const questions = await database.query(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num', 
      [surveyId]
    );
    
    // 解析选项JSON
    questions.forEach(q => {
      if (q.options) {
        try {
          q.options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (e) {
          q.options = [];
        }
      }
    });

    res.json({ ...survey, questions });
  } catch (error) {
    console.error('获取问卷详情失败:', error);
    res.status(500).json({ error: '获取问卷失败' });
  }
});

// 提交问卷答案
app.post('/api/surveys/:id/submit', async (req, res) => {
  const surveyId = req.params.id;
  const { respondent_name, respondent_email, answers } = req.body;

  try {
    // 验证问卷是否可用
    const survey = await database.get(
      'SELECT * FROM surveys WHERE id = ? AND is_active = 1', 
      [surveyId]
    );
    
    if (!survey) {
      return res.status(404).json({ error: '问卷不存在或已失效' });
    }

    // 检查时间有效性
    const now = new Date();
    if ((survey.start_date && new Date(survey.start_date) > now) ||
        (survey.end_date && new Date(survey.end_date) < now)) {
      return res.status(403).json({ error: '问卷当前不在有效期内' });
    }

    // 插入回答记录
    const responseResult = await database.run(
      'INSERT INTO responses (survey_id, respondent_name, respondent_email) VALUES (?, ?, ?)',
      [surveyId, respondent_name, respondent_email]
    );

    const responseId = responseResult.lastID;

    // 插入具体答案
    for (const answer of answers) {
      await database.run(
        'INSERT INTO answers (response_id, question_id, answer_text) VALUES (?, ?, ?)',
        [responseId, answer.question_id, answer.answer_text]
      );
    }

    // 发送邮件通知
    if (survey.email_recipient) {
      await sendEmailNotification(survey, respondent_name, respondent_email, answers);
    }

    res.json({ message: '提交成功' });
  } catch (error) {
    console.error('提交问卷失败:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

// 发送邮件通知函数
async function sendEmailNotification(survey, respondentName, respondentEmail, answers) {
  // 检查是否配置了邮件接收地址
  if (!survey.email_recipient) {
    console.log('未设置邮件接收地址，跳过邮件发送');
    return;
  }

  try {
    // 验证邮件服务器连接
    await transporter.verify();
    console.log('邮件服务器连接正常');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'catliketiger@qq.com',
      to: survey.email_recipient,
      subject: `问卷回答通知：${survey.title}`,
      html: `
        <h2>问卷回答通知</h2>
        <p><strong>问卷标题：</strong>${survey.title}</p>
        <p><strong>回答者：</strong>${respondentName}</p>
        <p><strong>邮箱：</strong>${respondentEmail}</p>
        <p><strong>提交时间：</strong>${new Date().toLocaleString()}</p>
        <hr>
        <h3>回答内容：</h3>
        ${answers.map(a => `<p><strong>问题${a.question_id}：</strong>${a.answer_text}</p>`).join('')}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', result.messageId);
  } catch (error) {
    console.error('邮件发送失败详情:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    
    // 提供具体的解决建议
    if (error.code === 'EAUTH') {
      console.error('认证失败：请检查邮箱用户名和授权码是否正确');
    } else if (error.code === 'ECONNECTION') {
      console.error('连接失败：请检查网络连接和邮件服务器设置');
    }
  }
}

// 邮件测试接口（仅管理员可用）
app.post('/api/admin/test-email', authenticateToken, requireAdmin, async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return res.status(400).json({ error: '请提供测试邮箱地址' });
  }

  try {
    // 验证邮件服务器连接
    await transporter.verify();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'catliketiger@qq.com',
      to: testEmail,
      subject: '问卷系统邮件测试',
      html: `
        <h2>邮件测试成功！</h2>
        <p>这是一封来自问卷调查系统的测试邮件。</p>
        <p>发送时间：${new Date().toLocaleString()}</p>
        <p>如果您收到此邮件，说明邮件配置正常。</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('测试邮件发送成功:', result.messageId);
    res.json({ message: '测试邮件发送成功', messageId: result.messageId });
    
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    res.status(500).json({ 
      error: '邮件发送失败', 
      details: error.message,
      code: error.code 
    });
  }
});

// ===================
// 管理员功能路由
// ===================

// 获取所有问卷（管理员）
app.get('/api/admin/surveys', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.username as creator_name,
             (SELECT COUNT(*) FROM responses WHERE survey_id = s.id) as response_count
      FROM surveys s 
      JOIN users u ON s.creator_id = u.id 
      ORDER BY s.created_at DESC
    `;
    
    const surveys = await database.query(query);
    res.json(surveys);
  } catch (error) {
    console.error('获取管理员问卷失败:', error);
    res.status(500).json({ error: '获取问卷失败' });
  }
});

// 创建问卷
app.post('/api/admin/surveys', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, start_date, end_date, email_recipient, questions } = req.body;
  
  try {
    const surveyResult = await database.run(
      'INSERT INTO surveys (title, description, creator_id, start_date, end_date, email_recipient) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, req.user.id, start_date, end_date, email_recipient]
    );

    const surveyId = surveyResult.lastID;

    // 插入问题
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await database.run(
          'INSERT INTO questions (survey_id, question_text, question_type, options, is_required, order_num) VALUES (?, ?, ?, ?, ?, ?)',
          [
            surveyId, 
            q.question_text, 
            q.question_type, 
            JSON.stringify(q.options || []), 
            q.is_required ? 1 : 0, 
            i + 1
          ]
        );
      }
    }

    res.json({ message: '创建成功', surveyId });
  } catch (error) {
    console.error('创建问卷失败:', error);
    res.status(500).json({ error: '创建问卷失败' });
  }
});

// 激活/停用问卷
app.patch('/api/admin/surveys/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = req.params.id;
  
  try {
    // 先获取当前状态
    const survey = await database.get('SELECT is_active FROM surveys WHERE id = ?', [surveyId]);
    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 切换状态
    const newStatus = survey.is_active ? 0 : 1;
    await database.run('UPDATE surveys SET is_active = ? WHERE id = ?', [newStatus, surveyId]);
    
    res.json({ message: '操作成功' });
  } catch (error) {
    console.error('切换问卷状态失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 获取问卷统计结果
app.get('/api/admin/surveys/:id/results', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = req.params.id;
  
  try {
    // 获取基本统计
    const stats = await database.get(
      'SELECT COUNT(*) as total_responses FROM responses WHERE survey_id = ?', 
      [surveyId]
    );

    // 获取所有回答
    const responses = await database.query(`
      SELECT r.id, r.respondent_name, r.respondent_email, r.submitted_at
      FROM responses r
      WHERE r.survey_id = ?
      ORDER BY r.submitted_at DESC
    `, [surveyId]);

    // 为每个回答获取具体答案
    for (const response of responses) {
      const answers = await database.query(`
        SELECT q.question_text, a.answer_text
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.response_id = ?
        ORDER BY q.order_num
      `, [response.id]);
      
      response.answers = answers.map(a => `${a.question_text}: ${a.answer_text}`).join('\n');
    }
    
    res.json({
      total_responses: stats.total_responses,
      responses: responses
    });
  } catch (error) {
    console.error('获取问卷结果失败:', error);
    res.status(500).json({ error: '获取结果失败' });
  }
});

// 启动服务器（仅在非Vercel环境）
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });

  // 优雅关闭
  process.on('SIGTERM', async () => {
    console.log('正在关闭服务器...');
    await database.close();
    process.exit(0);
  });
}

// 导出app供Vercel使用
module.exports = app;
