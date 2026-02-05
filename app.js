// ===== Data Store =====
const STORAGE_KEY = 'openclaw-mission-control';

// 預設任務資料
const defaultTasks = [
    {
        id: 'task-1',
        title: 'LINE Bot 公開模式設定',
        description: '設定 dmPolicy="open" 允許任何人聊天',
        priority: 'high',
        status: 'done',
        tags: ['LINE', 'Bot'],
        createdAt: '2026-02-03T06:00:00Z',
        updatedAt: '2026-02-03T09:00:00Z'
    },
    {
        id: 'task-2',
        title: '長期記憶功能設定',
        description: '啟用本地 embedding + 混合檢索 + 向量加速',
        priority: 'high',
        status: 'done',
        tags: ['Memory', 'Feature'],
        createdAt: '2026-02-05T06:00:00Z',
        updatedAt: '2026-02-05T06:30:00Z'
    },
    {
        id: 'task-3',
        title: 'Gateway Token 設定',
        description: '設定 gateway.auth.token 允許遠端訪問 Dashboard',
        priority: 'medium',
        status: 'done',
        tags: ['Gateway', 'Security'],
        createdAt: '2026-02-03T01:40:00Z',
        updatedAt: '2026-02-03T01:45:00Z'
    },
    {
        id: 'task-4',
        title: 'Telegram Bot 連線修復',
        description: '修復 Telegram Bot 網路錯誤，重啟 Gateway',
        priority: 'medium',
        status: 'done',
        tags: ['Telegram', 'Bug'],
        createdAt: '2026-02-03T00:30:00Z',
        updatedAt: '2026-02-03T00:45:00Z'
    },
    {
        id: 'task-5',
        title: 'Mission Control Dashboard',
        description: '建立任務追蹤看板工具並部署到 GitHub',
        priority: 'high',
        status: 'in-progress',
        tags: ['Dashboard', 'Feature'],
        createdAt: '2026-02-05T09:30:00Z',
        updatedAt: '2026-02-05T09:30:00Z'
    },
    {
        id: 'task-6',
        title: 'sena LINE 聊天問題',
        description: '調查為什麼 sena 仍收到配對訊息',
        priority: 'medium',
        status: 'on-hold',
        tags: ['LINE', 'Bug'],
        createdAt: '2026-02-03T01:00:00Z',
        updatedAt: '2026-02-03T01:30:00Z'
    },
    {
        id: 'task-7',
        title: 'iMessage 權限問題',
        description: '修復 iMessage chat.db 權限被拒絕的問題',
        priority: 'low',
        status: 'todo',
        tags: ['iMessage', 'Bug'],
        createdAt: '2026-02-03T01:43:00Z',
        updatedAt: '2026-02-03T01:43:00Z'
    },
    {
        id: 'task-8',
        title: '撰寫長期記憶使用說明',
        description: '生成中文使用說明文件',
        priority: 'medium',
        status: 'done',
        tags: ['Documentation'],
        createdAt: '2026-02-05T09:00:00Z',
        updatedAt: '2026-02-05T09:15:00Z'
    }
];

// ===== State =====
let tasks = [];
let editingTaskId = null;
let draggedTask = null;

// ===== DOM Elements =====
const taskModal = document.getElementById('taskModal');
const detailModal = document.getElementById('detailModal');
const taskForm = document.getElementById('taskForm');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModal = document.getElementById('closeModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const cancelBtn = document.getElementById('cancelBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const editTaskBtn = document.getElementById('editTaskBtn');

// ===== Initialize =====
function init() {
    loadTasks();
    renderAllTasks();
    setupEventListeners();
    updateLastUpdated();
}

// ===== Storage =====
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse tasks:', e);
            tasks = [...defaultTasks];
        }
    } else {
        tasks = [...defaultTasks];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateLastUpdated();
}

// ===== Render =====
function renderAllTasks() {
    const columns = ['todo', 'in-progress', 'done', 'on-hold'];
    
    columns.forEach(status => {
        const list = document.getElementById(`${status}-list`);
        const count = document.getElementById(`${status}-count`);
        const columnTasks = tasks.filter(t => t.status === status);
        
        count.textContent = columnTasks.length;
        
        if (columnTasks.length === 0) {
            list.innerHTML = '<div class="empty-state">沒有任務</div>';
        } else {
            list.innerHTML = columnTasks.map(renderTaskCard).join('');
        }
    });
    
    setupDragAndDrop();
}

