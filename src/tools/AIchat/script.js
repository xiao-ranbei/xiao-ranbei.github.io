// AI聊天工具脚本
// 基于DeepSeek API实现
// 集成Supabase用于用户管理和对话历史持久化

// API配置 - 使用Supabase Edge Function作为代理
const SUPABASE_EDGE_FUNCTION_URL = 'https://your-supabase-url.functions.supabase.co/deepseek-proxy';

// Supabase配置（需要在实际部署时替换为真实的Supabase项目信息）
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = 'your-supabase-api-key';

// 初始化Supabase客户端
const supabase = typeof window !== 'undefined' ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// 全局变量
let messages = [];
let isTyping = false;
let currentUser = null;
let currentConversationId = null;
let conversations = [];

// 初始化应用
async function initApp() {
    // 绑定事件监听器
    bindEventListeners();
    
    // 检查用户登录状态
    await checkUserSession();
    
    // 如果用户已登录，加载对话列表和历史消息
    if (currentUser) {
        await loadConversations();
        await loadHistoryMessages();
    } else {
        // 如果未登录，显示登录/注册界面
        showAuthModal();
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 发送消息按钮
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    
    // 回车键发送消息
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 清空聊天按钮
    document.getElementById('clear-chat').addEventListener('click', clearChat);
    
    // 设置按钮
    document.getElementById('settings').addEventListener('click', toggleSettings);
    
    // 语音输入按钮
    document.getElementById('voice-input').addEventListener('click', toggleVoiceInput);
    
    // 图片上传按钮
    document.getElementById('image-upload').addEventListener('click', openImageUpload);
    
    // 用户认证相关事件监听
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    document.getElementById('switch-to-register').addEventListener('click', switchToRegister);
    document.getElementById('switch-to-login').addEventListener('click', switchToLogin);
    document.getElementById('close-auth-modal').addEventListener('click', hideAuthModal);
    document.getElementById('auth-modal').addEventListener('click', function(e) {
        if (e.target.id === 'auth-modal') {
            hideAuthModal();
        }
    });
    document.getElementById('user-menu-btn').addEventListener('click', function() {
        if (currentUser) {
            // 显示登出确认
            if (confirm('确定要登出吗？')) {
                logout();
            }
        } else {
            showAuthModal();
        }
    });
    
    // 对话列表侧边栏相关事件监听
    document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
    document.getElementById('new-conversation-btn').addEventListener('click', function() {
        createConversation();
        closeSidebar();
    });
}

// 检查用户会话
async function checkUserSession() {
    if (!supabase) return;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('检查会话失败:', error);
            return;
        }
        
        if (session) {
            currentUser = session.user;
            console.log('用户已登录:', currentUser.email);
        }
    } catch (error) {
        console.error('会话检查出错:', error);
    }
}

// 显示认证模态框
function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 隐藏认证模态框
function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// 切换到注册表单
function switchToRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('auth-modal-title').textContent = '注册';
}

// 切换到登录表单
function switchToLogin() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('auth-modal-title').textContent = '登录';
}

// 处理登录
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
        showNotification('请输入邮箱和密码', 'error');
        return;
    }
    
    const success = await login(email, password);
    if (success) {
        hideAuthModal();
        renderConversations();
    }
}

