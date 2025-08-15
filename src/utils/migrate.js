#!/usr/bin/env node

// Script de linha de comando para migração de dados
// Uso: node src/utils/migrate.js --from localStorage --to mongodb

const path = require('path');
const fs = require('fs');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Importar classes necessárias
const { DataRepository } = require('../database/DataRepository.js');
const DataMigration = require('./DataMigration.js');
const DatabaseConfig = require('../config/database.js');

// Função para exibir ajuda
function showHelp() {
    console.log(`
📦 Script de Migração de Dados - Task Management System
`);
    console.log('Uso:');
    console.log('  node src/utils/migrate.js [opções]\n');
    console.log('Opções:');
    console.log('  --from <tipo>     Tipo de armazenamento de origem (localStorage, mongodb, postgresql, firebase)');
    console.log('  --to <tipo>       Tipo de armazenamento de destino (localStorage, mongodb, postgresql, firebase)');
    console.log('  --backup          Criar backup antes da migração (padrão: true)');
    console.log('  --no-backup       Não criar backup antes da migração');
    console.log('  --clear-target    Limpar dados do destino antes da migração');
    console.log('  --test            Testar conectividade com todos os tipos de banco');
    console.log('  --list-backups    Listar backups disponíveis');
    console.log('  --restore <key>   Restaurar backup específico');
    console.log('  --cleanup         Limpar backups antigos (mais de 7 dias)');
    console.log('  --status          Mostrar status atual do sistema');
    console.log('  --help            Mostrar esta ajuda\n');
    console.log('Exemplos:');
    console.log('  node src/utils/migrate.js --from localStorage --to mongodb');
    console.log('  node src/utils/migrate.js --test');
    console.log('  node src/utils/migrate.js --list-backups');
    console.log('  node src/utils/migrate.js --status\n');
}

// Função para mostrar status do sistema
async function showStatus() {
    console.log('\n📊 Status do Sistema\n');
    console.log(`Tipo de armazenamento atual: ${DatabaseConfig.currentStorage}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Versão do Node.js: ${process.version}`);
    
    try {
        const repo = new DataRepository(DatabaseConfig.currentStorage);
        const stats = await repo.getStats();
        
        console.log('\n📈 Estatísticas dos Dados:');
        console.log(`  Tarefas: ${stats.totalTasks}`);
        console.log(`  Projetos: ${stats.totalProjects}`);
        console.log(`  Tarefas concluídas: ${stats.completedTasks}`);
        console.log(`  Tarefas pendentes: ${stats.pendingTasks}`);
        console.log(`  Tarefas em progresso: ${stats.inProgressTasks}`);
        
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error.message);
    }
}

// Função para testar conectividade
async function testConnections() {
    console.log('\n🔍 Testando Conectividade...\n');
    
    const migration = new DataMigration();
    const results = await migration.testConnections();
    
    for (const [type, result] of Object.entries(results)) {
        const status = result.status === 'success' ? '✅' : '❌';
        console.log(`${status} ${type.padEnd(12)} - ${result.message}`);
    }
    
    console.log();
}