function renderTaskCard(task) {
    const tagsHtml = task.tags && task.tags.length > 0
        ? `<div class="task-tags">${task.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
        : '';
    
    const createdDate = new Date(task.createdAt).toLocaleDateString('zh-TW');
    
    return `
        <div class="task-card" draggable="true" data-id="${task.id}">
            <div class="task-card-header">
                <div class="priority-indicator priority-${task.priority}"></div>
                <div class="task-title">${escapeHtml(task.title)}</div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            ${tagsHtml}
            <div class="task-meta">
                <span>${createdDate}</span>
                <span>${getPriorityLabel(task.priority)}</span>
            </div>
        </div>
    `;
}

function getPriorityLabel(priority) {
    const labels = {
        low: '🟢 低',
        medium: '🟡 中',
        high: '🔴 高'
    };
    return labels[priority] || '🟡 中';
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Add task
    addTaskBtn.addEventListener('click', () => openTaskModal());
    
    // Close modals
    closeModal.addEventListener('click', () => closeTaskModal());
    closeDetailModal.addEventListener('click', () => closeDetailModalFn());
    cancelBtn.addEventListener('click', () => closeTaskModal());
    
    // Form submit
    taskForm.addEventListener('submit', handleFormSubmit);
    
    // Export/Import
    exportBtn.addEventListener('click', exportTasks);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTasks);
    
    // Delete/Edit from detail modal
    deleteTaskBtn.addEventListener('click', handleDeleteTask);
    editTaskBtn.addEventListener('click', handleEditFromDetail);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
        if (e.target === detailModal) closeDetailModalFn();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeDetailModalFn();
        }
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey && 
            document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            openTaskModal();
        }
    });
}

// ===== Drag and Drop =====
function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const taskLists = document.querySelectorAll('.task-list');
    
    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('click', handleCardClick);
    });
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('dragenter', handleDragEnter);
        list.addEventListener('dragleave', handleDragLeave);
        list.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
    draggedTask = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const taskList = e.target.closest('.task-list');
    if (taskList && !taskList.contains(e.relatedTarget)) {
        taskList.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (!taskList || !draggedTask) return;
    
    const column = taskList.closest('.column');
    const newStatus = column.dataset.status;
    const taskId = draggedTask.dataset.id;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        saveTasks();
        renderAllTasks();
    }
    
    taskList.classList.remove('drag-over');
}

// ===== Card Click =====
function handleCardClick(e) {
    if (e.target.classList.contains('dragging')) return;
    
    const card = e.target.closest('.task-card');
    if (!card) return;
    
    const taskId = card.dataset.id;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        showDetailModal(task);
    }
}

// ===== Modal Functions =====
function openTaskModal(task = null) {
    editingTaskId = task ? task.id : null;
    document.getElementById('modalTitle').textContent = task ? '編輯任務' : '新增任務';
    
    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskDescription').value = task ? task.description : '';
    document.getElementById('taskPriority').value = task ? task.priority : 'medium';
    document.getElementById('taskStatus').value = task ? task.status : 'todo';
    document.getElementById('taskTags').value = task && task.tags ? task.tags.join(', ') : '';
    
    taskModal.classList.add('active');
    document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
    taskModal.classList.remove('active');
    editingTaskId = null;
    taskForm.reset();
}

function showDetailModal(task) {
    document.getElementById('detailTitle').textContent = task.title;
    
    const content = `
        <div class="detail-row">
            <div class="detail-label">描述</div>
            <div class="detail-value">${task.description || '無描述'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">優先級</div>
            <div class="detail-value">${getPriorityLabel(task.priority)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">狀態</div>
            <div class="detail-value">${getStatusLabel(task.status)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">標籤</div>
            <div class="detail-value">${task.tags && task.tags.length > 0 ? task.tags.join(', ') : '無標籤'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">建立時間</div>
            <div class="detail-value">${formatDate(task.createdAt)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">更新時間</div>
            <div class="detail-value">${formatDate(task.updatedAt)}</div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = content;
    detailModal.dataset.taskId = task.id;
    detailModal.classList.add('active');
}

function closeDetailModalFn() {
    detailModal.classList.remove('active');
}

function getStatusLabel(status) {
    const labels = {
        'todo': '📋 待辦事項',
        'in-progress': '🔄 進行中',
        'done': '✅ 已完成',
        'on-hold': '⏸️ 擱置'
    };
    return labels[status] || status;
}

// ===== Form Handling =====
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const tagsInput = document.getElementById('taskTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const now = new Date().toISOString();
    
    if (editingTaskId) {
        // Update existing task
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.status = status;
            task.tags = tags;
            task.updatedAt = now;
        }
    } else {
        // Create new task
        const newTask = {
            id: `task-${Date.now()}`,
            title,
            description,
            priority,
            status,
            tags,
            createdAt: now,
            updatedAt: now
        };
        tasks.push(newTask);
    }
    
    saveTasks();
    renderAllTasks();
    closeTaskModal();
}

// ===== Delete/Edit =====
function handleDeleteTask() {
    const taskId = detailModal.dataset.taskId;
    if (!taskId) return;
    
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderAllTasks();
        closeDetailModalFn();
    }
}

function handleEditFromDetail() {
    const taskId = detailModal.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        closeDetailModalFn();
        openTaskModal(task);
    }
}

// ===== Export/Import =====
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`匯入 ${imported.length} 個任務？這會覆蓋現有資料。`)) {
                    tasks = imported;
                    saveTasks();
                    renderAllTasks();
                }
            } else {
                alert('無效的檔案格式');
            }
        } catch (err) {
            alert('無法解析檔案：' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== Utilities =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(isoString) {
    if (!isoString) return '未知';
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (el) {
        el.textContent = `最後更新：${formatDate(new Date().toISOString())}`;
    }
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