// 处理注册
async function handleRegister() {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    
    if (!email || !password) {
        showNotification('请输入邮箱和密码', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密码长度不能少于6位', 'error');
        return;
    }
    
    const success = await register(email, password);
    if (success) {
        switchToLogin();
        // 清空输入框
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
    }
}

// 切换侧边栏
function toggleSidebar() {
    const sidebar = document.getElementById('conversations-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
    document.body.style.overflow = sidebar.classList.contains('-translate-x-full') ? '' : 'hidden';
}

// 关闭侧边栏
function closeSidebar() {
    const sidebar = document.getElementById('conversations-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// 渲染对话列表
function renderConversations() {
    const conversationsList = document.getElementById('conversations-list');
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<div class="text-center text-gray-500 py-4">暂无对话</div>';
        return;
    }
    
    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = `p-3 rounded-lg border cursor-pointer transition-all ${currentConversationId === conversation.id ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`;
        conversationItem.addEventListener('click', () => {
            switchConversation(conversation.id);
            renderConversations();
            closeSidebar();
        });
        
        const conversationHeader = document.createElement('div');
        conversationHeader.className = 'flex items-center justify-between mb-1';
        
        const conversationTitle = document.createElement('div');
        conversationTitle.className = 'font-medium truncate';
        conversationTitle.textContent = conversation.title;
        
        const conversationActions = document.createElement('div');
        conversationActions.className = 'flex space-x-1';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'p-1 rounded hover:bg-white/20 text-white transition-colors';
        deleteBtn.innerHTML = '<i class="fa fa-trash text-xs"></i>';
        deleteBtn.title = '删除对话';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conversation.id).then(() => {
                renderConversations();
            });
        });
        
        conversationActions.appendChild(deleteBtn);
        conversationHeader.appendChild(conversationTitle);
        conversationHeader.appendChild(conversationActions);
        
        const conversationMeta = document.createElement('div');
        conversationMeta.className = 'text-xs text-gray-500 truncate';
        const createdDate = new Date(conversation.created_at);
        conversationMeta.textContent = createdDate.toLocaleString();
        
        conversationItem.appendChild(conversationHeader);
        conversationItem.appendChild(conversationMeta);
        
        conversationsList.appendChild(conversationItem);
    });
}

// 用户登录
async function login(email, password) {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        currentUser = data.user;
        await loadConversations();
        await loadHistoryMessages();
        
        showNotification('登录成功');
        return true;
    } catch (error) {
        showNotification('登录失败: ' + error.message, 'error');
        console.error('登录失败:', error);
        return false;
    }
}

// 用户注册
async function register(email, password) {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        showNotification('注册成功，请登录');
        return true;
    } catch (error) {
        showNotification('注册失败: ' + error.message, 'error');
        console.error('注册失败:', error);
        return false;
    }
}

// 用户登出
async function logout() {
    if (!supabase) return;
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        currentUser = null;
        currentConversationId = null;
        messages = [];
        conversations = [];
        
        // 清空聊天界面
        document.getElementById('chat-messages').innerHTML = '';
        
        showNotification('已成功登出');
        showAuthModal();
    } catch (error) {
        showNotification('登出失败: ' + error.message, 'error');
        console.error('登出失败:', error);
    }
}

// 创建新对话
async function createConversation(title = '新对话') {
    if (!supabase || !currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('conversations')
            .insert([{
                user_id: currentUser.id,
                title: title,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            throw error;
        }
        
        const newConversation = data[0];
        conversations.push(newConversation);
        currentConversationId = newConversation.id;
        messages = [];
        
        // 清空聊天界面
        document.getElementById('chat-messages').innerHTML = '';
        
        // 添加欢迎消息
        addMessage('你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？', 'ai');
        
        renderConversations();
        showNotification('新对话已创建');
        return newConversation.id;
    } catch (error) {
        showNotification('创建对话失败: ' + error.message, 'error');
        console.error('创建对话失败:', error);
        return null;
    }
}

// 加载对话列表
async function loadConversations() {
    if (!supabase || !currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        conversations = data || [];
        
        // 如果没有对话，创建一个新对话
        if (conversations.length === 0) {
            await createConversation();
        } else {
            // 使用第一个对话作为当前对话
            currentConversationId = conversations[0].id;
        }
        
        console.log('已加载对话列表:', conversations.length, '个对话');
        renderConversations();
    } catch (error) {
        console.error('加载对话列表失败:', error);
        showNotification('加载对话列表失败', 'error');
    }
}

// 切换对话
async function switchConversation(conversationId) {
    if (!supabase || !currentUser) return;
    
    currentConversationId = conversationId;
    messages = [];
    
    // 清空聊天界面
    document.getElementById('chat-messages').innerHTML = '';
    
    // 加载新对话的历史消息
    await loadHistoryMessages();
    
    showNotification('已切换对话');
}

// 删除对话
async function deleteConversation(conversationId) {
    if (!supabase || !currentUser) return;
    
    try {
        // 删除对话相关的所有消息
        const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId);
        
        if (messagesError) {
            throw messagesError;
        }
        
        // 删除对话
        const { error: conversationError } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', currentUser.id);
        
        if (conversationError) {
            throw conversationError;
        }
        
        // 更新对话列表
        conversations = conversations.filter(convo => convo.id !== conversationId);
        
        // 如果删除的是当前对话，切换到第一个对话或创建新对话
        if (currentConversationId === conversationId) {
            if (conversations.length > 0) {
                await switchConversation(conversations[0].id);
            } else {
                await createConversation();
            }
        }
        
        showNotification('对话已删除');
        return true;
    } catch (error) {
        showNotification('删除对话失败: ' + error.message, 'error');
        console.error('删除对话失败:', error);
        return false;
    }
}

// 发送消息
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // 清空输入框
    input.value = '';
    
    // 添加用户消息
    addMessage(message, 'user');
    
    // 显示AI正在输入
    showTypingIndicator();
    
    try {
        // 调用DeepSeek API获取AI回复
        const response = await getAIResponse(message);
        
        // 隐藏正在输入指示器
        hideTypingIndicator();
        
        // 添加AI回复
        addMessage(response, 'ai');
        
        // 保存到历史记录
        await saveHistoryMessages();
    } catch (error) {
        // 隐藏正在输入指示器
        hideTypingIndicator();
        
        // 显示错误消息
        showNotification('发送消息失败，请稍后重试', 'error');
        console.error('API调用错误:', error);
    }
}

