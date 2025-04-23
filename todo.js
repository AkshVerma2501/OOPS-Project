// Base class for Todo items
class TodoItem {
    constructor(text, id) {
        this.id = id;
        this.text = text;
        this.completed = false;
        this.priority = false;
        this.createdAt = new Date();
    }

    toggleComplete() {
        this.completed = !this.completed;
    }

    togglePriority() {
        this.priority = !this.priority;
    }

    updateText(newText) {
        this.text = newText;
    }
}

// TodoListManager class to handle the list operations
class TodoListManager {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.nextId = 1;
        this.searchQuery = '';
    }

    addTodo(text) {
        const todo = new TodoItem(text, this.nextId++);
        this.todos.push(todo);
        return todo;
    }

    removeTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
    }

    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.toggleComplete();
        }
    }

    togglePriority(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.togglePriority();
        }
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase();
    }

    getFilteredTodos() {
        let filtered = this.todos;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                return filtered.filter(todo => !todo.completed);
            case 'completed':
                return filtered.filter(todo => todo.completed);
            case 'priority':
                return filtered.filter(todo => todo.priority);
            default:
                return filtered;
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
    }

    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        return { total, completed };
    }
}

// UI Manager class to handle DOM operations
class UIManager {
    constructor(todoManager) {
        this.todoManager = todoManager;
        this.todoInput = document.getElementById('todoInput');
        this.addButton = document.getElementById('addTodo');
        this.todoList = document.getElementById('todoList');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.searchInput = document.getElementById('searchInput');
        this.themeSwitch = document.querySelector('.theme-switch');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');

        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        this.addButton.addEventListener('click', () => this.handleAddTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTodo();
        });

        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => this.handleFilterChange(button));
        });

        this.searchInput.addEventListener('input', () => {
            this.todoManager.setSearchQuery(this.searchInput.value);
            this.render();
        });

        this.themeSwitch.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.themeSwitch.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    handleAddTodo() {
        const text = this.todoInput.value.trim();
        if (text) {
            this.todoManager.addTodo(text);
            this.todoInput.value = '';
            this.render();
            this.createConfetti();
        }
    }

    handleFilterChange(button) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.todoManager.setFilter(button.dataset.filter);
        this.render();
    }

    createConfetti() {
        const confettiContainer = document.querySelector('.confetti-container');
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confettiContainer.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority ? 'priority' : ''}`;
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            this.todoManager.toggleTodo(todo.id);
            this.render();
        });

        const priorityBtn = document.createElement('button');
        priorityBtn.className = `priority-btn ${todo.priority ? 'active' : ''}`;
        priorityBtn.innerHTML = '<i class="fas fa-star"></i>';
        priorityBtn.addEventListener('click', () => {
            this.todoManager.togglePriority(todo.id);
            this.render();
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', () => {
            li.classList.add('fade-out');
            setTimeout(() => {
                this.todoManager.removeTodo(todo.id);
                this.render();
            }, 300);
        });

        li.appendChild(checkbox);
        li.appendChild(priorityBtn);
        li.appendChild(span);
        li.appendChild(deleteButton);

        return li;
    }

    updateStats() {
        const stats = this.todoManager.getStats();
        this.totalTasks.textContent = `${stats.total} tasks`;
        this.completedTasks.textContent = `${stats.completed} completed`;
    }

    render() {
        this.todoList.innerHTML = '';
        const filteredTodos = this.todoManager.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.emptyState.style.display = 'block';
        } else {
            this.emptyState.style.display = 'none';
            filteredTodos.forEach(todo => {
                const todoElement = this.createTodoElement(todo);
                this.todoList.appendChild(todoElement);
            });
        }

        this.updateStats();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const todoManager = new TodoListManager();
    const uiManager = new UIManager(todoManager);
}); 