// Função para listar backups
function listBackups() {
    console.log('\n💾 Backups Disponíveis\n');
    
    const migration = new DataMigration();
    const backups = migration.listBackups();
    
    if (backups.length === 0) {
        console.log('Nenhum backup encontrado.');
        return;
    }
    
    backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.key}`);
        console.log(`   Criado em: ${backup.createdAt || 'N/A'}`);
        console.log(`   Tarefas: ${backup.tasksCount}, Projetos: ${backup.projectsCount}`);
        console.log();
    });
}

// Função para limpar backups antigos
function cleanupBackups() {
    console.log('\n🧹 Limpando Backups Antigos...\n');
    
    const migration = new DataMigration();
    const cleaned = migration.cleanupBackups();
    
    console.log(`✅ ${cleaned} backups antigos removidos.\n`);
}

// Função para restaurar backup
async function restoreBackup(backupKey, targetType) {
    console.log(`\n🔄 Restaurando Backup: ${backupKey}\n`);
    
    try {
        const migration = new DataMigration();
        await migration.restoreBackup(backupKey, targetType || DatabaseConfig.currentStorage);
        console.log('✅ Backup restaurado com sucesso!\n');
    } catch (error) {
        console.error('❌ Erro ao restaurar backup:', error.message);
        process.exit(1);
    }
}

// Função principal de migração
async function migrate(fromType, toType, options = {}) {
    console.log(`\n🚀 Iniciando Migração: ${fromType} → ${toType}\n`);
    
    try {
        // Validar tipos de armazenamento
        const validTypes = ['localStorage', 'mongodb', 'postgresql', 'firebase'];
        if (!validTypes.includes(fromType)) {
            throw new Error(`Tipo de origem inválido: ${fromType}`);
        }
        if (!validTypes.includes(toType)) {
            throw new Error(`Tipo de destino inválido: ${toType}`);
        }
        
        if (fromType === toType) {
            console.log('⚠️  Origem e destino são iguais. Nenhuma migração necessária.');
            return;
        }
        
        const migration = new DataMigration();
        const result = await migration.migrate(fromType, toType, options);
        
        console.log('\n✅ Migração Concluída com Sucesso!');
        console.log(`\n📊 Resumo:`);
        console.log(`   ID da Migração: ${result.id}`);
        console.log(`   Duração: ${result.duration}ms`);
        console.log(`   Tarefas migradas: ${result.recordsCount.tasks}`);
        console.log(`   Projetos migrados: ${result.recordsCount.projects}`);
        console.log(`   Usuários migrados: ${result.recordsCount.users}`);
        
        if (options.createBackup !== false) {
            console.log('\n💾 Backup criado antes da migração.');
        }
        
        console.log();
        
    } catch (error) {
        console.error('\n❌ Erro na Migração:', error.message);
        console.log('\n💡 Dicas:');
        console.log('   • Verifique se as configurações de banco estão corretas');
        console.log('   • Certifique-se de que o banco de destino está acessível');
        console.log('   • Use --test para verificar conectividade');
        console.log('   • Verifique os logs para mais detalhes\n');
        process.exit(1);
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        showHelp();
        return;
    }
    
    // Processar argumentos
    const options = {
        from: null,
        to: null,
        backup: true,
        clearTarget: false,
        test: false,
        listBackups: false,
        restore: null,
        cleanup: false,
        status: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--from':
                options.from = args[++i];
                break;
            case '--to':
                options.to = args[++i];
                break;
            case '--no-backup':
                options.backup = false;
                break;
            case '--backup':
                options.backup = true;
                break;
            case '--clear-target':
                options.clearTarget = true;
                break;
            case '--test':
                options.test = true;
                break;
            case '--list-backups':
                options.listBackups = true;
                break;
            case '--restore':
                options.restore = args[++i];
                break;
            case '--cleanup':
                options.cleanup = true;
                break;
            case '--status':
                options.status = true;
                break;
            default:
                console.error(`❌ Argumento desconhecido: ${arg}`);
                showHelp();
                process.exit(1);
        }
    }
    
    try {
        // Executar ações baseadas nos argumentos
        if (options.status) {
            await showStatus();
        }
        
        if (options.test) {
            await testConnections();
        }
        
        if (options.listBackups) {
            listBackups();
        }
        
        if (options.cleanup) {
            cleanupBackups();
        }
        
        if (options.restore) {
            await restoreBackup(options.restore, options.to);
        }
        
        if (options.from && options.to) {
            await migrate(options.from, options.to, {
                createBackup: options.backup,
                clearTarget: options.clearTarget
            });
        }
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = { migrate, showStatus, testConnections, listBackups, cleanupBackups, restoreBackup };