// 添加消息到聊天界面
function addMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start message ${sender} fade-in`;
    
    // 头像
    const avatar = document.createElement('div');
    avatar.className = `flex-shrink-0 w-10 h-10 rounded-full ${sender === 'user' ? 'bg-chat-user' : 'bg-chat-ai'} flex items-center justify-center text-white message-avatar`;
    avatar.innerHTML = sender === 'user' ? '<i class="fa fa-user"></i>' : '<i class="fa fa-robot"></i>';
    
    // 消息内容
    const messageContent = document.createElement('div');
    messageContent.className = `ml-3 max-w-[85%] ${sender === 'user' ? 'mr-3' : ''}`;
    
    const messageBubble = document.createElement('div');
    messageBubble.className = `bg-white p-4 rounded-lg shadow-sm border border-gray-200 message-content ${sender === 'user' ? 'bg-chat-user text-white' : ''}`;
    messageBubble.textContent = text;
    
    // 消息来源
    const messageSource = document.createElement('div');
    messageSource.className = 'text-xs text-gray-500 mt-1';
    messageSource.textContent = sender === 'user' ? '你' : 'AI助手';
    
    // 组装消息元素
    messageContent.appendChild(messageBubble);
    messageContent.appendChild(messageSource);
    
    if (sender === 'user') {
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
    }
    
    // 添加到聊天消息区域
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 保存到消息数组
    messages.push({
        text: text,
        sender: sender,
        timestamp: new Date().toISOString()
    });
}

// 显示正在输入指示器
function showTypingIndicator() {
    isTyping = true;
    
    const chatMessages = document.getElementById('chat-messages');
    
    // 创建正在输入指示器
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex items-start fade-in';
    
    const avatar = document.createElement('div');
    avatar.className = 'flex-shrink-0 w-10 h-10 rounded-full bg-chat-ai flex items-center justify-center text-white';
    avatar.innerHTML = '<i class="fa fa-robot"></i>';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'ml-3 max-w-[85%]';
    
    const typingBubble = document.createElement('div');
    typingBubble.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200';
    typingBubble.innerHTML = '<div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
    
    const typingSource = document.createElement('div');
    typingSource.className = 'text-xs text-gray-500 mt-1';
    typingSource.textContent = 'AI助手正在输入...';
    
    typingContent.appendChild(typingBubble);
    typingContent.appendChild(typingSource);
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);
    
    chatMessages.appendChild(typingDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    isTyping = false;
    
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 调用Supabase Edge Function获取AI回复
async function getAIResponse(userMessage) {
    if (!supabase || !currentUser) {
        throw new Error('用户未登录');
    }
    
    // 获取用户会话令牌
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error('无法获取用户会话');
    }
    
    // 准备请求数据
    const requestData = {
        messages: [
            {
                role: 'system',
                content: 'You are a helpful AI assistant. Please respond in Chinese.'
            },
            ...messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            {
                role: 'user',
                content: userMessage
            }
        ],
        temperature: 0.7,
        max_tokens: 1024
    };
    
    // 发送请求到Supabase Edge Function
    const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${errorData.error || response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
    } else {
        throw new Error('API返回格式错误');
    }
}

// 清空聊天
async function clearChat() {
    if (confirm('确定要清空聊天记录吗？')) {
        // 清空消息数组
        messages = [];
        
        // 清空聊天界面
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // 添加欢迎消息
        addMessage('你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？', 'ai');
        
        // 保存到Supabase
        await saveHistoryMessages();
        
        // 显示通知
        showNotification('聊天记录已清空');
    }
}

// 切换设置面板
function toggleSettings() {
    // 这里可以添加设置面板的逻辑
    showNotification('设置功能正在开发中');
}

// 切换语音输入
function toggleVoiceInput() {
    // 这里可以添加语音输入的逻辑
    showNotification('语音输入功能正在开发中');
}

// 打开图片上传
function openImageUpload() {
    // 这里可以添加图片上传的逻辑
    showNotification('图片上传功能正在开发中');
}

// 显示通知
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 保存历史消息到Supabase
async function saveHistoryMessages() {
    if (!supabase || !currentUser || !currentConversationId) return;
    
    try {
        // 首先，删除该对话的所有现有消息
        await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', currentConversationId);
        
        // 然后，批量插入所有消息
        if (messages.length > 0) {
            const messageObjects = messages.map(msg => ({
                conversation_id: currentConversationId,
                user_id: currentUser.id,
                content: msg.text,
                sender: msg.sender,
                created_at: msg.timestamp
            }));
            
            const { error } = await supabase
                .from('messages')
                .insert(messageObjects);
            
            if (error) {
                throw error;
            }
        }
        
        console.log('消息已保存到Supabase');
    } catch (error) {
        console.error('保存消息到Supabase失败:', error);
        showNotification('保存消息失败', 'error');
    }
}

// 从Supabase加载历史消息
async function loadHistoryMessages() {
    if (!supabase || !currentUser || !currentConversationId) return;
    
    try {
        // 从Supabase加载消息
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentConversationId)
            .order('created_at', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        // 清空当前消息数组和聊天界面
        messages = [];
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // 如果没有消息，添加欢迎消息
        if (data.length === 0) {
            addMessage('你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？', 'ai');
        } else {
            // 添加加载的消息
            data.forEach(msg => {
                addMessage(msg.content, msg.sender);
                
                // 同步到消息数组
                messages.push({
                    text: msg.content,
                    sender: msg.sender,
                    timestamp: msg.created_at
                });
            });
        }
        
        console.log('已加载', data.length, '条历史消息');
    } catch (error) {
        console.error('加载历史消息失败:', error);
        showNotification('加载历史消息失败', 'error');
        
        // 添加欢迎消息作为备选
        messages = [];
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        addMessage('你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？', 'ai');
    }
}

// 格式化消息（处理换行、链接等）
function formatMessage(text) {
    // 替换换行符为<br>
    text = text.replace(/\n/g, '<br>');
    
    // 处理链接
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return text;
}

// 复制消息到剪贴板
function copyMessage(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('消息已复制到剪贴板');
        })
        .catch(err => {
            showNotification('复制失败，请手动复制', 'error');
            console.error('复制失败:', err);
        });
}

// 分享消息
function shareMessage(text) {
    if (navigator.share) {
        navigator.share({
            title: 'AI聊天消息',
            text: text
        })
        .catch(err => {
            console.error('分享失败:', err);
        });
    } else {
        // 降级方案：复制到剪贴板
        copyMessage(text);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);

// 键盘快捷键
window.addEventListener('keydown', function(e) {
    // Ctrl+Enter 发送消息
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendMessage();
    }
    
    // Esc 清空输入框
    if (e.key === 'Escape') {
        document.getElementById('user-input').value = '';
    }
});

// 添加右键菜单（可选功能）
document.addEventListener('contextmenu', function(e) {
    const messageContent = e.target.closest('.message-content');
    if (messageContent) {
        e.preventDefault();
        
        // 这里可以添加右键菜单的逻辑
        console.log('右键点击了消息内容');
    }
});

// 添加消息内容的点击事件（可选功能）
document.addEventListener('click', function(e) {
    const messageContent = e.target.closest('.message-content');
    if (messageContent) {
        // 这里可以添加消息点击事件的逻辑
        console.log('点击了消息内容');
    }
});

// 添加消息内容的双击事件（可选功能）
document.addEventListener('dblclick', function(e) {
    const messageContent = e.target.closest('.message-content');
    if (messageContent) {
        // 双击复制消息
        const text = messageContent.textContent;
        copyMessage(text);
    }
});