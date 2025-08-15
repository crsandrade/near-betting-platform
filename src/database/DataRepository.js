// Camada de abstração para gerenciamento de dados
// Permite migração fácil entre LocalStorage e banco de dados

class DataRepository {
    constructor(storageType = 'localStorage') {
        this.storageType = storageType;
        this.storage = this.initializeStorage(storageType);
    }

    initializeStorage(type) {
        switch (type) {
            case 'localStorage':
                return new LocalStorageAdapter();
            case 'mongodb':
                return new MongoDBAdapter();
            case 'postgresql':
                return new PostgreSQLAdapter();
            case 'firebase':
                return new FirebaseAdapter();
            default:
                return new LocalStorageAdapter();
        }
    }

    // Métodos genéricos para todas as entidades
    async create(collection, data) {
        return await this.storage.create(collection, data);
    }

    async findAll(collection, filters = {}) {
        return await this.storage.findAll(collection, filters);
    }

    async findById(collection, id) {
        return await this.storage.findById(collection, id);
    }

    async update(collection, id, data) {
        return await this.storage.update(collection, id, data);
    }

    async delete(collection, id) {
        return await this.storage.delete(collection, id);
    }

    async deleteAll(collection) {
        return await this.storage.deleteAll(collection);
    }

    // Métodos específicos para tarefas
    async createTask(taskData) {
        const task = {
            id: this.generateId(),
            ...taskData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (task.status === 'completed') {
            task.completedAt = new Date().toISOString();
        }
        
        return await this.create('tasks', task);
    }

    async getTasks(filters = {}) {
        return await this.findAll('tasks', filters);
    }

    async getTaskById(id) {
        return await this.findById('tasks', id);
    }

    async updateTask(id, taskData) {
        const updateData = {
            ...taskData,
            updatedAt: new Date().toISOString()
        };
        
        // Gerenciar data de conclusão
        if (taskData.status === 'completed' && !taskData.completedAt) {
            updateData.completedAt = new Date().toISOString();
        } else if (taskData.status !== 'completed') {
            updateData.completedAt = null;
        }
        
        return await this.update('tasks', id, updateData);
    }

    async deleteTask(id) {
        return await this.delete('tasks', id);
    }

    // Métodos específicos para projetos
    async createProject(projectData) {
        const project = {
            id: this.generateId(),
            ...projectData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return await this.create('projects', project);
    }

    async getProjects(filters = {}) {
        return await this.findAll('projects', filters);
    }

    async getProjectById(id) {
        return await this.findById('projects', id);
    }

    async updateProject(id, projectData) {
        const updateData = {
            ...projectData,
            updatedAt: new Date().toISOString()
        };
        
        return await this.update('projects', id, updateData);
    }

    async deleteProject(id) {
        // Remover referências do projeto das tarefas
        const tasks = await this.getTasks({ project: id });
        for (const task of tasks) {
            await this.updateTask(task.id, { project: null });
        }
        
        return await this.delete('projects', id);
    }

    // Métodos específicos para usuários
    async createUser(userData) {
        const user = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return await this.create('users', user);
    }

    async getUsers(filters = {}) {
        return await this.findAll('users', filters);
    }

    async getUserById(id) {
        return await this.findById('users', id);
    }

    async getUserByUsername(username) {
        const users = await this.findAll('users', { username });
        return users.length > 0 ? users[0] : null;
    }

    async updateUser(id, userData) {
        const updateData = {
            ...userData,
            updatedAt: new Date().toISOString()
        };
        
        return await this.update('users', id, updateData);
    }

    async deleteUser(id) {
        return await this.delete('users', id);
    }

    // Métodos de utilidade
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async exportData() {
        const data = {
            tasks: await this.getTasks(),
            projects: await this.getProjects(),
            users: await this.getUsers(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        return data;
    }

    async importData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados inválidos para importação');
        }
        
        // Limpar dados existentes
        await this.deleteAll('tasks');
        await this.deleteAll('projects');
        
        // Importar novos dados
        if (data.tasks && Array.isArray(data.tasks)) {
            for (const task of data.tasks) {
                await this.create('tasks', task);
            }
        }
        
        if (data.projects && Array.isArray(data.projects)) {
            for (const project of data.projects) {
                await this.create('projects', project);
            }
        }
        
        return true;
    }

    async clearAllData() {
        await this.deleteAll('tasks');
        await this.deleteAll('projects');
        return true;
    }

    // Métodos de estatísticas
    async getStats() {
        const tasks = await this.getTasks();
        const projects = await this.getProjects();
        
        return {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
            totalProjects: projects.length,
            highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
            mediumPriorityTasks: tasks.filter(t => t.priority === 'medium').length,
            lowPriorityTasks: tasks.filter(t => t.priority === 'low').length
        };
    }

    async getTasksByProject(projectId) {
        return await this.getTasks({ project: projectId });
    }

    async getTasksByStatus(status) {
        return await this.getTasks({ status });
    }

    async getTasksByPriority(priority) {
        return await this.getTasks({ priority });
    }

    async getRecentTasks(limit = 5) {
        const tasks = await this.getTasks();
        return tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    async getCompletedTasksInPeriod(startDate, endDate) {
        const tasks = await this.getTasks({ status: 'completed' });
        return tasks.filter(task => {
            if (!task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate >= new Date(startDate) && completedDate <= new Date(endDate);
        });
    }

    // Testar conexão com o armazenamento
    async testConnection() {
        try {
            if (this.storage.testConnection) {
                return await this.storage.testConnection();
            }
            // Para localStorage, sempre retorna true
            return true;
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            return false;
        }
    }

    // Inicializar schema/estrutura do banco
    async initializeSchema() {
        if (this.storage.initializeSchema) {
            return await this.storage.initializeSchema();
        }
        return true;
    }

    // Desconectar do armazenamento
    async disconnect() {
        if (this.storage.disconnect) {
            return await this.storage.disconnect();
        }
        return true;
    }

    // Verificar integridade dos dados
    async verifyIntegrity() {
        if (this.storage.verifyIntegrity) {
            return await this.storage.verifyIntegrity();
        }
        return { valid: true, issues: [] };
    }

    // Obter estatísticas dos dados
    async getStats() {
        try {
            const tasks = await this.getAllTasks();
            const projects = await this.getAllProjects();
            const users = await this.getAllUsers();

            const completedTasks = tasks.filter(task => task.status === 'completed').length;
            const pendingTasks = tasks.filter(task => task.status === 'pending').length;
            const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

            return {
                totalTasks: tasks.length,
                totalProjects: projects.length,
                totalUsers: users.length,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {
                totalTasks: 0,
                totalProjects: 0,
                totalUsers: 0,
                completedTasks: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                lastUpdated: new Date().toISOString()
            };
        }
    }
}

// Adapter para LocalStorage (implementação atual)
class LocalStorageAdapter {
    constructor() {
        this.prefix = 'taskManager_';
    }

    async create(collection, data) {
        const items = await this.findAll(collection);
        items.push(data);
        this.saveCollection(collection, items);
        return data;
    }

    async findAll(collection, filters = {}) {
        const items = this.loadCollection(collection);
        
        if (Object.keys(filters).length === 0) {
            return items;
        }
        
        return items.filter(item => {
            return Object.keys(filters).every(key => {
                if (filters[key] === null || filters[key] === undefined) {
                    return item[key] === null || item[key] === undefined;
                }
                return item[key] === filters[key];
            });
        });
    }

    async findById(collection, id) {
        const items = await this.findAll(collection);
        return items.find(item => item.id === id) || null;
    }

    async update(collection, id, data) {
        const items = await this.findAll(collection);
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) {
            throw new Error(`Item com ID ${id} não encontrado`);
        }
        
        items[index] = { ...items[index], ...data };
        this.saveCollection(collection, items);
        return items[index];
    }

    async delete(collection, id) {
        const items = await this.findAll(collection);
        const filteredItems = items.filter(item => item.id !== id);
        this.saveCollection(collection, filteredItems);
        return true;
    }

    async deleteAll(collection) {
        this.saveCollection(collection, []);
        return true;
    }

    loadCollection(collection) {
        const key = this.prefix + collection;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    saveCollection(collection, items) {
        const key = this.prefix + collection;
        localStorage.setItem(key, JSON.stringify(items));
    }
}

// Placeholder para MongoDB Adapter (para implementação futura)
class MongoDBAdapter {
    constructor(connectionString) {
        this.connectionString = connectionString;
        // TODO: Implementar conexão com MongoDB
    }

    async create(collection, data) {
        // TODO: Implementar criação no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }

    async findAll(collection, filters = {}) {
        // TODO: Implementar busca no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }

    async findById(collection, id) {
        // TODO: Implementar busca por ID no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }

    async update(collection, id, data) {
        // TODO: Implementar atualização no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }

    async delete(collection, id) {
        // TODO: Implementar exclusão no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }

    async deleteAll(collection) {
        // TODO: Implementar limpeza da coleção no MongoDB
        throw new Error('MongoDB adapter não implementado ainda');
    }
}

// Placeholder para PostgreSQL Adapter (para implementação futura)
class PostgreSQLAdapter {
    constructor(connectionConfig) {
        this.connectionConfig = connectionConfig;
        // TODO: Implementar conexão com PostgreSQL
    }

    async create(collection, data) {
        // TODO: Implementar criação no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }

    async findAll(collection, filters = {}) {
        // TODO: Implementar busca no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }

    async findById(collection, id) {
        // TODO: Implementar busca por ID no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }

    async update(collection, id, data) {
        // TODO: Implementar atualização no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }

    async delete(collection, id) {
        // TODO: Implementar exclusão no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }

    async deleteAll(collection) {
        // TODO: Implementar limpeza da tabela no PostgreSQL
        throw new Error('PostgreSQL adapter não implementado ainda');
    }
}

// Placeholder para Firebase Adapter (para implementação futura)
class FirebaseAdapter {
    constructor(config) {
        this.config = config;
        // TODO: Implementar conexão com Firebase
    }

    async create(collection, data) {
        // TODO: Implementar criação no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }

    async findAll(collection, filters = {}) {
        // TODO: Implementar busca no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }

    async findById(collection, id) {
        // TODO: Implementar busca por ID no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }

    async update(collection, id, data) {
        // TODO: Implementar atualização no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }

    async delete(collection, id) {
        // TODO: Implementar exclusão no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }

    async deleteAll(collection) {
        // TODO: Implementar limpeza da coleção no Firebase
        throw new Error('Firebase adapter não implementado ainda');
    }
}

// Exportar para uso no Node.js ou navegador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataRepository, LocalStorageAdapter, MongoDBAdapter, PostgreSQLAdapter, FirebaseAdapter };
} else {
    window.DataRepository = DataRepository;
    window.LocalStorageAdapter = LocalStorageAdapter;
    window.MongoDBAdapter = MongoDBAdapter;
    window.PostgreSQLAdapter = PostgreSQLAdapter;
    window.FirebaseAdapter = FirebaseAdapter;
}