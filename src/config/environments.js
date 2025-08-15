// Configurações específicas para diferentes ambientes
// Este arquivo permite configurar diferentes ambientes (dev, prod, test)
// com suas respectivas configurações de banco de dados e outras opções

const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config();

class EnvironmentConfig {
    constructor() {
        this.currentEnv = process.env.NODE_ENV || 'development';
        this.configs = this.loadConfigurations();
    }

    loadConfigurations() {
        return {
            development: {
                database: {
                    type: process.env.DEV_DATABASE_TYPE || 'localStorage',
                    mongodb: {
                        uri: process.env.DEV_MONGODB_URI || 'mongodb://localhost:27017/taskmanager_dev',
                        options: {
                            useNewUrlParser: true,
                            useUnifiedTopology: true,
                            maxPoolSize: 5,
                            serverSelectionTimeoutMS: 5000,
                            socketTimeoutMS: 45000,
                        }
                    },
                    postgresql: {
                        host: process.env.DEV_PG_HOST || 'localhost',
                        port: process.env.DEV_PG_PORT || 5432,
                        database: process.env.DEV_PG_DATABASE || 'taskmanager_dev',
                        username: process.env.DEV_PG_USERNAME || 'postgres',
                        password: process.env.DEV_PG_PASSWORD || 'password',
                        ssl: false,
                        pool: {
                            min: 2,
                            max: 10,
                            acquire: 30000,
                            idle: 10000
                        }
                    },
                    firebase: {
                        projectId: process.env.DEV_FIREBASE_PROJECT_ID,
                        privateKey: process.env.DEV_FIREBASE_PRIVATE_KEY,
                        clientEmail: process.env.DEV_FIREBASE_CLIENT_EMAIL,
                        databaseURL: process.env.DEV_FIREBASE_DATABASE_URL
                    }
                },
                server: {
                    port: process.env.DEV_PORT || 3000,
                    host: process.env.DEV_HOST || 'localhost',
                    cors: {
                        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
                        credentials: true
                    }
                },
                security: {
                    jwtSecret: process.env.DEV_JWT_SECRET || 'dev-secret-key-change-in-production',
                    jwtExpiration: '24h',
                    bcryptRounds: 10,
                    sessionTimeout: 24 * 60 * 60 * 1000 // 24 horas
                },
                logging: {
                    level: 'debug',
                    console: true,
                    file: false
                },
                cache: {
                    enabled: false,
                    ttl: 300 // 5 minutos
                },
                backup: {
                    enabled: true,
                    interval: '0 2 * * *', // Todo dia às 2h
                    retention: 7, // 7 dias
                    location: './backups/dev'
                }
            },

            production: {
                database: {
                    type: process.env.DATABASE_TYPE || 'mongodb',
                    mongodb: {
                        uri: process.env.MONGODB_URI,
                        options: {
                            useNewUrlParser: true,
                            useUnifiedTopology: true,
                            maxPoolSize: 20,
                            serverSelectionTimeoutMS: 10000,
                            socketTimeoutMS: 45000,
                            bufferMaxEntries: 0,
                            bufferCommands: false,
                            maxIdleTimeMS: 30000,
                            retryWrites: true,
                            w: 'majority'
                        }
                    },
                    postgresql: {
                        host: process.env.PG_HOST,
                        port: process.env.PG_PORT || 5432,
                        database: process.env.PG_DATABASE,
                        username: process.env.PG_USERNAME,
                        password: process.env.PG_PASSWORD,
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        },
                        pool: {
                            min: 5,
                            max: 30,
                            acquire: 60000,
                            idle: 10000
                        }
                    },
                    firebase: {
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        databaseURL: process.env.FIREBASE_DATABASE_URL
                    }
                },
                server: {
                    port: process.env.PORT || 8080,
                    host: process.env.HOST || '0.0.0.0',
                    cors: {
                        origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
                        credentials: true
                    }
                },
                security: {
                    jwtSecret: process.env.JWT_SECRET,
                    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
                    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
                    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 60 * 60 * 1000 // 1 hora
                },
                logging: {
                    level: process.env.LOG_LEVEL || 'info',
                    console: process.env.LOG_CONSOLE === 'true',
                    file: process.env.LOG_FILE === 'true',
                    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
                },
                cache: {
                    enabled: process.env.CACHE_ENABLED === 'true',
                    ttl: parseInt(process.env.CACHE_TTL) || 600, // 10 minutos
                    redis: {
                        host: process.env.REDIS_HOST,
                        port: process.env.REDIS_PORT || 6379,
                        password: process.env.REDIS_PASSWORD
                    }
                },
                backup: {
                    enabled: process.env.BACKUP_ENABLED === 'true',
                    interval: process.env.BACKUP_INTERVAL || '0 2 * * *',
                    retention: parseInt(process.env.BACKUP_RETENTION) || 30,
                    location: process.env.BACKUP_LOCATION || './backups/prod',
                    s3: {
                        bucket: process.env.S3_BACKUP_BUCKET,
                        region: process.env.S3_BACKUP_REGION,
                        accessKeyId: process.env.S3_ACCESS_KEY_ID,
                        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
                    }
                }
            },

            test: {
                database: {
                    type: process.env.TEST_DATABASE_TYPE || 'localStorage',
                    mongodb: {
                        uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/taskmanager_test',
                        options: {
                            useNewUrlParser: true,
                            useUnifiedTopology: true,
                            maxPoolSize: 3,
                            serverSelectionTimeoutMS: 3000,
                            socketTimeoutMS: 30000,
                        }
                    },
                    postgresql: {
                        host: process.env.TEST_PG_HOST || 'localhost',
                        port: process.env.TEST_PG_PORT || 5432,
                        database: process.env.TEST_PG_DATABASE || 'taskmanager_test',
                        username: process.env.TEST_PG_USERNAME || 'postgres',
                        password: process.env.TEST_PG_PASSWORD || 'password',
                        ssl: false,
                        pool: {
                            min: 1,
                            max: 5,
                            acquire: 30000,
                            idle: 10000
                        }
                    },
                    firebase: {
                        projectId: process.env.TEST_FIREBASE_PROJECT_ID,
                        privateKey: process.env.TEST_FIREBASE_PRIVATE_KEY,
                        clientEmail: process.env.TEST_FIREBASE_CLIENT_EMAIL,
                        databaseURL: process.env.TEST_FIREBASE_DATABASE_URL
                    }
                },
                server: {
                    port: process.env.TEST_PORT || 3001,
                    host: process.env.TEST_HOST || 'localhost',
                    cors: {
                        origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
                        credentials: true
                    }
                },
                security: {
                    jwtSecret: 'test-secret-key',
                    jwtExpiration: '1h',
                    bcryptRounds: 4, // Menor para testes mais rápidos
                    sessionTimeout: 60 * 60 * 1000 // 1 hora
                },
                logging: {
                    level: 'error',
                    console: false,
                    file: false
                },
                cache: {
                    enabled: false,
                    ttl: 60 // 1 minuto
                },
                backup: {
                    enabled: false,
                    interval: null,
                    retention: 1,
                    location: './backups/test'
                }
            }
        };
    }

    // Obter configuração do ambiente atual
    getCurrentConfig() {
        return this.configs[this.currentEnv] || this.configs.development;
    }

    // Obter configuração específica de um ambiente
    getConfig(environment) {
        return this.configs[environment] || this.configs.development;
    }

    // Obter configuração do banco de dados
    getDatabaseConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).database;
    }

    // Obter configuração do servidor
    getServerConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).server;
    }

    // Obter configuração de segurança
    getSecurityConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).security;
    }

    // Obter configuração de logging
    getLoggingConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).logging;
    }

    // Obter configuração de cache
    getCacheConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).cache;
    }

    // Obter configuração de backup
    getBackupConfig(environment = null) {
        const env = environment || this.currentEnv;
        return this.getConfig(env).backup;
    }

    // Validar configurações obrigatórias
    validateConfig(environment = null) {
        const env = environment || this.currentEnv;
        const config = this.getConfig(env);
        const errors = [];

        // Validar configurações de produção
        if (env === 'production') {
            const security = config.security;
            
            if (!security.jwtSecret || security.jwtSecret === 'dev-secret-key-change-in-production') {
                errors.push('JWT_SECRET deve ser definido em produção');
            }

            if (config.database.type === 'mongodb' && !config.database.mongodb.uri) {
                errors.push('MONGODB_URI deve ser definido para MongoDB em produção');
            }

            if (config.database.type === 'postgresql') {
                const pg = config.database.postgresql;
                if (!pg.host || !pg.database || !pg.username || !pg.password) {
                    errors.push('Configurações PostgreSQL incompletas em produção');
                }
            }

            if (config.database.type === 'firebase') {
                const fb = config.database.firebase;
                if (!fb.projectId || !fb.privateKey || !fb.clientEmail) {
                    errors.push('Configurações Firebase incompletas em produção');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Obter informações do ambiente
    getEnvironmentInfo() {
        return {
            current: this.currentEnv,
            available: Object.keys(this.configs),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }

    // Definir ambiente (útil para testes)
    setEnvironment(environment) {
        if (!this.configs[environment]) {
            throw new Error(`Ambiente '${environment}' não encontrado`);
        }
        this.currentEnv = environment;
        process.env.NODE_ENV = environment;
    }

    // Criar diretórios necessários
    createDirectories() {
        const config = this.getCurrentConfig();
        const dirs = [];

        // Diretório de backup
        if (config.backup.enabled && config.backup.location) {
            dirs.push(config.backup.location);
        }

        // Diretório de logs
        if (config.logging.file && config.logging.filePath) {
            dirs.push(path.dirname(config.logging.filePath));
        }

        // Criar diretórios
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
}

// Instância singleton
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;