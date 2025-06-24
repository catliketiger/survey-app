// 主页功能

// 显示提示信息
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
}

// 加载问卷列表
async function loadSurveys() {
    const surveyGrid = document.getElementById('surveyGrid');
    const noSurveys = document.getElementById('noSurveys');
    const loadingMessage = document.getElementById('loadingMessage');

    try {
        const response = await fetch('/api/surveys');
        const surveys = await response.json();

        loadingMessage.classList.add('hidden');

        if (surveys.length === 0) {
            noSurveys.classList.remove('hidden');
            return;
        }

        surveyGrid.innerHTML = '';
        surveys.forEach(survey => {
            const surveyCard = createSurveyCard(survey);
            surveyGrid.appendChild(surveyCard);
        });

    } catch (error) {
        loadingMessage.classList.add('hidden');
        showAlert('加载问卷失败，请稍后重试', 'danger');
    }
}

// 创建问卷卡片
function createSurveyCard(survey) {
    const card = document.createElement('div');
    card.className = 'survey-card';
    
    const createdDate = new Date(survey.created_at).toLocaleDateString();
    const startDate = survey.start_date ? new Date(survey.start_date).toLocaleDateString() : '无限制';
    const endDate = survey.end_date ? new Date(survey.end_date).toLocaleDateString() : '无限制';

    card.innerHTML = `
        <div class="survey-title">${survey.title}</div>
        <div class="survey-description">${survey.description || '暂无描述'}</div>
        <div class="survey-meta">
            <p><strong>创建者：</strong>${survey.creator_name}</p>
            <p><strong>创建时间：</strong>${createdDate}</p>
            <p><strong>有效期：</strong>${startDate} 至 ${endDate}</p>
        </div>
        <a href="survey.html?id=${survey.id}" class="btn">参与问卷</a>
    `;

    return card;
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSurveys();
});
