// 管理后台功能

let questionCount = 0;
let questions = []; // 存储当前正在编辑的问题列表
let isEditMode = false; // 标记当前是否为编辑模式

// 渲染问题列表（用于编辑模式）
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    questionCount = 0;
    
    questions.forEach((question, index) => {
        questionCount++;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.id = `question_${questionCount}`;
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <h4>问题 ${questionCount}</h4>
                <button type="button" class="remove-question" onclick="removeQuestion(${questionCount})">删除</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">问题内容</label>
                <input type="text" name="question_text_${questionCount}" class="form-input" value="${question.question_text}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">问题类型</label>
                <select name="question_type_${questionCount}" class="form-select" onchange="handleQuestionTypeChange(${questionCount})">
                    <option value="text" ${question.question_type === 'text' ? 'selected' : ''}>单行文本</option>
                    <option value="textarea" ${question.question_type === 'textarea' ? 'selected' : ''}>多行文本</option>
                    <option value="radio" ${question.question_type === 'radio' ? 'selected' : ''}>单选题</option>
                    <option value="checkbox" ${question.question_type === 'checkbox' ? 'selected' : ''}>多选题</option>
                    <option value="select" ${question.question_type === 'select' ? 'selected' : ''}>下拉选择</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_required_${questionCount}" ${question.is_required ? 'checked' : ''}> 必填项
                </label>
            </div>
            
            <div class="form-group options-group" id="options_${questionCount}" style="display: ${(question.question_type === 'radio' || question.question_type === 'checkbox' || question.question_type === 'select') ? 'block' : 'none'};">
                <label class="form-label">选项设置</label>
                <div class="options-container" id="options_container_${questionCount}">
                    ${question.options ? question.options.map((option, optIndex) => `
                        <div class="option-item">
                            <input type="text" name="option_${questionCount}_${optIndex + 1}" class="form-input" placeholder="选项内容" value="${option}">
                            <button type="button" class="remove-option" onclick="removeOption(this)">删除</button>
                        </div>
                    `).join('') : ''}
                </div>
                <button type="button" class="add-option" onclick="addOption(${questionCount})">添加选项</button>
            </div>
        `;
        
        container.appendChild(questionDiv);
    });
}

// 测试邮件功能
async function testEmail() {
    const testEmail = prompt('请输入测试邮件地址：');
    if (!testEmail || !testEmail.includes('@')) {
        showAlert('请输入有效的邮件地址', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/admin/test-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testEmail })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`测试邮件发送成功！消息ID: ${data.messageId}`, 'success');
        } else {
            showAlert(`邮件发送失败: ${data.details}`, 'danger');
        }
    } catch (error) {
        showAlert('网络错误，请稍后重试', 'danger');
    }
}

// 显示提示信息
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// 移动端导航切换
function toggleMobileNav() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('show');
}

// 点击外部关闭移动端导航
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('navLinks');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    
    if (navLinks && navLinks.classList.contains('show') && 
        !navLinks.contains(e.target) && 
        !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('show');
    }
});

// 检查管理员权限并初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    const hasPermission = await requireAdmin();
    if (!hasPermission) return;
    
    await updateNavigation();
    await loadSurveys();
});

// 加载问卷列表
async function loadSurveys() {
    try {
        const response = await fetch('/api/admin/surveys');
        const surveys = await response.json();

        const tbody = document.getElementById('surveysTableBody');
        tbody.innerHTML = '';

        surveys.forEach(survey => {
            const row = createSurveyRow(survey);
            tbody.appendChild(row);
        });

    } catch (error) {
        showAlert('加载问卷失败', 'danger');
    }
}

// 创建问卷表格行
function createSurveyRow(survey) {
    const row = document.createElement('tr');
    
    const createdDate = new Date(survey.created_at).toLocaleDateString();
    const startDate = survey.start_date ? new Date(survey.start_date).toLocaleDateString() : '-';
    const endDate = survey.end_date ? new Date(survey.end_date).toLocaleDateString() : '-';
    
    const statusClass = survey.is_active ? 'status-active' : 'status-inactive';
    const statusText = survey.is_active ? '已激活' : '未激活';
    const toggleText = survey.is_active ? '停用' : '激活';

    row.innerHTML = `
        <td>${survey.title}</td>
        <td>${survey.creator_name}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${survey.response_count || 0}</td>
        <td>
            <button class="btn btn-small" onclick="editSurvey(${survey.id})">编辑</button>
            <button class="btn btn-small btn-success" onclick="viewStatistics(${survey.id})">统计</button>
            <button class="btn btn-small" onclick="toggleSurvey(${survey.id})">${toggleText}</button>
            <button class="btn btn-small btn-secondary" onclick="viewResults(${survey.id})">查看结果</button>
            <button class="btn btn-small btn-danger" onclick="deleteSurvey(${survey.id})">删除</button>
        </td>
    `;

    return row;
}

// 显示创建问卷模态框
function showCreateModal() {
    document.getElementById('createModal').classList.remove('hidden');
    resetCreateForm();
}

// 隐藏创建问卷模态框
function hideCreateModal() {
    document.getElementById('createModal').classList.add('hidden');
}

// 重置创建表单
function resetCreateForm() {
    document.getElementById('createSurveyForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    questionCount = 0;
}

// 添加问题
function addQuestion() {
    questionCount++;
    const container = document.getElementById('questionsContainer');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = `question_${questionCount}`;
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>问题 ${questionCount}</h4>
            <button type="button" class="remove-question" onclick="removeQuestion(${questionCount})">删除</button>
        </div>
        
        <div class="form-group">
            <label class="form-label">问题内容</label>
            <input type="text" name="question_text_${questionCount}" class="form-input" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">问题类型</label>
            <select name="question_type_${questionCount}" class="form-select" onchange="handleQuestionTypeChange(${questionCount})">
                <option value="text">单行文本</option>
                <option value="textarea">多行文本</option>
                <option value="radio">单选题</option>
                <option value="checkbox">多选题</option>
                <option value="select">下拉选择</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" name="is_required_${questionCount}"> 必填项
            </label>
        </div>
        
        <div class="form-group options-group" id="options_${questionCount}" style="display: none;">
            <label class="form-label">选项设置</label>
            <div class="options-container" id="options_container_${questionCount}">
                <!-- 选项将在这里动态添加 -->
            </div>
            <button type="button" class="btn btn-small btn-secondary" onclick="addOption(${questionCount})">添加选项</button>
        </div>
    `;
    
    container.appendChild(questionDiv);
}

// 删除问题
function removeQuestion(questionId) {
    const questionDiv = document.getElementById(`question_${questionId}`);
    if (questionDiv) {
        questionDiv.remove();
    }
}

// 处理问题类型变化
function handleQuestionTypeChange(questionId) {
    const select = document.querySelector(`select[name="question_type_${questionId}"]`);
    const optionsGroup = document.getElementById(`options_${questionId}`);
    
    if (['radio', 'checkbox', 'select'].includes(select.value)) {
        optionsGroup.style.display = 'block';
        if (!optionsGroup.querySelector('.option-item')) {
            addOption(questionId);
            addOption(questionId);
        }
    } else {
        optionsGroup.style.display = 'none';
    }
}

// 添加选项
function addOption(questionId) {
    const container = document.getElementById(`options_container_${questionId}`);
    const optionCount = container.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    
    optionDiv.innerHTML = `
        <input type="text" name="option_${questionId}_${optionCount}" class="form-input" placeholder="选项内容">
        <button type="button" class="remove-option" onclick="removeOption(this)">删除</button>
    `;
    
    container.appendChild(optionDiv);
}

// 删除选项
function removeOption(button) {
    button.parentElement.remove();
}

// 处理创建问卷表单提交
document.getElementById('createSurveyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 如果是编辑模式，不执行创建逻辑（由onsubmit处理）
    if (isEditMode) {
        return;
    }
    
    const formData = new FormData(e.target);
    const surveyData = {
        title: formData.get('title'),
        description: formData.get('description'),
        start_date: formData.get('startDate') || null,
        end_date: formData.get('endDate') || null,
        email_recipient: formData.get('emailRecipient') || null,
        questions: []
    };

    // 收集问题数据
    for (let i = 1; i <= questionCount; i++) {
        const questionDiv = document.getElementById(`question_${i}`);
        if (!questionDiv) continue;

        const questionText = formData.get(`question_text_${i}`);
        const questionType = formData.get(`question_type_${i}`);
        const isRequired = formData.get(`is_required_${i}`) === 'on';

        if (!questionText) continue;

        const question = {
            question_text: questionText,
            question_type: questionType,
            is_required: isRequired,
            options: []
        };

        // 收集选项
        if (['radio', 'checkbox', 'select'].includes(questionType)) {
            const optionsContainer = document.getElementById(`options_container_${i}`);
            const optionInputs = optionsContainer.querySelectorAll('input[type="text"]');
            
            optionInputs.forEach(input => {
                if (input.value.trim()) {
                    question.options.push(input.value.trim());
                }
            });
        }

        surveyData.questions.push(question);
    }

    if (surveyData.questions.length === 0) {
        showAlert('请至少添加一个问题', 'danger');
        return;
    }

    try {
        console.log('创建问卷 - 发送请求:', surveyData);
        const response = await fetch('/api/admin/surveys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(surveyData)
        });

        console.log('创建问卷 - 响应状态:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('创建问卷 - 响应数据:', data);

        if (response.ok) {
            console.log('创建问卷 - 成功');
            showAlert('问卷创建成功', 'success');
            hideCreateModal();
            await loadSurveys();
        } else {
            console.error('创建问卷 - 服务器错误:', response.status, data);
            showAlert(data.error || '创建失败', 'danger');
        }
    } catch (error) {
        console.error('创建问卷 - 网络/解析错误:', error);
        showAlert('网络错误，请稍后重试', 'danger');
        // 即使出错也刷新列表，因为问卷可能已经创建成功
        try {
            await loadSurveys();
        } catch (e) {
            console.error('刷新问卷列表失败:', e);
        }
    }
});

