// Sistema de Gestão de Tarefas - JavaScript Principal

class TaskManager {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.projects = [];
        this.users = [
            { username: 'admin', password: 'admin123', displayName: 'Administrador', email: 'admin@sistema.com', role: 'admin' },
            { username: 'user', password: 'user123', displayName: 'Usuário Padrão', email: 'user@sistema.com', role: 'user' }
        ];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.generateSampleData();
    }

    // Autenticação
    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showDashboard();
            this.showNotification('Login realizado com sucesso!', 'success');
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        this.showNotification('Logout realizado com sucesso!', 'info');
    }

    // Navegação entre telas
    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('dashboardScreen').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
        document.getElementById('currentUser').textContent = this.currentUser.displayName;
        this.updateDashboard();
    }

    // Gerenciamento de dados
    loadData() {
        const savedTasks = localStorage.getItem('tasks');
        const savedProjects = localStorage.getItem('projects');
        
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
        }
    }

    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    // Geração de dados de exemplo
    generateSampleData() {
        if (this.tasks.length === 0) {
            this.tasks = [
                {
                    id: this.generateId(),
                    title: 'Implementar sistema de login',
                    description: 'Criar tela de login com validação de usuário e senha',
                    status: 'completed',
                    priority: 'high',
                    dueDate: '2024-01-15',
                    project: 'sistema-web',
                    createdAt: new Date('2024-01-10').toISOString(),
                    completedAt: new Date('2024-01-14').toISOString()
                },
                {
                    id: this.generateId(),
                    title: 'Criar dashboard principal',
                    description: 'Desenvolver interface principal com métricas e gráficos',
                    status: 'in-progress',
                    priority: 'high',
                    dueDate: '2024-01-20',
                    project: 'sistema-web',
                    createdAt: new Date('2024-01-12').toISOString()
                },
                {
                    id: this.generateId(),
                    title: 'Implementar CRUD de tarefas',
                    description: 'Criar, editar, excluir e listar tarefas',
                    status: 'pending',
                    priority: 'medium',
                    dueDate: '2024-01-25',
                    project: 'sistema-web',
                    createdAt: new Date('2024-01-13').toISOString()
                },
                {
                    id: this.generateId(),
                    title: 'Configurar analytics',
                    description: 'Implementar gráficos e relatórios de produtividade',
                    status: 'pending',
                    priority: 'medium',
                    dueDate: '2024-01-30',
                    project: 'sistema-web',
                    createdAt: new Date('2024-01-14').toISOString()
                },
                {
                    id: this.generateId(),
                    title: 'Testes de integração',
                    description: 'Executar testes completos do sistema',
                    status: 'pending',
                    priority: 'low',
                    dueDate: '2024-02-05',
                    project: 'sistema-web',
                    createdAt: new Date('2024-01-15').toISOString()
                }
            ];
        }

        if (this.projects.length === 0) {
            this.projects = [
                {
                    id: 'sistema-web',
                    name: 'Sistema Web de Gestão',
                    description: 'Desenvolvimento de sistema completo para gestão de tarefas e projetos',
                    startDate: '2024-01-01',
                    endDate: '2024-03-01',
                    color: '#667eea',
                    createdAt: new Date('2024-01-01').toISOString()
                },
                {
                    id: 'mobile-app',
                    name: 'Aplicativo Mobile',
                    description: 'Versão mobile do sistema de gestão',
                    startDate: '2024-02-01',
                    endDate: '2024-04-01',
                    color: '#764ba2',
                    createdAt: new Date('2024-01-15').toISOString()
                },
                {
                    id: 'api-integration',
                    name: 'Integração com APIs',
                    description: 'Integração com sistemas externos via API',
                    startDate: '2024-01-15',
                    endDate: '2024-02-15',
                    color: '#28a745',
                    createdAt: new Date('2024-01-10').toISOString()
                }
            ];
        }

        this.saveData();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Gerenciamento de tarefas
    addTask(taskData) {
        const task = {
            id: this.generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        
        if (task.status === 'completed') {
            task.completedAt = new Date().toISOString();
        }
        
        this.tasks.push(task);
        this.saveData();
        this.updateDashboard();
        this.showNotification('Tarefa criada com sucesso!', 'success');
    }

    updateTask(id, taskData) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldStatus = this.tasks[index].status;
            this.tasks[index] = { ...this.tasks[index], ...taskData };
            
            // Marcar data de conclusão se mudou para completed
            if (oldStatus !== 'completed' && taskData.status === 'completed') {
                this.tasks[index].completedAt = new Date().toISOString();
            } else if (taskData.status !== 'completed') {
                delete this.tasks[index].completedAt;
            }
            
            this.saveData();
            this.updateDashboard();
            this.showNotification('Tarefa atualizada com sucesso!', 'success');
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveData();
        this.updateDashboard();
        this.showNotification('Tarefa excluída com sucesso!', 'info');
    }

    // Gerenciamento de projetos
    addProject(projectData) {
        const project = {
            id: this.generateId(),
            ...projectData,
            createdAt: new Date().toISOString()
        };
        
        this.projects.push(project);
        this.saveData();
        this.updateDashboard();
        this.showNotification('Projeto criado com sucesso!', 'success');
    }

    updateProject(id, projectData) {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...projectData };
            this.saveData();
            this.updateDashboard();
            this.showNotification('Projeto atualizado com sucesso!', 'success');
        }
    }

    deleteProject(id) {
        this.projects = this.projects.filter(p => p.id !== id);
        // Remover referências do projeto das tarefas
        this.tasks.forEach(task => {
            if (task.project === id) {
                task.project = '';
            }
        });
        this.saveData();
        this.updateDashboard();
        this.showNotification('Projeto excluído com sucesso!', 'info');
    }

    // Atualização do dashboard
    updateDashboard() {
        this.updateStats();
        this.updateRecentTasks();
        this.updateProjectProgress();
        this.renderTasks();
        this.renderProjects();
        this.updateCharts();
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        const totalProjects = this.projects.length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('totalProjects').textContent = totalProjects;
    }

    updateRecentTasks() {
        const recentTasks = this.tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const container = document.getElementById('recentTasks');
        container.innerHTML = '';

        if (recentTasks.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Nenhuma tarefa encontrada</p>';
            return;
        }

        recentTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'recent-task';
            taskElement.innerHTML = `
                <div class="recent-task-info">
                    <div class="recent-task-title">${task.title}</div>
                    <div class="recent-task-meta">${this.formatDate(task.createdAt)}</div>
                </div>
                <span class="recent-task-status status-${task.status}">${this.getStatusText(task.status)}</span>
            `;
            container.appendChild(taskElement);
        });
    }

    updateProjectProgress() {
        const container = document.getElementById('projectProgress');
        container.innerHTML = '';

        if (this.projects.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Nenhum projeto encontrado</p>';
            return;
        }

        this.projects.forEach(project => {
            const projectTasks = this.tasks.filter(t => t.project === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
            const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

            const projectElement = document.createElement('div');
            projectElement.className = 'project-progress-item';
            projectElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 500;">${project.name}</span>
                    <span style="font-size: 0.9rem; color: #666;">${Math.round(progress)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background: ${project.color};"></div>
                </div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                    ${completedTasks}/${projectTasks.length} tarefas concluídas
                </div>
            `;
            container.appendChild(projectElement);
        });
    }

    // Renderização de tarefas
    renderTasks() {
        const container = document.getElementById('tasksList');
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
        const searchTerm = document.getElementById('searchTasks')?.value.toLowerCase() || '';

        let filteredTasks = this.tasks;

        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
        }

        if (searchTerm) {
            filteredTasks = filteredTasks.filter(t => 
                t.title.toLowerCase().includes(searchTerm) || 
                t.description.toLowerCase().includes(searchTerm)
            );
        }

        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhuma tarefa encontrada</p>';
            return;
        }

        filteredTasks.forEach(task => {
            const project = this.projects.find(p => p.id === task.project);
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.status} ${task.priority}-priority`;
            taskElement.innerHTML = `
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-flag"></i> ${this.getPriorityText(task.priority)}</span>
                            <span><i class="fas fa-calendar"></i> ${task.dueDate ? this.formatDate(task.dueDate) : 'Sem prazo'}</span>
                            ${project ? `<span><i class="fas fa-folder"></i> ${project.name}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="taskManager.editTask('${task.id}')">Editar</button>
                        <button class="complete-btn" onclick="taskManager.toggleTaskStatus('${task.id}')">
                            ${task.status === 'completed' ? 'Reabrir' : 'Concluir'}
                        </button>
                        <button class="delete-btn" onclick="taskManager.deleteTask('${task.id}')">Excluir</button>
                    </div>
                </div>
                ${task.description ? `<p style="margin-top: 10px; color: #666;">${task.description}</p>` : ''}
            `;
            container.appendChild(taskElement);
        });
    }

    // Renderização de projetos
    renderProjects() {
        const container = document.getElementById('projectsList');
        container.innerHTML = '';

        if (this.projects.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Nenhum projeto encontrado</p>';
            return;
        }

        this.projects.forEach(project => {
            const projectTasks = this.tasks.filter(t => t.project === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
            const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

            const projectElement = document.createElement('div');
            projectElement.className = 'project-card';
            projectElement.innerHTML = `
                <div class="project-header" style="background: ${project.color};">
                    <div class="project-title">${project.name}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${projectTasks.length} tarefas</div>
                </div>
                <div class="project-body">
                    <p style="color: #666; margin-bottom: 15px;">${project.description}</p>
                    <div class="project-progress">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 0.9rem;">Progresso</span>
                            <span style="font-size: 0.9rem; font-weight: 600;">${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background: ${project.color};"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <span style="font-size: 0.8rem; color: #666;">
                            ${project.startDate} - ${project.endDate}
                        </span>
                        <div>
                            <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" onclick="taskManager.editProject('${project.id}')">
                                Editar
                            </button>
                            <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="taskManager.deleteProject('${project.id}')">
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(projectElement);
        });
    }

    // Gráficos e Analytics
    updateCharts() {
        this.updateWeeklyChart();
        this.updateStatusChart();
        this.updatePriorityChart();
        this.updateTimelineChart();
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        // Dados simulados para produtividade semanal
        const weeklyData = this.getWeeklyProductivity();
        
        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        this.weeklyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                datasets: [{
                    label: 'Tarefas Concluídas',
                    data: weeklyData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusCounts = {
            pending: this.tasks.filter(t => t.status === 'pending').length,
            'in-progress': this.tasks.filter(t => t.status === 'in-progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };

        if (this.statusChart) {
            this.statusChart.destroy();
        }

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Em Progresso', 'Concluída'],
                datasets: [{
                    data: [statusCounts.pending, statusCounts['in-progress'], statusCounts.completed],
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updatePriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        const priorityCounts = {
            low: this.tasks.filter(t => t.priority === 'low').length,
            medium: this.tasks.filter(t => t.priority === 'medium').length,
            high: this.tasks.filter(t => t.priority === 'high').length
        };

        if (this.priorityChart) {
            this.priorityChart.destroy();
        }

        this.priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Baixa', 'Média', 'Alta'],
                datasets: [{
                    label: 'Quantidade',
                    data: [priorityCounts.low, priorityCounts.medium, priorityCounts.high],
                    backgroundColor: ['#17a2b8', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        const timelineData = this.getTimelineData();

        if (this.timelineChart) {
            this.timelineChart.destroy();
        }

        this.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Conclusões',
                    data: timelineData.data,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Dados para gráficos
    getWeeklyProductivity() {
        // Simular dados de produtividade semanal
        const completedTasks = this.tasks.filter(t => t.status === 'completed');
        const weekData = [0, 0, 0, 0, 0, 0, 0]; // Dom a Sáb
        
        completedTasks.forEach(task => {
            if (task.completedAt) {
                const date = new Date(task.completedAt);
                const dayOfWeek = date.getDay();
                weekData[dayOfWeek]++;
            }
        });
        
        return weekData;
    }

    getTimelineData() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed' && t.completedAt);
        const last7Days = [];
        const counts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            
            const count = completedTasks.filter(task => {
                const taskDate = new Date(task.completedAt).toISOString().split('T')[0];
                return taskDate === dateStr;
            }).length;
            
            counts.push(count);
        }
        
        return { labels: last7Days, data: counts };
    }

    // Utilitários
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'in-progress': 'Em Progresso',
            'completed': 'Concluída'
        };
        return statusMap[status] || status;
    }

    getPriorityText(priority) {
        const priorityMap = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };
        return priorityMap[priority] || priority;
    }

    // Ações de tarefas
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.openTaskModal(task);
        }
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            this.updateTask(id, { status: newStatus });
        }
    }

    // Ações de projetos
    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            this.openProjectModal(project);
        }
    }

    // Modais
    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');
        
        if (task) {
            title.textContent = 'Editar Tarefa';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskProject').value = task.project || '';
            form.dataset.taskId = task.id;
        } else {
            title.textContent = 'Nova Tarefa';
            form.reset();
            delete form.dataset.taskId;
        }
        
        this.populateProjectSelect();
        modal.classList.add('active');
    }

    openProjectModal(project = null) {
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const title = document.getElementById('projectModalTitle');
        
        if (project) {
            title.textContent = 'Editar Projeto';
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('projectStartDate').value = project.startDate || '';
            document.getElementById('projectEndDate').value = project.endDate || '';
            document.getElementById('projectColor').value = project.color || '#3498db';
            form.dataset.projectId = project.id;
        } else {
            title.textContent = 'Novo Projeto';
            form.reset();
            document.getElementById('projectColor').value = '#3498db';
            delete form.dataset.projectId;
        }
        
        modal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    populateProjectSelect() {
        const select = document.getElementById('taskProject');
        select.innerHTML = '<option value="">Selecione um projeto</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    }

    // Navegação
    showSection(sectionName) {
        // Remover active de todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ativar seção selecionada
        document.getElementById(sectionName + 'Section').classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Atualizar dados se necessário
        if (sectionName === 'analytics') {
            setTimeout(() => this.updateCharts(), 100);
        }
    }

    // Notificações
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Configurações
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
    }

    loadSettings() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkMode').checked = true;
        }
        
        const notifications = localStorage.getItem('notifications') !== 'false';
        document.getElementById('notifications').checked = notifications;
        
        const language = localStorage.getItem('language') || 'pt-BR';
        document.getElementById('language').value = language;
    }

    saveSettings() {
        const darkMode = document.getElementById('darkMode').checked;
        const notifications = document.getElementById('notifications').checked;
        const language = document.getElementById('language').value;
        
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('notifications', notifications);
        localStorage.setItem('language', language);
        
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        this.showNotification('Configurações salvas com sucesso!', 'success');
    }

    // Exportar/Importar dados
    exportData() {
        const data = {
            tasks: this.tasks,
            projects: this.projects,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sistema-gestao-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Dados exportados com sucesso!', 'success');
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks && data.projects) {
                    this.tasks = data.tasks;
                    this.projects = data.projects;
                    this.saveData();
                    this.updateDashboard();
                    this.showNotification('Dados importados com sucesso!', 'success');
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (error) {
                this.showNotification('Erro ao importar dados: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            this.tasks = [];
            this.projects = [];
            this.saveData();
            this.updateDashboard();
            this.showNotification('Todos os dados foram limpos!', 'info');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (this.login(username, password)) {
                document.getElementById('loginForm').reset();
                document.getElementById('loginError').style.display = 'none';
            } else {
                document.getElementById('loginError').textContent = 'Usuário ou senha inválidos';
                document.getElementById('loginError').style.display = 'block';
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const taskData = Object.fromEntries(formData.entries());
            
            const taskId = e.target.dataset.taskId;
            if (taskId) {
                this.updateTask(taskId, taskData);
            } else {
                this.addTask(taskData);
            }
            
            this.closeModal('taskModal');
        });

        // Project form
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const projectData = Object.fromEntries(formData.entries());
            
            const projectId = e.target.dataset.projectId;
            if (projectId) {
                this.updateProject(projectId, projectData);
            } else {
                this.addProject(projectData);
            }
            
            this.closeModal('projectModal');
        });

        // Modal controls
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.openProjectModal();
        });

        document.querySelectorAll('.modal-close, #cancelTaskBtn, #cancelProjectBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Filters
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('priorityFilter')?.addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('searchTasks')?.addEventListener('input', () => {
            this.renderTasks();
        });

        // Settings
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.showNotification('Perfil atualizado com sucesso!', 'success');
        });

        document.getElementById('darkMode')?.addEventListener('change', () => {
            this.toggleDarkMode();
        });

        document.getElementById('notifications')?.addEventListener('change', () => {
            this.saveSettings();
        });

        document.getElementById('language')?.addEventListener('change', () => {
            this.saveSettings();
        });

        // Data management
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
            }
        });

        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            this.clearAllData();
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Load settings on init
        this.loadSettings();
    }
}

// Inicializar aplicação
const taskManager = new TaskManager();

// Expor globalmente para uso nos event handlers inline
window.taskManager = taskManager;