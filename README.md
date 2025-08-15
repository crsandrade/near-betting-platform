# Sistema de Gestão de Tarefas

Um sistema completo de gestão de tarefas e projetos desenvolvido em JavaScript puro, com interface moderna e funcionalidades avançadas.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login seguro
- **Dashboard**: Métricas em tempo real e visualizações
- **Gestão de Tarefas**: CRUD completo com filtros e busca
- **Controle de Projetos**: Organização e acompanhamento de progresso
- **Analytics**: Gráficos interativos com Chart.js
- **Configurações**: Modo escuro, notificações, exportar/importar dados
- **Interface Responsiva**: Funciona em desktop e mobile

## 🏗️ Estrutura do Projeto

```
├── public/
│   └── index.html              # Interface principal
├── assets/
│   ├── styles.css              # Estilos CSS
│   └── app.js                  # Lógica JavaScript
├── src/
│   ├── server.js               # Servidor Node.js
│   ├── init.js                 # Sistema de inicialização
│   ├── config/
│   │   ├── database.js         # Configurações de banco de dados
│   │   └── environments.js     # Configurações por ambiente
│   ├── database/
│   │   └── DataRepository.js   # Camada de abstração de dados
│   └── utils/
│       ├── DataMigration.js    # Utilitários de migração
│       └── migrate.js          # Script de migração CLI
├── .env.example               # Exemplo de variáveis de ambiente
├── package.json               # Dependências e scripts
├── .gitignore                # Arquivos ignorados
└── README.md                 # Documentação
```

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn
- (Opcional) MongoDB, PostgreSQL ou Firebase para banco de dados

### Passos para instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/crsandrade/near-betting-platform.git
   cd near-betting-platform
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente** (opcional):
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Inicie o servidor**:
   ```bash
   npm start
   ```

5. **Acesse o sistema**:
   Abra seu navegador e vá para `http://localhost:3000`

## 💾 Sistema de Banco de Dados

O sistema suporta múltiplos tipos de armazenamento:

### Tipos Suportados
- **localStorage** (padrão): Armazenamento local no navegador
- **MongoDB**: Banco de dados NoSQL
- **PostgreSQL**: Banco de dados relacional
- **Firebase**: Plataforma do Google

### Configuração por Ambiente

O sistema utiliza diferentes configurações baseadas na variável `NODE_ENV`:

- **development**: Configurações para desenvolvimento local
- **production**: Configurações otimizadas para produção
- **test**: Configurações para testes automatizados

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor com auto-reload
npm start                   # Inicia servidor em produção

# Sistema
npm run system:init         # Inicializa o sistema
npm run system:info         # Mostra informações do sistema
npm run env:validate        # Valida configurações do ambiente

# Banco de Dados
npm run db:test             # Testa conexão com banco
npm run db:stats            # Mostra estatísticas dos dados

# Migração de Dados
npm run migrate:help        # Ajuda do sistema de migração
npm run migrate:status      # Status atual do sistema
npm run migrate:test        # Testa conectividade com todos os bancos
npm run migrate:backup      # Lista backups disponíveis
npm run migrate:cleanup     # Remove backups antigos
```

### Migração entre Bancos de Dados

Para migrar dados entre diferentes tipos de banco:

```bash
# Migrar do localStorage para MongoDB
npm run migrate -- --from localStorage --to mongodb

# Migrar com backup
npm run migrate -- --from localStorage --to postgresql --backup

# Testar conectividade
npm run migrate:test

# Ver status do sistema
npm run migrate:status
```

## 🔐 Credenciais de Acesso

- **Administrador**: `admin` / `admin123`
- **Usuário**: `user` / `user123`

## 💻 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js (servidor HTTP nativo)
- **Gráficos**: Chart.js
- **Ícones**: Font Awesome
- **Armazenamento**: LocalStorage

## 📊 Recursos do Dashboard

- Estatísticas em tempo real
- Gráficos de produtividade
- Lista de tarefas recentes
- Progresso dos projetos
- Análise por status e prioridade

## ⚙️ Configurações

- Modo escuro/claro
- Configurações de notificações
- Exportar dados (JSON)
- Importar dados
- Limpar todos os dados

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor abra uma [issue](https://github.com/crsandrade/near-betting-platform/issues).

---

**Desenvolvido com ❤️ em JavaScript**
Um projeto para facilitar a vida de apostadores esportivos e brokers.
