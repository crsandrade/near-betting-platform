// Utilitário para migração de dados entre diferentes tipos de armazenamento
// Permite migrar facilmente de LocalStorage para banco de dados e vice-versa

class DataMigration {
    constructor() {
        this.migrationHistory = [];
    }

    // Migrar dados de um tipo de armazenamento para outro
    async migrate(fromType, toType, options = {}) {
        const migrationId = this.generateMigrationId();
        const startTime = new Date();
        
        console.log(`Iniciando migração ${migrationId}: ${fromType} -> ${toType}`);
        
        try {
            // Criar repositórios de origem e destino
            const sourceRepo = new DataRepository(fromType);
            const targetRepo = new DataRepository(toType);
            
            // Fazer backup se solicitado
            if (options.createBackup !== false) {
                await this.createBackup(sourceRepo, migrationId);
            }
            
            // Exportar dados da origem
            console.log('Exportando dados da origem...');
            const data = await sourceRepo.exportData();
            
            // Validar dados
            this.validateMigrationData(data);
            
            // Limpar destino se solicitado
            if (options.clearTarget) {
                console.log('Limpando dados do destino...');
                await targetRepo.clearAllData();
            }
            
            // Importar dados no destino
            console.log('Importando dados no destino...');
            await targetRepo.importData(data);
            
            // Verificar integridade
            await this.verifyMigration(sourceRepo, targetRepo);
            
            const endTime = new Date();
            const duration = endTime - startTime;
            
            const migrationRecord = {
                id: migrationId,
                fromType,
                toType,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration,
                status: 'success',
                recordsCount: {
                    tasks: data.tasks ? data.tasks.length : 0,
                    projects: data.projects ? data.projects.length : 0,
                    users: data.users ? data.users.length : 0
                },
                options
            };
            
            this.migrationHistory.push(migrationRecord);
            
            console.log(`Migração ${migrationId} concluída com sucesso em ${duration}ms`);
            return migrationRecord;
            
        } catch (error) {
            const endTime = new Date();
            const duration = endTime - startTime;
            
            const migrationRecord = {
                id: migrationId,
                fromType,
                toType,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration,
                status: 'failed',
                error: error.message,
                options
            };
            
            this.migrationHistory.push(migrationRecord);
            
            console.error(`Migração ${migrationId} falhou:`, error);
            throw error;
        }
    }

    // Criar backup antes da migração
    async createBackup(repository, migrationId) {
        try {
            const data = await repository.exportData();
            const backupData = {
                ...data,
                backupInfo: {
                    migrationId,
                    createdAt: new Date().toISOString(),
                    type: 'pre-migration-backup'
                }
            };
            
            // Salvar backup no localStorage como fallback
            const backupKey = `migration_backup_${migrationId}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            console.log(`Backup criado: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            throw new Error(`Falha ao criar backup: ${error.message}`);
        }
    }