// 切换问卷状态
async function toggleSurvey(surveyId) {
    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}/toggle`, {
            method: 'PATCH'
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('操作成功', 'success');
            await loadSurveys();
        } else {
            showAlert(data.error || '操作失败', 'danger');
        }
    } catch (error) {
        showAlert('网络错误，请稍后重试', 'danger');
    }
}

// 查看问卷结果
async function viewResults(surveyId) {
    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}/results`);
        const data = await response.json();

        if (response.ok) {
            displayResults(data);
        } else {
            showAlert(data.error || '获取结果失败', 'danger');
        }
    } catch (error) {
        showAlert('网络错误，请稍后重试', 'danger');
    }
}

// 显示结果
function displayResults(data) {
    const resultWindow = window.open('', '_blank', 'width=800,height=600');
    
    let resultHtml = `
        <html>
        <head>
            <title>问卷结果</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .result-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
                .stats { background: #f8f9fa; padding: 15px; margin-bottom: 20px; }
                .action-buttons { margin: 20px 0; }
                .btn { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
                .btn:hover { background: #0056b3; }
                .btn-success { background: #28a745; }
                .btn-success:hover { background: #1e7e34; }
            </style>
        </head>
        <body>
            <h1>问卷结果统计</h1>
            <div class="stats">
                <h3>总体统计</h3>
                <p>总回答数: ${data.total_responses}</p>
            </div>
            <div class="action-buttons">
                <button class="btn btn-success" onclick="sendCSVEmail(${data.survey_id})">发送CSV结果到邮箱</button>
                <button class="btn" onclick="window.print()">打印结果</button>
            </div>
            <h3>详细回答</h3>
    `;

    data.responses.forEach((response, index) => {
        const submitDate = new Date(response.submitted_at).toLocaleString();
        resultHtml += `
            <div class="result-item">
                <h4>回答 #${index + 1}</h4>
                <p><strong>姓名:</strong> ${response.respondent_name || '匿名'}</p>
                <p><strong>邮箱:</strong> ${response.respondent_email || '未提供'}</p>
                <p><strong>提交时间:</strong> ${submitDate}</p>
                <div><strong>回答内容:</strong></div>
                <pre>${response.answers || '无回答内容'}</pre>
            </div>
        `;
    });

    resultHtml += `
            <script>
                // 发送CSV邮件函数
                async function sendCSVEmail(surveyId) {
                    const button = event.target;
                    button.disabled = true;
                    button.textContent = '发送中...';
                    
                    try {
                        const response = await fetch(\`/api/admin/surveys/\${surveyId}/send-csv\`, {
                            method: 'POST'
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            alert('CSV结果已发送到指定邮箱！');
                            button.textContent = '发送成功';
                            button.style.background = '#28a745';
                        } else {
                            alert('发送失败：' + (data.error || '未知错误'));
                            button.disabled = false;
                            button.textContent = '发送CSV结果到邮箱';
                        }
                    } catch (error) {
                        alert('发送失败：网络错误');
                        button.disabled = false;
                        button.textContent = '发送CSV结果到邮箱';
                    }
                }
            </script>
        </body>
        </html>
    `;

    resultWindow.document.write(resultHtml);
}

