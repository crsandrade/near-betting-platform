// Configuração de banco de dados
// Permite alternar facilmente entre diferentes tipos de armazenamento

const DatabaseConfig = {
    // Tipo de armazenamento atual
    // Opções: 'localStorage', 'mongodb', 'postgresql', 'firebase'
    currentStorage: 'localStorage',
    
    // Configurações para diferentes tipos de banco
    storageConfigs: {
        localStorage: {
            prefix: 'taskManager_',
            maxSize: 5 * 1024 * 1024, // 5MB limite aproximado
        },
        
        mongodb: {
            connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            },
            collections: {
                tasks: 'tasks',
                projects: 'projects',
                users: 'users'
            }
        },
        
        postgresql: {
            host: process.env.PG_HOST || 'localhost',
            port: process.env.PG_PORT || 5432,
            database: process.env.PG_DATABASE || 'taskmanager',
            username: process.env.PG_USERNAME || 'postgres',
            password: process.env.PG_PASSWORD || '',
            ssl: process.env.NODE_ENV === 'production',
            pool: {
                min: 2,
                max: 10,
                acquire: 30000,
                idle: 10000
            },
            tables: {
                tasks: 'tasks',
                projects: 'projects',
                users: 'users'
            }
        },
        
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            collections: {
                tasks: 'tasks',
                projects: 'projects',
                users: 'users'
            }
        }
    },
    
    // Configurações gerais
    general: {
        // Habilitar logs de operações de banco
        enableLogging: process.env.NODE_ENV !== 'production',
        
        // Timeout para operações de banco (ms)
        operationTimeout: 10000,
        
        // Número máximo de tentativas para operações que falharam
        maxRetries: 3,
        
        // Intervalo entre tentativas (ms)
        retryInterval: 1000,
        
        // Habilitar cache em memória
        enableCache: true,
        
        // Tempo de vida do cache (ms)
        cacheTimeout: 5 * 60 * 1000, // 5 minutos
        
        // Tamanho máximo do cache (número de itens)
        maxCacheSize: 1000
    },
    
    // Configurações de migração
    migration: {
        // Habilitar migração automática de dados
        autoMigrate: true,
        
        // Fazer backup antes da migração
        backupBeforeMigration: true,
        
        // Diretório para backups
        backupDirectory: './backups',
        
        // Manter quantos backups
        maxBackups: 5
    },
    
    // Configurações de segurança
    security: {
        // Criptografar dados sensíveis
        encryptSensitiveData: true,
        
        // Chave de criptografia (deve ser definida via variável de ambiente)
        encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
        
        // Habilitar auditoria de operações
        enableAudit: true,
        
        // Validar dados antes de salvar
        validateData: true
    },
    
    // Esquemas de validação para diferentes entidades
    schemas: {
        task: {
            required: ['title', 'status', 'priority'],
            properties: {
                id: { type: 'string' },
                title: { type: 'string', minLength: 1, maxLength: 200 },
                description: { type: 'string', maxLength: 1000 },
                status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                project: { type: 'string' },
                assignedTo: { type: 'string' },
                dueDate: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                completedAt: { type: 'string' }
            }
        },
        
        project: {
            required: ['name', 'status'],
            properties: {
                id: { type: 'string' },
                name: { type: 'string', minLength: 1, maxLength: 100 },
                description: { type: 'string', maxLength: 500 },
                status: { type: 'string', enum: ['active', 'completed', 'on-hold'] },
                color: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
            }
        },
        
        user: {
            required: ['username', 'email', 'role'],
            properties: {
                id: { type: 'string' },
                username: { type: 'string', minLength: 3, maxLength: 50 },
                email: { type: 'string' },
                password: { type: 'string', minLength: 6 },
                role: { type: 'string', enum: ['admin', 'user'] },
                firstName: { type: 'string', maxLength: 50 },
                lastName: { type: 'string', maxLength: 50 },
                avatar: { type: 'string' },
                preferences: { type: 'object' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                lastLogin: { type: 'string' }
            }
        }
    },
    
    // Métodos utilitários
    getCurrentConfig() {
        return this.storageConfigs[this.currentStorage];
    },
    
    setStorageType(type) {
        if (!this.storageConfigs[type]) {
            throw new Error(`Tipo de armazenamento '${type}' não suportado`);
        }
        this.currentStorage = type;
    },
    
    isLocalStorage() {
        return this.currentStorage === 'localStorage';
    },
    
    isDatabaseStorage() {
        return ['mongodb', 'postgresql', 'firebase'].includes(this.currentStorage);
    },
    
    validateEnvironment() {
        const config = this.getCurrentConfig();
        const errors = [];
        
        switch (this.currentStorage) {
            case 'mongodb':
                if (!config.connectionString) {
                    errors.push('MONGODB_URI não definida');
                }
                break;
                
            case 'postgresql':
                if (!config.host || !config.database) {
                    errors.push('Configurações do PostgreSQL incompletas');
                }
                break;
                
            case 'firebase':
                if (!config.apiKey || !config.projectId) {
                    errors.push('Configurações do Firebase incompletas');
                }
                break;
        }
        
        if (errors.length > 0) {
            throw new Error(`Erros de configuração: ${errors.join(', ')}`);
        }
        
        return true;
    },
    
    // Configurações específicas para desenvolvimento
    development: {
        seedData: true,
        resetOnStart: false,
        logQueries: true,
        enableDebugMode: true
    },
    
    // Configurações específicas para produção
    production: {
        seedData: false,
        resetOnStart: false,
        logQueries: false,
        enableDebugMode: false,
        enableSSL: true,
        connectionPooling: true
    }
};

// Aplicar configurações baseadas no ambiente
if (typeof process !== 'undefined' && process.env) {
    const env = process.env.NODE_ENV || 'development';
    
    // Aplicar configurações específicas do ambiente
    if (DatabaseConfig[env]) {
        Object.assign(DatabaseConfig.general, DatabaseConfig[env]);
    }
    
    // Definir tipo de armazenamento baseado na variável de ambiente
    if (process.env.DATABASE_TYPE) {
        DatabaseConfig.setStorageType(process.env.DATABASE_TYPE);
    }
}

// Exportar para uso no Node.js ou navegador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseConfig;
} else {
    window.DatabaseConfig = DatabaseConfig;
}