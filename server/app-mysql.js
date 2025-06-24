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
    let query;
    
    if (database.dbType === 'postgres') {
      query = `
        SELECT s.*, u.username as creator_name 
        FROM surveys s 
        JOIN users u ON s.creator_id = u.id 
        WHERE s.is_active = true 
        AND (s.start_date IS NULL OR s.start_date <= CURRENT_TIMESTAMP)
        AND (s.end_date IS NULL OR s.end_date >= CURRENT_TIMESTAMP)
        ORDER BY s.created_at DESC
      `;
    } else {
      query = `
        SELECT s.*, u.username as creator_name 
        FROM surveys s 
        JOIN users u ON s.creator_id = u.id 
        WHERE s.is_active = 1 
        AND (s.start_date IS NULL OR s.start_date <= NOW())
        AND (s.end_date IS NULL OR s.end_date >= NOW())
        ORDER BY s.created_at DESC
      `;
    }
    
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
    let surveyQuery;
    if (database.dbType === 'postgres') {
      surveyQuery = 'SELECT * FROM surveys WHERE id = ? AND is_active = true';
    } else {
      surveyQuery = 'SELECT * FROM surveys WHERE id = ? AND is_active = 1';
    }
    
    const survey = await database.get(surveyQuery, [surveyId]);
    
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

