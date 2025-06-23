// 数据库适配器 - 支持SQLite、MySQL和PostgreSQL
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const path = require('path');

class Database {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.databaseUrl = process.env.DATABASE_URL;
    
    if (this.databaseUrl) {
      if (this.databaseUrl.startsWith('mysql://')) {
        this.dbType = 'mysql';
        this.initMySQL();
      } else if (this.databaseUrl.startsWith('postgres://') || this.databaseUrl.startsWith('postgresql://')) {
        this.dbType = 'postgres';
        this.initPostgreSQL();
      } else {
        throw new Error('不支持的数据库类型');
      }
    } else {
      this.dbType = 'sqlite';
      this.initSQLite();
    }
  }

  async initMySQL() {
    try {
      this.pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        },
        connectionLimit: 10
      });
      
      console.log('MySQL连接已建立');
      await this.createMySQLTables();
    } catch (error) {
      console.error('MySQL连接失败:', error);
      throw error;
    }
  }

  async initPostgreSQL() {
    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      console.log('PostgreSQL连接已建立 (Neon/Supabase)');
      await this.createPostgreSQLTables();
    } catch (error) {
      console.error('PostgreSQL连接失败:', error);
      throw error;
    }
  }

  initSQLite() {
    const dbPath = this.isProduction 
      ? path.join('/app/data', 'survey.db')
      : path.join(__dirname, 'survey.db');
    
    this.db = new sqlite3.Database(dbPath);
    console.log('SQLite连接已建立');
  }

  async createMySQLTables() {
    const connection = await this.pool.getConnection();
    
    try {
      // 用户表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 问卷表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS surveys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          creator_id INT NOT NULL,
          is_active BOOLEAN DEFAULT FALSE,
          start_date DATETIME,
          end_date DATETIME,
          email_recipient VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id)
        )
      `);

      // 问题表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          survey_id INT NOT NULL,
          question_text TEXT NOT NULL,
          question_type VARCHAR(20) NOT NULL,
          options JSON,
          is_required BOOLEAN DEFAULT FALSE,
          order_num INT NOT NULL,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
        )
      `);

      // 回答表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS responses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          survey_id INT NOT NULL,
          respondent_name VARCHAR(100),
          respondent_email VARCHAR(100),
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (survey_id) REFERENCES surveys(id)
        )
      `);

      // 答案表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS answers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          response_id INT NOT NULL,
          question_id INT NOT NULL,
          answer_text TEXT,
          FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id)
        )
      `);

      // 检查是否存在管理员用户
      const [adminExists] = await connection.execute(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        ['admin']
      );

      if (adminExists.length === 0) {
        const bcrypt = require('bcrypt');
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        await connection.execute(
          'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
          ['admin', 'admin@survey.com', adminPassword, true]
        );
        
        console.log('默认管理员用户已创建');
      }

      console.log('MySQL表结构创建完成');
    } finally {
      connection.release();
    }
  }

  async createPostgreSQLTables() {
    const client = await this.pool.connect();
    
    try {
      // 用户表
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 问卷表
      await client.query(`
        CREATE TABLE IF NOT EXISTS surveys (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          creator_id INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT FALSE,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          email_recipient VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id)
        )
      `);

      // 问题表
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          survey_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          question_type VARCHAR(20) NOT NULL,
          options JSONB,
          is_required BOOLEAN DEFAULT FALSE,
          order_num INTEGER NOT NULL,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
        )
      `);

      // 回答表
      await client.query(`
        CREATE TABLE IF NOT EXISTS responses (
          id SERIAL PRIMARY KEY,
          survey_id INTEGER NOT NULL,
          respondent_name VARCHAR(100),
          respondent_email VARCHAR(100),
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (survey_id) REFERENCES surveys(id)
        )
      `);

      // 答案表
      await client.query(`
        CREATE TABLE IF NOT EXISTS answers (
          id SERIAL PRIMARY KEY,
          response_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          answer_text TEXT,
          FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id)
        )
      `);

      // 检查是否存在管理员用户
      const adminExists = await client.query(
        'SELECT id FROM users WHERE username = $1 LIMIT 1',
        ['admin']
      );

      if (adminExists.rows.length === 0) {
        const bcrypt = require('bcrypt');
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        await client.query(
          'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)',
          ['admin', 'admin@survey.com', adminPassword, true]
        );
        
        console.log('默认管理员用户已创建');
      }

      console.log('PostgreSQL表结构创建完成');
    } finally {
      client.release();
    }
  }

  // 通用查询方法
  async query(sql, params = []) {
    if (this.dbType === 'mysql') {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } else if (this.dbType === 'postgres') {
      // 转换参数占位符从 ? 到 $1, $2, ...
      let pgSql = sql;
      let pgParams = params;
      if (params.length > 0) {
        for (let i = 0; i < params.length; i++) {
          pgSql = pgSql.replace('?', `$${i + 1}`);
        }
      }
      const result = await this.pool.query(pgSql, pgParams);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  // 获取单行数据
  async get(sql, params = []) {
    if (this.dbType === 'mysql') {
      const [rows] = await this.pool.execute(sql, params);
      return rows[0] || null;
    } else if (this.dbType === 'postgres') {
      // 转换参数占位符
      let pgSql = sql;
      if (params.length > 0) {
        for (let i = 0; i < params.length; i++) {
          pgSql = pgSql.replace('?', `$${i + 1}`);
        }
      }
      const result = await this.pool.query(pgSql, params);
      return result.rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  // 执行插入/更新/删除
  async run(sql, params = []) {
    if (this.dbType === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return {
        lastID: result.insertId,
        changes: result.affectedRows
      };
    } else if (this.dbType === 'postgres') {
      // 转换参数占位符
      let pgSql = sql;
      if (params.length > 0) {
        for (let i = 0; i < params.length; i++) {
          pgSql = pgSql.replace('?', `$${i + 1}`);
        }
      }
      
      // 对于INSERT语句，添加RETURNING id以获取lastID
      if (sql.toUpperCase().trim().startsWith('INSERT')) {
        if (!pgSql.toUpperCase().includes('RETURNING')) {
          pgSql += ' RETURNING id';
        }
        const result = await this.pool.query(pgSql, params);
        return {
          lastID: result.rows[0]?.id || null,
          changes: result.rowCount
        };
      } else {
        const result = await this.pool.query(pgSql, params);
        return {
          lastID: null,
          changes: result.rowCount
        };
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  // 关闭连接
  async close() {
    if (this.dbType === 'mysql' || this.dbType === 'postgres') {
      await this.pool.end();
    } else {
      this.db.close();
    }
  }
}

module.exports = Database;
