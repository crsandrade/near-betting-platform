// Servidor HTTP simples para servir o sistema de gestão
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

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
const server = http.createServer((req, res) => {
    // Parse da URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

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

// Iniciar servidor
server.listen(PORT, () => {
    console.log('\n🚀 Sistema de Gestão de Tarefas iniciado!');
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log('\n👤 Credenciais de acesso:');
    console.log('   Admin: admin / admin123');
    console.log('   Usuário: user / user123');
    console.log('\n⚡ Recursos disponíveis:');
    console.log('   • Dashboard com métricas em tempo real');
    console.log('   • Gerenciamento completo de tarefas');
    console.log('   • Controle de projetos');
    console.log('   • Analytics e gráficos');
    console.log('   • Sistema de notificações');
    console.log('   • Modo escuro/claro');
    console.log('   • Exportar/Importar dados');
    console.log('\n🔧 Para parar o servidor: Ctrl+C');
    console.log('\n' + '='.repeat(50));
});

// Tratamento de erros
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso!`);
        console.log('💡 Tente uma das seguintes soluções:');
        console.log('   1. Feche outros serviços na porta 3000');
        console.log('   2. Use uma porta diferente modificando o arquivo server.js');
        console.log('   3. Execute: netstat -ano | findstr :3000 (para ver o que está usando a porta)');
    } else {
        console.error('❌ Erro no servidor:', err);
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