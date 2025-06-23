// 认证相关功能

// 检查用户登录状态
async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const data = await response.json();
            return data.user;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// 用户登出
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('登出失败:', error);
    }
}

// 更新导航栏用户信息
async function updateNavigation() {
    const user = await checkAuth();
    const userInfo = document.getElementById('userInfo');
    const authLinks = document.getElementById('authLinks');
    const username = document.getElementById('username');
    const adminLink = document.getElementById('adminLink');

    if (user) {
        // 用户已登录
        if (userInfo) userInfo.classList.remove('hidden');
        if (authLinks) authLinks.classList.add('hidden');
        if (username) username.textContent = user.username;
        
        // 显示管理员链接
        if (adminLink && user.is_admin) {
            adminLink.classList.remove('hidden');
        }
    } else {
        // 用户未登录
        if (userInfo) userInfo.classList.add('hidden');
        if (authLinks) authLinks.classList.remove('hidden');
    }

    return user;
}

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});

// 检查管理员权限
async function requireAdmin() {
    const user = await checkAuth();
    if (!user || !user.is_admin) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}