    // Validar dados antes da migração
    validateMigrationData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados de migração inválidos');
        }
        
        // Validar estrutura básica
        const requiredFields = ['tasks', 'projects', 'exportDate', 'version'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }
        
        // Validar arrays
        if (!Array.isArray(data.tasks)) {
            throw new Error('Campo tasks deve ser um array');
        }
        
        if (!Array.isArray(data.projects)) {
            throw new Error('Campo projects deve ser um array');
        }
        
        // Validar estrutura das tarefas
        for (const task of data.tasks) {
            if (!task.id || !task.title || !task.status) {
                throw new Error(`Tarefa inválida: ${JSON.stringify(task)}`);
            }
        }
        
        // Validar estrutura dos projetos
        for (const project of data.projects) {
            if (!project.id || !project.name) {
                throw new Error(`Projeto inválido: ${JSON.stringify(project)}`);
            }
        }
        
        console.log('Validação dos dados concluída com sucesso');
    }

    // Verificar integridade após migração
    async verifyMigration(sourceRepo, targetRepo) {
        try {
            const sourceData = await sourceRepo.exportData();
            const targetData = await targetRepo.exportData();
            
            // Comparar contagens
            if (sourceData.tasks.length !== targetData.tasks.length) {
                throw new Error(`Contagem de tarefas não confere: origem=${sourceData.tasks.length}, destino=${targetData.tasks.length}`);
            }
            
            if (sourceData.projects.length !== targetData.projects.length) {
                throw new Error(`Contagem de projetos não confere: origem=${sourceData.projects.length}, destino=${targetData.projects.length}`);
            }
            
            // Verificar IDs únicos
            const sourceTaskIds = new Set(sourceData.tasks.map(t => t.id));
            const targetTaskIds = new Set(targetData.tasks.map(t => t.id));
            
            if (sourceTaskIds.size !== targetTaskIds.size) {
                throw new Error('IDs de tarefas não conferem após migração');
            }
            
            const sourceProjectIds = new Set(sourceData.projects.map(p => p.id));
            const targetProjectIds = new Set(targetData.projects.map(p => p.id));
            
            if (sourceProjectIds.size !== targetProjectIds.size) {
                throw new Error('IDs de projetos não conferem após migração');
            }
            
            console.log('Verificação de integridade concluída com sucesso');
        } catch (error) {
            console.error('Erro na verificação de integridade:', error);
            throw error;
        }
    }

    // Restaurar backup
    async restoreBackup(backupKey, targetType) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error(`Backup não encontrado: ${backupKey}`);
            }
            
            const data = JSON.parse(backupData);
            const targetRepo = new DataRepository(targetType);
            
            await targetRepo.importData(data);
            
            console.log(`Backup ${backupKey} restaurado com sucesso`);
            return true;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            throw error;
        }
    }

    // Listar backups disponíveis
    listBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('migration_backup_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        migrationId: data.backupInfo?.migrationId,
                        createdAt: data.backupInfo?.createdAt,
                        tasksCount: data.tasks?.length || 0,
                        projectsCount: data.projects?.length || 0
                    });
                } catch (error) {
                    console.warn(`Backup corrompido: ${key}`);
                }
            }
        }
        return backups;
    }

    // Limpar backups antigos
    cleanupBackups(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 dias por padrão
        const now = new Date();
        const backups = this.listBackups();
        let cleaned = 0;
        
        for (const backup of backups) {
            if (backup.createdAt) {
                const backupDate = new Date(backup.createdAt);
                if (now - backupDate > maxAge) {
                    localStorage.removeItem(backup.key);
                    cleaned++;
                }
            }
        }
        
        console.log(`${cleaned} backups antigos removidos`);
        return cleaned;
    }

    // Obter histórico de migrações
    getMigrationHistory() {
        return [...this.migrationHistory];
    }

    // Gerar ID único para migração
    generateMigrationId() {
        return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Migração automática baseada em configuração
    async autoMigrate() {
        try {
            // Verificar se há configuração de migração automática
            const config = typeof DatabaseConfig !== 'undefined' ? DatabaseConfig : null;
            if (!config || !config.migration.autoMigrate) {
                return false;
            }
            
            const currentType = config.currentStorage;
            const targetType = process.env.DATABASE_TYPE || currentType;
            
            if (currentType === targetType) {
                console.log('Nenhuma migração necessária');
                return false;
            }
            
            console.log(`Migração automática detectada: ${currentType} -> ${targetType}`);
            
            await this.migrate(currentType, targetType, {
                createBackup: config.migration.backupBeforeMigration,
                clearTarget: true
            });
            
            // Atualizar configuração
            config.setStorageType(targetType);
            
            return true;
        } catch (error) {
            console.error('Erro na migração automática:', error);
            throw error;
        }
    }

    // Testar conectividade com diferentes tipos de banco
    async testConnections() {
        const results = {};
        const types = ['localStorage', 'mongodb', 'postgresql', 'firebase'];
        
        for (const type of types) {
            try {
                const repo = new DataRepository(type);
                // Tentar uma operação simples
                await repo.getStats();
                results[type] = { status: 'success', message: 'Conexão bem-sucedida' };
            } catch (error) {
                results[type] = { status: 'error', message: error.message };
            }
        }
        
        return results;
    }
}

// Exportar para uso no Node.js ou navegador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMigration;
} else {
    window.DataMigration = DataMigration;
}