// 编辑问卷
async function editSurvey(surveyId) {
    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}/edit`);
        const survey = await response.json();
        
        if (response.ok) {
            console.log('编辑问卷 - API响应成功:', survey);
            
            // 填充编辑表单
            document.getElementById('title').value = survey.title;
            document.getElementById('description').value = survey.description || '';
            // 处理datetime-local格式 (YYYY-MM-DDTHH:MM)
            document.getElementById('startDate').value = survey.start_date ? 
                new Date(survey.start_date).toISOString().slice(0, 16) : '';
            document.getElementById('endDate').value = survey.end_date ? 
                new Date(survey.end_date).toISOString().slice(0, 16) : '';
            document.getElementById('emailRecipient').value = survey.email_recipient || '';
            
            // 清空现有问题
            questions.length = 0;
            
            // 加载问题（检查questions是否存在）
            if (survey.questions && Array.isArray(survey.questions)) {
                console.log('加载问题数量:', survey.questions.length);
                survey.questions.forEach(question => {
                    questions.push({
                        question_text: question.question_text,
                        question_type: question.question_type,
                        options: question.options || [],
                        is_required: question.is_required
                    });
                });
            } else {
                console.warn('问卷没有questions数组或questions不是数组:', survey.questions);
            }
            
            renderQuestions();
            
            // 设置编辑模式
            isEditMode = true;
            
            // 修改表单提交行为
            const form = document.getElementById('createSurveyForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await updateSurvey(surveyId);
            };
            
            // 修改模态框标题和按钮文字
            document.querySelector('#createModal h2').textContent = '编辑问卷';
            document.querySelector('#createModal button[type="submit"]').textContent = '保存修改';
            document.getElementById('createModal').classList.remove('hidden');
        } else {
            console.error('编辑问卷 - API响应失败:', response.status, survey);
            showAlert(survey.error || '获取问卷信息失败', 'danger');
        }
    } catch (error) {
        console.error('编辑问卷 - 请求失败:', error);
        showAlert('获取问卷信息失败', 'danger');
    }
}

// 更新问卷
async function updateSurvey(surveyId) {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const emailRecipient = document.getElementById('emailRecipient').value;

    if (!title || questions.length === 0) {
        showAlert('请填写问卷标题并添加至少一个问题', 'danger');
        return;
    }

    // 禁用提交按钮并显示保存状态
    const submitBtn = document.querySelector('#createModal button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                start_date: startDate || null,
                end_date: endDate || null,
                email_recipient: emailRecipient || null,
                questions
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('问卷保存成功！', 'success');
            submitBtn.textContent = '保存成功';
            setTimeout(() => {
                hideCreateModal();
                loadSurveys();
            }, 1000);
        } else {
            showAlert(data.error || '保存失败', 'danger');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        showAlert('保存失败，请稍后重试', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 查看统计
async function viewStatistics(surveyId) {
    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}/statistics`);
        const data = await response.json();
        
        if (response.ok) {
            showStatisticsModal(data);
        } else {
            showAlert(data.error || '获取统计数据失败', 'danger');
        }
    } catch (error) {
        showAlert('获取统计数据失败', 'danger');
    }
}

