import UserApi from './UserApi.js';
import TaskList from './TaskList.js';
import UserCard from './UserCard.js';

export default class TodoPage {

    constructor() {
    this.taskList = new TaskList('tasks');
    this.userCard = new UserCard('user-info');
    }

    async init() {

        this.currentEditId = null;

        await this.renderUser();

        this.setupForm();
        this.setupSearch();

        document
            .querySelector('#category-filter')
            .addEventListener('change', () => this.renderTasks());

        document
            .querySelector('#priority-filter')
            .addEventListener('change', () => this.renderTasks());
        
        document
            .querySelector('#status-filter')
            .addEventListener('change', () => this.renderTasks());

        document
            .querySelector('#view-filter')
            .addEventListener('change', () => this.renderTasks());

        this.renderTasks();

    }
    async renderUser() {
    const user = await UserApi.getUser();
    this.userCard.render(user);
}
setupForm() {

    const form = document.querySelector('#task-form');

    form.addEventListener('submit', (event) => {

        event.preventDefault();

        const task = {
            id: Date.now(),
            title: document.querySelector('#title').value,
            description: document.querySelector('#description').value,
            priority: document.querySelector('input[name="priority"]:checked')?.value || '',
            category: document.querySelector('#category').value,
            deadline: document.querySelector('#deadline').value,
            completed: false
        };

        const tasks = JSON.parse(
            localStorage.getItem('tasks') || '[]'
        );

        tasks.push(task);

        localStorage.setItem(
            'tasks',
            JSON.stringify(tasks)
        );

        form.reset();

        this.renderTasks();

    });

}
renderTasks() {

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const searchValue = document.querySelector('#search').value.toLowerCase();
    const categoryFilter = document.querySelector('#category-filter').value;
    const priorityFilter = document.querySelector('#priority-filter').value;
    const statusFilter = document.querySelector('#status-filter').value;
    const viewFilter = document.querySelector('#view-filter').value;

    const filteredTasks = tasks.filter(task => {

        if (
            categoryFilter !== 'all' &&
            task.category !== categoryFilter
        ) {
            return false;
        }

        if (
            priorityFilter !== 'all' &&
            task.priority !== priorityFilter
        ) {
            return false;
        }
        if (statusFilter === 'active' && task.completed) {
            return false;
        }

        if (statusFilter === 'completed' && !task.completed) {
            return false;
        }

        if (statusFilter === 'overdue') {

            const overdue =
                new Date(task.deadline) < new Date() &&
               !task.completed;

            if (!overdue) {
                return false;
            }
        }
        

        return (
            task.title.toLowerCase().includes(searchValue) ||
            task.description.toLowerCase().includes(searchValue) ||
            task.category.toLowerCase().includes(searchValue)
        );

    });

    const sortedTasks = filteredTasks.sort((a, b) => {

        if (a.completed === b.completed) {
            return 0;
        }

        return a.completed ? 1 : -1;

    });

    if (viewFilter === 'nearest') {

        sortedTasks.sort(
            (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );

    }

    if (viewFilter === 'latest') {

        sortedTasks.sort(
            (a, b) => new Date(b.deadline) - new Date(a.deadline)
        );

    }

    if (viewFilter === 'completed') {

        sortedTasks.sort(
            (a, b) => Number(b.completed) - Number(a.completed)
        );

    }

    if (viewFilter === 'overdue') {

        const now = new Date();

        sortedTasks.sort((a, b) => {

            const aOverdue = new Date(a.deadline) < now && !a.completed;
            const bOverdue = new Date(b.deadline) < now && !b.completed;

            return Number(bOverdue) - Number(aOverdue);

        });

    }this.taskList.render(
    sortedTasks
    .map(task => {

        const now = new Date();
        const deadline = new Date(task.deadline);
        const diffHours = (deadline - now) / (1000 * 60 * 60);

        let deadlineClass = 'deadline-normal';
        let deadlineText = '';

        if (task.completed) {

            deadlineText = 'Завершено';

        } else if (diffHours < 0) {

            deadlineClass = 'deadline-overdue';

            const overdueHours = Math.abs(Math.floor(diffHours));

            if (overdueHours >= 24) {
                deadlineText = `Просрочено на ${Math.floor(overdueHours / 24)} дн`;
            } else {
                deadlineText = `Просрочено на ${overdueHours} ч`;
            }

        } else if (diffHours < 24) {

            deadlineClass = 'deadline-soon';
            deadlineText = `До дедлайна: ${Math.floor(diffHours)} ч`;

        } else {

            deadlineText = `До дедлайна: ${Math.floor(diffHours / 24)} дн`;

        }

        return `
            <div class="task-card ${task.category} ${task.completed ? 'completed' : ''}">

                <h3>${task.title}</h3>

                <p class="task-description">${task.description}</p>

                <p>
                    <span class="category-badge ${task.category}">
                        ${task.category}
                    </span>
                </p>

                <p>
                    <span class="priority-badge ${task.priority}">
                        ${task.priority}
                    </span>
                </p>

                <p class="task-deadline">
                    📅 ${new Date(task.deadline).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>

                <div class="task-actions">

                    <p class="deadline-status ${deadlineClass}">
                        ${deadlineText}
                    </p>

                    <button
                        class="complete-btn icon-btn"
                        data-id="${task.id}"
                        title="Выполнить"
                    >
                        ✓
                    </button>

                    <button
                        class="edit-btn icon-btn"
                        data-id="${task.id}"
                        title="Редактировать"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete-btn icon-btn"
                        data-id="${task.id}"
                        title="Удалить"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;

    })
    .join('')
    )

this.setupDeleteButtons();
this.updateStats(tasks);
this.setupEditButtons();
this.setupCompleteButtons();

}updateStats(tasks) {

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(task =>
        !task.completed &&
        new Date(task.deadline) < new Date()
    ).length;

    document.querySelector('#total-count').textContent = total;
    document.querySelector('#active-count').textContent = active;
    document.querySelector('#completed-count').textContent = completed;
    document.querySelector('#overdue-count').textContent = overdue;

}setupDeleteButtons() {

    const buttons = document.querySelectorAll('.delete-btn');

    buttons.forEach(button => {

        button.addEventListener('click', () => {

            const id = Number(button.dataset.id);

            let tasks = JSON.parse(
                localStorage.getItem('tasks') || '[]'
            );

            tasks = tasks.filter(
                task => task.id !== id
            );

            localStorage.setItem(
                'tasks',
                JSON.stringify(tasks)
            );

            this.renderTasks();

        });

    });

}
setupEditButtons() {

    const buttons = document.querySelectorAll('.edit-btn');

    buttons.forEach(button => {

        button.addEventListener('click', () => {

            const id = Number(button.dataset.id);

            const tasks = JSON.parse(
                localStorage.getItem('tasks') || '[]'
            );

            const task = tasks.find(
                task => task.id === id
            );

            this.currentEditId = id;

            document.querySelector('#edit-title').value = task.title;
            document.querySelector('#edit-description').value = task.description;
            document.querySelector('#edit-category').value = task.category;
            document.querySelector('#edit-priority').value = task.priority;
            document.querySelector('#edit-deadline').value = task.deadline;

            document.querySelector('#edit-modal').style.display = 'flex';

        });

    });

    this.setupModalButtons();

}
setupModalButtons() {

    const saveBtn = document.querySelector('#save-edit');
    const closeBtn = document.querySelector('#close-edit');

    if (!saveBtn || !closeBtn) return;

    closeBtn.onclick = () => {
        document.querySelector('#edit-modal').style.display = 'none';
    };

    saveBtn.onclick = () => {

        const tasks = JSON.parse(
            localStorage.getItem('tasks') || '[]'
        );

        const task = tasks.find(
            task => task.id === this.currentEditId
        );

        task.title = document.querySelector('#edit-title').value;
        task.description = document.querySelector('#edit-description').value;
        task.category = document.querySelector('#edit-category').value;
        task.priority = document.querySelector('#edit-priority').value;
        task.deadline = document.querySelector('#edit-deadline').value;

        localStorage.setItem(
            'tasks',
            JSON.stringify(tasks)
        );

        document.querySelector('#edit-modal').style.display = 'none';

        this.renderTasks();

    };

}
setupCompleteButtons() {

    const buttons = document.querySelectorAll('.complete-btn');

    buttons.forEach(button => {

        button.addEventListener('click', () => {

            const id = Number(button.dataset.id);

            const tasks = JSON.parse(
                localStorage.getItem('tasks') || '[]'
            );

            const task = tasks.find(
                task => task.id === id
            );

            task.completed = !task.completed;

            localStorage.setItem(
                'tasks',
                JSON.stringify(tasks)
            );

            this.renderTasks();

        });

    });

}

setupSearch() {

    const searchInput = document.querySelector('#search');

    searchInput.addEventListener(
        'input',
        () => this.renderTasks()
    );

}

}