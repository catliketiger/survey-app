// 管理后台功能

let questionCount = 0;

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
            <button class="btn btn-small" onclick="toggleSurvey(${survey.id})">${toggleText}</button>
            <button class="btn btn-small btn-secondary" onclick="viewResults(${survey.id})">查看结果</button>
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
        const response = await fetch('/api/admin/surveys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(surveyData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('问卷创建成功', 'success');
            hideCreateModal();
            await loadSurveys();
        } else {
            showAlert(data.error || '创建失败', 'danger');
        }
    } catch (error) {
        showAlert('网络错误，请稍后重试', 'danger');
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
            </style>
        </head>
        <body>
            <h1>问卷结果统计</h1>
            <div class="stats">
                <h3>总体统计</h3>
                <p>总回答数: ${data.total_responses}</p>
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
        </body>
        </html>
    `;

    resultWindow.document.write(resultHtml);
}

// 点击模态框外部关闭
document.getElementById('createModal').addEventListener('click', (e) => {
    if (e.target.id === 'createModal') {
        hideCreateModal();
    }
});
