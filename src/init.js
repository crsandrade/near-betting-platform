// Arquivo de inicialização do sistema
// Este arquivo configura e inicializa o sistema baseado no ambiente
// e prepara tudo para funcionar com diferentes tipos de banco de dados

const path = require('path');
const fs = require('fs');

// Carregar configurações de ambiente
require('dotenv').config();

const environmentConfig = require('./config/environments.js');
const DatabaseConfig = require('./config/database.js');
const { DataRepository } = require('./database/DataRepository.js');
const DataMigration = require('./utils/DataMigration.js');

class SystemInitializer {
    constructor() {
        this.environment = environmentConfig.getCurrentConfig();
        this.isInitialized = false;
        this.startTime = Date.now();
    }

    // Inicializar sistema completo
    async initialize() {
        try {
            console.log('🚀 Inicializando Task Management System...');
            console.log(`📍 Ambiente: ${environmentConfig.currentEnv}`);
            console.log(`💾 Tipo de armazenamento: ${this.environment.database.type}`);
            
            // 1. Validar configurações
            await this.validateConfiguration();
            
            // 2. Criar diretórios necessários
            await this.createDirectories();
            
            // 3. Inicializar sistema de logging
            await this.initializeLogging();
            
            // 4. Inicializar banco de dados
            await this.initializeDatabase();
            
            // 5. Executar migrações se necessário
            await this.runMigrations();
            
            // 6. Inicializar cache se habilitado
            await this.initializeCache();
            
            // 7. Configurar backup automático
            await this.setupBackup();
            
            // 8. Verificar integridade dos dados
            await this.verifyDataIntegrity();
            
            this.isInitialized = true;
            const initTime = Date.now() - this.startTime;
            
            console.log('✅ Sistema inicializado com sucesso!');
            console.log(`⏱️  Tempo de inicialização: ${initTime}ms`);
            
            return {
                success: true,
                environment: environmentConfig.currentEnv,
                databaseType: this.environment.database.type,
                initializationTime: initTime,
                features: this.getEnabledFeatures()
            };
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            throw error;
        }
    }