// 显示统计模态框
function showStatisticsModal(data) {
    // 创建统计模态框
    const modalHtml = `
        <div id="statisticsModal" class="modal-overlay">
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>问卷统计 - ${data.survey_info.title}</h2>
                    <button onclick="hideStatisticsModal()" class="btn btn-small btn-secondary">关闭</button>
                </div>
                <div class="statistics-content">
                    <div class="stats-summary">
                        <h3>总体统计</h3>
                        <p><strong>总回答数：</strong>${data.total_responses}</p>
                        <p><strong>创建时间：</strong>${new Date(data.survey_info.created_at).toLocaleString()}</p>
                    </div>
                    <div class="question-stats">
                        ${data.question_statistics.map(questionStat => 
                            generateQuestionStatHtml(questionStat)
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('statisticsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 渲染图表
    setTimeout(() => {
        data.question_statistics.forEach((questionStat, index) => {
            if (questionStat.stats.type === 'pie' && questionStat.stats.data.some(d => d.value > 0)) {
                renderPieChart(`chart-${questionStat.question_id}`, questionStat.stats.data);
            } else if (questionStat.stats.type === 'bar' && questionStat.stats.data.some(d => d.value > 0)) {
                renderBarChart(`chart-${questionStat.question_id}`, questionStat.stats.data);
            }
        });
    }, 100);
}

// 生成问题统计HTML
function generateQuestionStatHtml(questionStat) {
    let chartHtml = '';
    
    if (questionStat.stats.type === 'pie' || questionStat.stats.type === 'bar') {
        chartHtml = `<canvas id="chart-${questionStat.question_id}" width="400" height="300"></canvas>`;
    } else if (questionStat.stats.type === 'text') {
        chartHtml = `
            <div class="text-stats">
                <p><strong>回答总数：</strong>${questionStat.stats.data.total}</p>
                <p><strong>答案样本：</strong></p>
                <ul>
                    ${questionStat.stats.data.samples.map(sample => 
                        `<li>${sample}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    return `
        <div class="question-stat-item">
            <h4>${questionStat.question_text}</h4>
            <p>题型：${getQuestionTypeName(questionStat.question_type)} | 回答数：${questionStat.total_answers}</p>
            <div class="chart-container">
                ${chartHtml}
            </div>
        </div>
    `;
}

// 获取题型名称
function getQuestionTypeName(type) {
    const typeNames = {
        'text': '单行文本',
        'textarea': '多行文本',
        'radio': '单选题',
        'checkbox': '多选题'
    };
    return typeNames[type] || type;
}

// 简单的饼图渲染
function renderPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 50;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    let currentAngle = 0;
    
    data.forEach((item, index) => {
        if (item.value > 0) {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            
            // 添加标签
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.label}: ${item.value}`, labelX, labelY);
            
            currentAngle += sliceAngle;
        }
    });
}

