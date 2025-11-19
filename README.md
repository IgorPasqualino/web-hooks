# Webhook Receiver - Destrava AI

Projeto para receber e visualizar webhooks do sistema Destrava AI Staging BaaS.

## Recursos

- ✅ Endpoint webhook dedicado: `/destrava-ai-staging-webhooks-baas`
- ✅ Interface web para visualizar webhooks recebidos
- ✅ Armazenamento em memória dos últimos 1000 webhooks
- ✅ API REST para consultar webhooks
- ✅ Atualização automática da interface
- ✅ Pronto para deploy no Render

## Instalação Local

```bash
npm install
```

## Executar Localmente

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

O servidor estará disponível em: `http://localhost:3000`

## Endpoints Disponíveis

### Webhook Principal
```
POST /destrava-ai-staging-webhooks-baas
GET /destrava-ai-staging-webhooks-baas
```
Endpoint que recebe os webhooks. Aceita qualquer JSON no body.

### Visualização
```
GET /
```
Interface web para visualizar os webhooks recebidos em tempo real.

### API de Consulta

**Listar webhooks:**
```
GET /webhooks?limit=50&offset=0
```

**Buscar webhook específico:**
```
GET /webhooks/:id
```

**Último webhook recebido:**
```
GET /webhooks/latest/last
```

**Limpar todos os webhooks:**
```
DELETE /webhooks
```

**Health check:**
```
GET /health
```

## Deploy no Render

### Opção 1: Deploy Automático (Recomendado)

1. Faça push do código para um repositório GitHub
2. Acesse [Render.com](https://render.com)
3. Clique em "New +" → "Web Service"
4. Conecte seu repositório GitHub
5. O Render detectará automaticamente o `render.yaml`
6. Clique em "Create Web Service"

### Opção 2: Deploy Manual

1. Acesse [Render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório ou faça upload do código
4. Configure:
   - **Name:** destrava-ai-webhook-receiver
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (ou conforme necessário)
5. Clique em "Create Web Service"

### Após o Deploy

Seu endpoint webhook estará disponível em:
```
https://seu-app.onrender.com/destrava-ai-staging-webhooks-baas
```

Acesse a interface web em:
```
https://seu-app.onrender.com
```

## Testando o Webhook

### Com cURL
```bash
curl -X POST https://seu-app.onrender.com/destrava-ai-staging-webhooks-baas \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "timestamp": "2024-01-01T00:00:00Z"}'
```

### Com JavaScript/Fetch
```javascript
fetch('https://seu-app.onrender.com/destrava-ai-staging-webhooks-baas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    test: 'data',
    timestamp: new Date().toISOString()
  })
});
```

## Estrutura do Projeto

```
projeto-webhooks/
├── src/
│   └── server.js          # Servidor Express principal
├── package.json           # Dependências do projeto
├── render.yaml           # Configuração do Render
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore           # Arquivos ignorados pelo Git
└── README.md            # Documentação
```

## Variáveis de Ambiente

- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente de execução (development/production)

## Limitações

- Armazena até 1000 webhooks em memória
- Dados são perdidos quando o servidor reinicia
- Para persistência permanente, considere adicionar um banco de dados

## Próximos Passos (Opcional)

Se precisar de persistência de dados:
1. Adicionar MongoDB ou PostgreSQL
2. Implementar autenticação
3. Adicionar filtros e busca avançada
4. Exportar webhooks para CSV/JSON

## Suporte

Para problemas ou dúvidas, verifique:
- Logs no Render Dashboard
- Endpoint `/health` para status do servidor
- Console do navegador na interface web