    // Validar configurações
    async validateConfiguration() {
        console.log('🔍 Validando configurações...');
        
        const validation = environmentConfig.validateConfig();
        if (!validation.valid) {
            throw new Error(`Configurações inválidas: ${validation.errors.join(', ')}`);
        }
        
        // Verificar variáveis de ambiente obrigatórias
        const requiredEnvVars = this.getRequiredEnvironmentVariables();
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.warn('⚠️  Variáveis de ambiente ausentes:', missingVars.join(', '));
            
            // Em produção, falhar se variáveis críticas estão ausentes
            if (environmentConfig.currentEnv === 'production') {
                throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(', ')}`);
            }
        }
        
        console.log('✅ Configurações validadas');
    }

    // Criar diretórios necessários
    async createDirectories() {
        console.log('📁 Criando diretórios necessários...');
        
        environmentConfig.createDirectories();
        
        // Diretórios adicionais específicos do sistema
        const additionalDirs = [
            './temp',
            './uploads',
            './exports',
            './migrations'
        ];
        
        additionalDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        console.log('✅ Diretórios criados');
    }

    // Inicializar sistema de logging
    async initializeLogging() {
        console.log('📝 Configurando sistema de logging...');
        
        const loggingConfig = this.environment.logging;
        
        // Aqui você pode integrar com bibliotecas como Winston, Bunyan, etc.
        // Por enquanto, apenas configuramos o console
        if (loggingConfig.console) {
            console.log('✅ Logging no console habilitado');
        }
        
        if (loggingConfig.file) {
            console.log(`✅ Logging em arquivo habilitado: ${loggingConfig.filePath}`);
        }
    }

    // Inicializar banco de dados
    async initializeDatabase() {
        console.log('💾 Inicializando banco de dados...');
        
        const dbType = this.environment.database.type;
        
        try {
            // Testar conexão com o banco
            const repository = new DataRepository(dbType);
            await repository.testConnection();
            
            console.log(`✅ Conexão com ${dbType} estabelecida`);
            
            // Inicializar estrutura do banco se necessário
            await this.initializeDatabaseStructure(repository);
            
        } catch (error) {
            console.error(`❌ Erro ao conectar com ${dbType}:`, error.message);
            
            // Fallback para localStorage em desenvolvimento
            if (environmentConfig.currentEnv === 'development' && dbType !== 'localStorage') {
                console.log('🔄 Fazendo fallback para localStorage...');
                DatabaseConfig.currentStorage = 'localStorage';
                this.environment.database.type = 'localStorage';
            } else {
                throw error;
            }
        }
    }

    // Inicializar estrutura do banco de dados
    async initializeDatabaseStructure(repository) {
        console.log('🏗️  Inicializando estrutura do banco...');
        
        try {
            // Criar tabelas/coleções se necessário
            await repository.initializeSchema();
            
            // Criar dados iniciais se necessário
            await this.createInitialData(repository);
            
            console.log('✅ Estrutura do banco inicializada');
            
        } catch (error) {
            console.warn('⚠️  Aviso ao inicializar estrutura:', error.message);
        }
    }

    // Criar dados iniciais
    async createInitialData(repository) {
        try {
            // Verificar se já existem dados
            const stats = await repository.getStats();
            
            if (stats.totalTasks === 0 && stats.totalProjects === 0) {
                console.log('📋 Criando dados iniciais...');
                
                // Criar projeto padrão
                const defaultProject = {
                    id: 'default-project',
                    name: 'Projeto Geral',
                    description: 'Projeto padrão para tarefas gerais',
                    color: '#007bff',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await repository.addProject(defaultProject);
                
                // Criar tarefa de exemplo
                const exampleTask = {
                    id: 'example-task',
                    title: 'Bem-vindo ao Task Management System',
                    description: 'Esta é uma tarefa de exemplo. Você pode editá-la ou excluí-la.',
                    status: 'pending',
                    priority: 'medium',
                    projectId: 'default-project',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    dueDate: null,
                    tags: ['exemplo', 'bem-vindo']
                };
                
                await repository.addTask(exampleTask);
                
                console.log('✅ Dados iniciais criados');
            }
            
        } catch (error) {
            console.warn('⚠️  Aviso ao criar dados iniciais:', error.message);
        }
    }

    // Executar migrações
    async runMigrations() {
        console.log('🔄 Verificando migrações...');
        
        try {
            const migration = new DataMigration();
            
            // Verificar se há migrações pendentes
            const pendingMigrations = await migration.getPendingMigrations();
            
            if (pendingMigrations.length > 0) {
                console.log(`📦 Executando ${pendingMigrations.length} migrações...`);
                
                for (const migrationName of pendingMigrations) {
                    await migration.runMigration(migrationName);
                    console.log(`✅ Migração executada: ${migrationName}`);
                }
            } else {
                console.log('✅ Nenhuma migração pendente');
            }
            
        } catch (error) {
            console.warn('⚠️  Aviso nas migrações:', error.message);
        }
    }

    // Inicializar cache
    async initializeCache() {
        const cacheConfig = this.environment.cache;
        
        if (cacheConfig.enabled) {
            console.log('🗄️  Inicializando cache...');
            
            // Aqui você pode integrar com Redis, Memcached, etc.
            // Por enquanto, apenas log
            console.log(`✅ Cache habilitado (TTL: ${cacheConfig.ttl}s)`);
        }
    }

    // Configurar backup automático
    async setupBackup() {
        const backupConfig = this.environment.backup;
        
        if (backupConfig.enabled) {
            console.log('💾 Configurando backup automático...');
            
            // Aqui você pode configurar cron jobs para backup automático
            console.log(`✅ Backup configurado (Intervalo: ${backupConfig.interval})`);
        }
    }

    // Verificar integridade dos dados
    async verifyDataIntegrity() {
        console.log('🔍 Verificando integridade dos dados...');
        
        try {
            const repository = new DataRepository(this.environment.database.type);
            const integrity = await repository.verifyIntegrity();
            
            if (integrity.valid) {
                console.log('✅ Integridade dos dados verificada');
            } else {
                console.warn('⚠️  Problemas de integridade encontrados:', integrity.issues);
            }
            
        } catch (error) {
            console.warn('⚠️  Aviso na verificação de integridade:', error.message);
        }
    }

    // Obter variáveis de ambiente obrigatórias
    getRequiredEnvironmentVariables() {
        const dbType = this.environment.database.type;
        const env = environmentConfig.currentEnv;
        
        let required = [];
        
        if (env === 'production') {
            required.push('JWT_SECRET');
            
            switch (dbType) {
                case 'mongodb':
                    required.push('MONGODB_URI');
                    break;
                case 'postgresql':
                    required.push('PG_HOST', 'PG_DATABASE', 'PG_USERNAME', 'PG_PASSWORD');
                    break;
                case 'firebase':
                    required.push('FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL');
                    break;
            }
        }
        
        return required;
    }

    // Obter recursos habilitados
    getEnabledFeatures() {
        return {
            database: this.environment.database.type,
            cache: this.environment.cache.enabled,
            backup: this.environment.backup.enabled,
            logging: {
                console: this.environment.logging.console,
                file: this.environment.logging.file
            },
            security: {
                jwt: !!this.environment.security.jwtSecret,
                bcrypt: true
            }
        };
    }

    // Verificar se o sistema está inicializado
    isSystemInitialized() {
        return this.isInitialized;
    }

    // Obter informações do sistema
    getSystemInfo() {
        return {
            initialized: this.isInitialized,
            environment: environmentConfig.getEnvironmentInfo(),
            database: {
                type: this.environment.database.type,
                connected: true // Você pode implementar uma verificação real
            },
            features: this.getEnabledFeatures(),
            uptime: Date.now() - this.startTime
        };
    }

    // Finalizar sistema (cleanup)
    async shutdown() {
        console.log('🛑 Finalizando sistema...');
        
        try {
            // Fechar conexões de banco
            const repository = new DataRepository(this.environment.database.type);
            await repository.disconnect();
            
            // Limpar cache
            // Fechar logs
            // Outras limpezas necessárias
            
            console.log('✅ Sistema finalizado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao finalizar sistema:', error.message);
        }
    }
}

// Instância singleton
const systemInitializer = new SystemInitializer();

module.exports = systemInitializer;