// 简单的柱状图渲染
function renderBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(...data.map(item => item.value));
    if (maxValue === 0) return;
    
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding + index * (barWidth + barSpacing);
        const y = canvas.height - padding - barHeight;
        
        ctx.fillStyle = '#36A2EB';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 添加数值标签
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
        
        // 添加选项标签
        ctx.save();
        ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(item.label, 0, 0);
        ctx.restore();
    });
}

// 关闭统计模态框
function hideStatisticsModal() {
    const modal = document.getElementById('statisticsModal');
    if (modal) {
        modal.remove();
    }
}

// 删除问卷
async function deleteSurvey(surveyId) {
    if (!confirm('确定要删除这个问卷吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/surveys/${surveyId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('问卷删除成功', 'success');
            loadSurveys();
        } else {
            showAlert(data.error || '删除失败', 'danger');
        }
    } catch (error) {
        showAlert('删除失败，请稍后重试', 'danger');
    }
}

// 重置创建表单为创建模式
function resetToCreateMode() {
    // 重置编辑模式标志
    isEditMode = false;
    
    // 重置表单提交行为为默认（创建模式）
    const form = document.getElementById('createSurveyForm');
    form.onsubmit = null; // 清除编辑模式的onsubmit，让addEventListener生效
    document.querySelector('#createModal h2').textContent = '创建新问卷';
    document.querySelector('#createModal button[type="submit"]').textContent = '创建问卷';
}

// 点击模态框外部关闭
document.getElementById('createModal').addEventListener('click', (e) => {
    if (e.target.id === 'createModal') {
        hideCreateModal();
        resetToCreateMode();
    }
});

// 修改hideCreateModal函数
const originalHideCreateModal = hideCreateModal;
hideCreateModal = function() {
    originalHideCreateModal();
    resetToCreateMode();
};
