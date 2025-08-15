// Servidor HTTP simples para servir o sistema de gestão
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Carregar configurações de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Importar sistema de inicialização e configurações
const systemInitializer = require('./init.js');
const environmentConfig = require('./config/environments.js');
const DatabaseConfig = require('./config/database.js');
const { DataRepository } = require('./database/DataRepository.js');

// Obter configurações do ambiente atual
const config = environmentConfig.getCurrentConfig();
const serverConfig = config.server;
const PORT = serverConfig.port;
const HOST = serverConfig.host;

// Configurar tipo de banco de dados baseado na configuração do ambiente
DatabaseConfig.currentStorage = config.database.type;

if (config.database.type) {
    try {
        DatabaseConfig.setStorageType(config.database.type);
        console.log(`Tipo de armazenamento configurado: ${config.database.type}`);
    } catch (error) {
        console.warn(`Erro ao configurar tipo de armazenamento: ${error.message}`);
        console.log('Usando LocalStorage como fallback');
    }
}

// MIME types para diferentes tipos de arquivo
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Função para servir arquivos estáticos
function serveStaticFile(filePath, res) {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Arquivo não encontrado - servir index.html como fallback
                fs.readFile(path.join(__dirname, '..', 'public', 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Erro interno do servidor');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Erro interno do servidor: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
    // Parse da URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Adicionar headers CORS baseado na configuração do ambiente
    const corsOrigins = serverConfig.cors.origin;
    const origin = req.headers.origin;
    
    if (Array.isArray(corsOrigins)) {
        if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
    } else {
        res.setHeader('Access-Control-Allow-Origin', corsOrigins || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', serverConfig.cors.credentials);
    
    // Responder a requisições OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API endpoints
    if (pathname.startsWith('/api/')) {
        await handleApiRequest(req, res, pathname);
        return;
    }

    // Remover query string e fragmentos
    pathname = pathname.replace(/\/$/, '/index.html');

    // Se for a raiz, servir index.html da pasta public
    if (pathname === '/') {
        pathname = '/public/index.html';
    }

    // Construir caminho do arquivo
    const filePath = path.join(__dirname, '..', pathname);

    // Verificar se o arquivo está dentro do diretório do projeto (segurança)
    const resolvedPath = path.resolve(filePath);
    const projectRoot = path.resolve(__dirname);
    
    if (!resolvedPath.startsWith(projectRoot)) {
        res.writeHead(403);
        res.end('Acesso negado');
        return;
    }

    // Servir arquivo estático
    serveStaticFile(filePath, res);
});

// Função para lidar com requisições da API
async function handleApiRequest(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        switch (pathname) {
            case '/api/status':
                const systemInfo = systemInitializer.getSystemInfo();
                res.writeHead(200);
                res.end(JSON.stringify({
                    status: 'online',
                    timestamp: new Date().toISOString(),
                    ...systemInfo
                }));
                break;
                
            case '/api/database/config':
                res.writeHead(200);
                res.end(JSON.stringify({
                    currentStorage: DatabaseConfig.currentStorage,
                    availableTypes: DatabaseConfig.getAvailableTypes(),
                    config: DatabaseConfig.getConfig(DatabaseConfig.currentStorage),
                    environment: environmentConfig.currentEnv
                }));
                break;
                
            case '/api/environment':
                res.writeHead(200);
                res.end(JSON.stringify(environmentConfig.getEnvironmentInfo()));
                break;
                
            case '/api/database/stats':
                const repository = new DataRepository(DatabaseConfig.currentStorage);
                const stats = await repository.getStats();
                res.writeHead(200);
                res.end(JSON.stringify(stats));
                break;
                
            case '/api/database/test':
                const testRepository = new DataRepository(DatabaseConfig.currentStorage);
                const testResult = await testRepository.testConnection();
                res.writeHead(200);
                res.end(JSON.stringify({
                    connected: testResult,
                    type: DatabaseConfig.currentStorage,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case '/api/system/health':
                const healthCheck = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    environment: environmentConfig.currentEnv,
                    database: {
                        type: DatabaseConfig.currentStorage,
                        connected: true // Você pode implementar uma verificação real
                    },
                    features: systemInitializer.getEnabledFeatures()
                };
                res.writeHead(200);
                res.end(JSON.stringify(healthCheck));
                break;
                
            case '/api/auth/login':
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    req.on('end', async () => {
                        try {
                            const { username, password } = JSON.parse(body);
                            const repository = new DataRepository(DatabaseConfig.currentStorage);
                            const users = await repository.getUsers();
                            const user = users.find(u => u.username === username && u.password === password);
                            
                            if (user) {
                                // Remover senha da resposta
                                const { password: _, ...userWithoutPassword } = user;
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    user: userWithoutPassword,
                                    message: 'Login realizado com sucesso'
                                }));
                            } else {
                                res.writeHead(401);
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Usuário ou senha inválidos'
                                }));
                            }
                        } catch (error) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Dados inválidos'
                            }));
                        }
                    });
                } else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Método não permitido' }));
                }
                break;
                
            case '/api/auth/logout':
                if (req.method === 'POST') {
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Logout realizado com sucesso'
                    }));
                } else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Método não permitido' }));
                }
                break;
                
            case '/api/auth/verify':
                // Endpoint para verificar se o usuário está autenticado
                // Por enquanto, apenas retorna sucesso (autenticação é gerenciada no cliente)
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: 'Sessão válida'
                }));
                break;
                
            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
        }
    } catch (error) {
        console.error('Erro na API:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ 
            error: 'Erro interno do servidor',
            message: error.message 
        }));
    }
}

// Inicializar sistema e servidor
async function startServer() {
    try {
        // Inicializar sistema
        await systemInitializer.initialize();
        
        // Inicializar servidor
        server.listen(PORT, HOST, () => {
            console.log(`\n🚀 Servidor rodando em http://${HOST}:${PORT}`);
            console.log('\n📋 Sistema de Gestão de Tarefas e Projetos');
            console.log(`\n💾 Tipo de armazenamento: ${DatabaseConfig.currentStorage}`);
            console.log(`\n🌍 Ambiente: ${config.environment}`);
            console.log('\n👤 Credenciais de acesso:');
            console.log('   Admin: admin / admin123');
            console.log('   Usuário: user / user123');
            console.log('\n✨ Funcionalidades disponíveis:');
            console.log('   • Dashboard interativo');
            console.log('   • Gestão de tarefas e projetos');
            console.log('   • Gráficos e análises');
            console.log('   • Notificações');
            console.log('   • Modo escuro/claro');
            console.log('   • Exportar/Importar dados');
            console.log('   • Sistema de banco de dados robusto');
            console.log('\n🔗 Endpoints da API:');
            console.log(`   • GET  http://${HOST}:${PORT}/api/status`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/database/config`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/environment`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/database/stats`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/database/test`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/system/health`);
            console.log(`   • POST http://${HOST}:${PORT}/api/auth/login`);
            console.log(`   • POST http://${HOST}:${PORT}/api/auth/logout`);
            console.log(`   • GET  http://${HOST}:${PORT}/api/auth/verify`);
            console.log('\n🔗 Acesse o sistema no navegador!');
        });
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error.message);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();

// Tratamento de erros
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: Porta ${PORT} já está em uso.`);
        console.log('💡 Tente usar uma porta diferente ou pare o processo que está usando esta porta.');
        console.log(`💡 Para usar uma porta diferente: PORT=3001 node ${__filename}`);
    } else {
        console.error('\n❌ Erro no servidor:', err.message);
    }
    process.exit(1);
});

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso!');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso!');
        process.exit(0);
    });
});