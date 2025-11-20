// ===================================
// Task Manager Application
// ===================================

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    // ===================================
    // Initialization
    // ===================================
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    }

    cacheDOM() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        
        // Lists and containers
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        
        // Filter buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Action buttons
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        
        // Modal elements
        this.modal = document.getElementById('editModal');
        this.editInput = document.getElementById('editInput');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelEditBtn = document.getElementById('cancelEdit');
        this.saveEditBtn = document.getElementById('saveEdit');
    }

    bindEvents() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
        
        // Action buttons
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        
        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
        
        // Save edit on Enter key
        this.editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEdit();
            }
        });
    }

    // ===================================
    // Task Management
    // ===================================
    handleAddTask(e) {
        e.preventDefault();
        
        const taskText = this.sanitizeInput(this.taskInput.value.trim());
        
        if (!taskText) {
            this.showNotification('الرجاء إدخال نص المهمة', 'error');
            return;
        }
        
        if (taskText.length > 200) {
            this.showNotification('النص طويل جداً (الحد الأقصى 200 حرف)', 'error');
            return;
        }
        
        const task = {
            id: this.generateId(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.taskInput.value = '';
        this.taskInput.focus();
        
        this.showNotification('تمت إضافة المهمة بنجاح', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.showNotification('تم حذف المهمة', 'info');
        }
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            this.editInput.value = task.text;
            this.modal.classList.add('show');
            this.editInput.focus();
            this.editInput.select();
        }
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.editingTaskId = null;
        this.editInput.value = '';
    }

    saveEdit() {
        const newText = this.sanitizeInput(this.editInput.value.trim());
        
        if (!newText) {
            this.showNotification('الرجاء إدخال نص المهمة', 'error');
            return;
        }
        
        if (newText.length > 200) {
            this.showNotification('النص طويل جداً (الحد الأقصى 200 حرف)', 'error');
            return;
        }
        
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.render();
            this.closeModal();
            this.showNotification('تم تحديث المهمة', 'success');
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('لا توجد مهام مكتملة لحذفها', 'info');
            return;
        }
        
        if (confirm(`هل تريد حذف ${completedCount} مهمة مكتملة؟`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.showNotification('تم حذف المهام المكتملة', 'success');
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showNotification('لا توجد مهام لحذفها', 'info');
            return;
        }
        
        if (confirm('هل أنت متأكد من حذف جميع المهام؟ لا يمكن التراجع عن هذا الإجراء.')) {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.showNotification('تم حذف جميع المهام', 'info');
        }
    }

    // ===================================
    // Filtering
    // ===================================
    handleFilter(e) {
        const filter = e.currentTarget.dataset.filter;
        this.currentFilter = filter;
        
        // Update active button
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    // ===================================
    // Rendering
    // ===================================
    render() {
        this.renderTasks();
        this.updateStats();
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        
        this.tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="taskManager.toggleTask('${task.id}')"
                    aria-label="تحديد المهمة كمكتملة"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button 
                        class="task-btn edit-btn" 
                        onclick="taskManager.openEditModal('${task.id}')"
                        aria-label="تعديل المهمة"
                        title="تعديل"
                    >
                        ✏️
                    </button>
                    <button 
                        class="task-btn delete-btn" 
                        onclick="taskManager.deleteTask('${task.id}')"
                        aria-label="حذف المهمة"
                        title="حذف"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        this.totalTasksEl.textContent = total;
        this.activeTasksEl.textContent = active;
        this.completedTasksEl.textContent = completed;
    }

    // ===================================
    // Local Storage
    // ===================================
    loadTasks() {
        try {
            const tasksJSON = localStorage.getItem('tasks');
            return tasksJSON ? JSON.parse(tasksJSON) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('حدث خطأ في حفظ المهام', 'error');
        }
    }

    // ===================================
    // Utility Functions
    // ===================================
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitizeInput(input) {
        // Remove any HTML tags and trim whitespace
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML.trim();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Simple console notification (can be enhanced with toast notifications)
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // You can add a toast notification library here for better UX
        // For now, we'll use the browser's built-in notification
        if (type === 'error') {
            console.error(message);
        }
    }
}

// ===================================
// Initialize Application
// ===================================
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Add some demo tasks on first load (optional)
    if (taskManager.tasks.length === 0) {
        const demoTasks = [
            { id: taskManager.generateId(), text: 'مرحباً بك في تطبيق إدارة المهام! 👋', completed: false, createdAt: new Date().toISOString() },
            { id: taskManager.generateId(), text: 'جرّب إضافة مهمة جديدة', completed: false, createdAt: new Date().toISOString() },
            { id: taskManager.generateId(), text: 'يمكنك تعديل أو حذف المهام بسهولة', completed: false, createdAt: new Date().toISOString() }
        ];
        
        // Uncomment the following lines to add demo tasks
        // taskManager.tasks = demoTasks;
        // taskManager.saveTasks();
        // taskManager.render();
    }
});

// ===================================
// Service Worker Registration (Optional - for PWA)
// ===================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}