// 获取问卷编辑信息
app.get('/api/admin/surveys/:id/edit', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  if (isNaN(surveyId)) {
    return res.status(400).json({ error: '无效的问卷ID' });
  }
  
  try {
    console.log('获取问卷编辑信息, surveyId:', surveyId, 'type:', typeof surveyId);
    
    // 获取问卷基本信息
    const survey = await database.get('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    console.log('查询到的问卷信息:', survey);
    
    if (!survey) {
      console.log('问卷不存在, surveyId:', surveyId);
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 获取问卷问题
    const questions = await database.query(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num', 
      [surveyId]
    );
    console.log('查询到的问题数量:', questions.length);
    
    // 解析选项JSON
    questions.forEach(q => {
      if (q.options) {
        try {
          q.options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        } catch (e) {
          console.error('解析问题选项失败:', e, 'options:', q.options);
          q.options = [];
        }
      }
    });

    console.log('成功返回问卷编辑信息');
    res.json({ ...survey, questions });
  } catch (error) {
    console.error('获取问卷编辑信息失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '获取编辑信息失败' });
  }
});

// 更新问卷
app.put('/api/admin/surveys/:id', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  if (isNaN(surveyId)) {
    return res.status(400).json({ error: '无效的问卷ID' });
  }
  const { title, description, start_date, end_date, email_recipient, questions } = req.body;

  try {
    // 更新问卷基本信息
    await database.run(
      'UPDATE surveys SET title = ?, description = ?, start_date = ?, end_date = ?, email_recipient = ? WHERE id = ?',
      [title, description, start_date || null, end_date || null, email_recipient || null, surveyId]
    );

    // 删除旧问题（先删除相关答案）
    await database.run(`
      DELETE FROM answers 
      WHERE question_id IN (
        SELECT id FROM questions WHERE survey_id = ?
      )
    `, [surveyId]);
    console.log('已删除问题相关答案');
    
    await database.run('DELETE FROM questions WHERE survey_id = ?', [surveyId]);
    console.log('已删除旧问题');

    // 插入新问题
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const optionsJson = question.options ? JSON.stringify(question.options) : null;
      
      await database.run(
        'INSERT INTO questions (survey_id, question_text, question_type, options, is_required, order_num) VALUES (?, ?, ?, ?, ?, ?)',
        [surveyId, question.question_text, question.question_type, optionsJson, question.is_required || false, i + 1]
      );
    }

    res.json({ message: '问卷更新成功' });
  } catch (error) {
    console.error('更新问卷失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 获取问卷统计数据
app.get('/api/admin/surveys/:id/statistics', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  if (isNaN(surveyId)) {
    return res.status(400).json({ error: '无效的问卷ID' });
  }
  
  try {
    // 获取问卷基本信息
    const survey = await database.get('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    
    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 获取问卷问题
    const questions = await database.query(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_num', 
      [surveyId]
    );

    // 获取回答总数
    const totalResponses = await database.get(
      'SELECT COUNT(*) as count FROM responses WHERE survey_id = ?', 
      [surveyId]
    );

    // 为每个问题统计答案分布
    const questionStats = [];
    
    for (const question of questions) {
      // 解析选项
      let options = [];
      if (question.options) {
        try {
          options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
        } catch (e) {
          options = [];
        }
      }

      // 获取该问题的所有答案
      const answers = await database.query(`
        SELECT a.answer_text 
        FROM answers a 
        JOIN responses r ON a.response_id = r.id 
        WHERE a.question_id = ? AND r.survey_id = ?
      `, [question.id, surveyId]);

      let stats = {};

      if (question.question_type === 'radio') {
        // 单选题统计
        stats = {
          type: 'pie',
          data: options.map(option => ({
            label: option,
            value: answers.filter(a => a.answer_text === option).length
          }))
        };
      } else if (question.question_type === 'checkbox') {
        // 多选题统计
        const checkboxStats = {};
        options.forEach(option => {
          checkboxStats[option] = 0;
        });

        answers.forEach(answer => {
          try {
            const selectedOptions = JSON.parse(answer.answer_text || '[]');
            selectedOptions.forEach(option => {
              if (checkboxStats.hasOwnProperty(option)) {
                checkboxStats[option]++;
              }
            });
          } catch (e) {
            // 处理非JSON格式的答案
            if (checkboxStats.hasOwnProperty(answer.answer_text)) {
              checkboxStats[answer.answer_text]++;
            }
          }
        });

        stats = {
          type: 'bar',
          data: Object.entries(checkboxStats).map(([label, value]) => ({
            label,
            value
          }))
        };
      } else {
        // 文本题统计
        const textAnswers = answers.map(a => a.answer_text).filter(Boolean);
        stats = {
          type: 'text',
          data: {
            total: textAnswers.length,
            samples: textAnswers.slice(0, 10) // 显示前10个答案作为样本
          }
        };
      }

      questionStats.push({
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        total_answers: answers.length,
        stats
      });
    }

    res.json({
      survey_info: survey,
      total_responses: totalResponses.count,
      question_statistics: questionStats
    });
  } catch (error) {
    console.error('获取问卷统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 删除问卷
app.delete('/api/admin/surveys/:id', authenticateToken, requireAdmin, async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  if (isNaN(surveyId)) {
    return res.status(400).json({ error: '无效的问卷ID' });
  }
  
  try {
    console.log('删除问卷, surveyId:', surveyId, 'type:', typeof surveyId);
    
    // 检查问卷是否存在
    const survey = await database.get('SELECT id FROM surveys WHERE id = ?', [surveyId]);
    console.log('查询到的问卷:', survey);
    
    if (!survey) {
      console.log('问卷不存在, surveyId:', surveyId);
      return res.status(404).json({ error: '问卷不存在' });
    }

    // 按正确顺序删除相关数据（处理外键约束）
    // 1. 先删除答案
    await database.run(`
      DELETE FROM answers 
      WHERE response_id IN (
        SELECT id FROM responses WHERE survey_id = ?
      )
    `, [surveyId]);
    console.log('已删除相关答案');
    
    // 2. 删除回答记录
    await database.run('DELETE FROM responses WHERE survey_id = ?', [surveyId]);
    console.log('已删除相关回答');
    
    // 3. 删除问题
    await database.run('DELETE FROM questions WHERE survey_id = ?', [surveyId]);
    console.log('已删除相关问题');
    
    // 4. 最后删除问卷
    const deleteResult = await database.run('DELETE FROM surveys WHERE id = ?', [surveyId]);
    console.log('删除结果:', deleteResult);

    res.json({ message: '问卷删除成功' });
  } catch (error) {
    console.error('删除问卷失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '删除失败' });
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
