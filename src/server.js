const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Diretório para armazenar os webhooks
const WEBHOOKS_DIR = path.join(__dirname, '../webhooks_data');

// Cria o diretório se não existir
if (!fs.existsSync(WEBHOOKS_DIR)) {
  fs.mkdirSync(WEBHOOKS_DIR, { recursive: true });
  console.log(`📁 Diretório criado: ${WEBHOOKS_DIR}`);
}

// Armazena os webhooks recebidos em memória
const webhooks = [];
const MAX_WEBHOOKS = 1000; // Limita para evitar uso excessivo de memória

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Endpoint principal do webhook
app.post('/destrava-ai-staging-webhooks-baas', (req, res) => {
  const webhookData = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    query: req.query,
    method: req.method,
    path: req.path
  };

  // Adiciona no início do array
  webhooks.unshift(webhookData);

  // Mantém apenas os últimos MAX_WEBHOOKS
  if (webhooks.length > MAX_WEBHOOKS) {
    webhooks.pop();
  }

  // Salva em arquivo JSON com ID único
  const filename = `webhook_${webhookData.id}.json`;
  const filepath = path.join(WEBHOOKS_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(webhookData, null, 2), 'utf8');
    console.log('Webhook recebido e salvo:', filename);
  } catch (error) {
    console.error('Erro ao salvar webhook:', error);
  }

  console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    id: webhookData.id,
    saved_file: filename
  });
});

// Endpoint alternativo com GET (caso necessário)
app.get('/destrava-ai-staging-webhooks-baas', (req, res) => {
  const webhookData = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query,
    method: req.method,
    path: req.path
  };

  webhooks.unshift(webhookData);

  if (webhooks.length > MAX_WEBHOOKS) {
    webhooks.pop();
  }

  // Salva em arquivo JSON com ID único
  const filename = `webhook_${webhookData.id}.json`;
  const filepath = path.join(WEBHOOKS_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(webhookData, null, 2), 'utf8');
    console.log('Webhook recebido (GET) e salvo:', filename);
  } catch (error) {
    console.error('Erro ao salvar webhook:', error);
  }

  console.log('Webhook recebido (GET):', JSON.stringify(webhookData, null, 2));

  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    id: webhookData.id,
    saved_file: filename
  });
});

// Endpoint para visualizar todos os webhooks recebidos
app.get('/webhooks', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  res.json({
    total: webhooks.length,
    limit,
    offset,
    data: webhooks.slice(offset, offset + limit)
  });
});

// Endpoint para obter o último webhook recebido (deve vir antes de /webhooks/:id)
app.get('/webhooks/latest/last', (req, res) => {
  if (webhooks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Nenhum webhook recebido ainda'
    });
  }

  res.json(webhooks[0]);
});

// Endpoint para listar todos os arquivos salvos (deve vir antes de /webhooks/:id)
app.get('/webhooks/files', (req, res) => {
  try {
    const files = fs.readdirSync(WEBHOOKS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(WEBHOOKS_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          path: filepath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({
      total: files.length,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar arquivos',
      error: error.message
    });
  }
});

// Endpoint para ler um arquivo específico (deve vir antes de /webhooks/:id)
app.get('/webhooks/file/:filename', (req, res) => {
  try {
    const filepath = path.join(WEBHOOKS_DIR, req.params.filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    const content = fs.readFileSync(filepath, 'utf8');
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao ler arquivo',
      error: error.message
    });
  }
});

// Endpoint para visualizar um webhook específico (deve vir por último)
app.get('/webhooks/:id', (req, res) => {
  const webhook = webhooks.find(w => w.id === req.params.id);

  if (!webhook) {
    return res.status(404).json({
      success: false,
      message: 'Webhook não encontrado'
    });
  }

  res.json(webhook);
});

// Endpoint para limpar todos os webhooks
app.delete('/webhooks', (req, res) => {
  const count = webhooks.length;
  webhooks.length = 0;

  res.json({
    success: true,
    message: `${count} webhooks removidos`
  });
});

// Interface HTML simples para visualização
app.get('/visualization', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Webhook Receiver - Destrava AI</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
        }
        .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .info-box code {
          background: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        .stat-card h3 {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .stat-card p {
          color: #333;
          font-size: 24px;
          font-weight: bold;
        }
        .actions {
          margin-bottom: 20px;
        }
        button {
          background: #2196f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-right: 10px;
        }
        button:hover {
          background: #1976d2;
        }
        button.danger {
          background: #f44336;
        }
        button.danger:hover {
          background: #d32f2f;
        }
        .webhook-list {
          margin-top: 20px;
        }
        .webhook-item {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .webhook-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .webhook-id {
          font-weight: bold;
          color: #333;
        }
        .webhook-time {
          color: #666;
          font-size: 14px;
        }
        pre {
          background: #263238;
          color: #aed581;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.5;
        }
        .no-webhooks {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Webhook Receiver</h1>
        <p class="subtitle">Destrava AI - Staging Webhooks BaaS</p>

        <div class="info-box">
          <strong>Endpoint do Webhook:</strong><br>
          <code>POST ${req.protocol}://${req.get('host')}/destrava-ai-staging-webhooks-baas</code>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total de Webhooks</h3>
            <p id="total-webhooks">0</p>
          </div>
          <div class="stat-card">
            <h3>Último Recebido</h3>
            <p id="last-received">-</p>
          </div>
        </div>

        <div class="actions">
          <button onclick="loadWebhooks()">Atualizar</button>
          <button onclick="clearWebhooks()" class="danger">Limpar Todos</button>
        </div>

        <div class="webhook-list" id="webhook-list">
          <div class="no-webhooks">Nenhum webhook recebido ainda...</div>
        </div>
      </div>

      <script>
        function formatDate(dateString) {
          const date = new Date(dateString);
          return date.toLocaleString('pt-BR');
        }

        function formatTimeSince(dateString) {
          const date = new Date(dateString);
          const now = new Date();
          const seconds = Math.floor((now - date) / 1000);

          if (seconds < 60) return seconds + 's atrás';
          if (seconds < 3600) return Math.floor(seconds / 60) + 'm atrás';
          if (seconds < 86400) return Math.floor(seconds / 3600) + 'h atrás';
          return Math.floor(seconds / 86400) + 'd atrás';
        }

        async function loadWebhooks() {
          try {
            const response = await fetch('/webhooks?limit=20');
            const data = await response.json();

            document.getElementById('total-webhooks').textContent = data.total;

            if (data.data.length === 0) {
              document.getElementById('last-received').textContent = '-';
              document.getElementById('webhook-list').innerHTML = '<div class="no-webhooks">Nenhum webhook recebido ainda...</div>';
              return;
            }

            document.getElementById('last-received').textContent = formatTimeSince(data.data[0].timestamp);

            const html = data.data.map(webhook => \`
              <div class="webhook-item">
                <div class="webhook-header">
                  <span class="webhook-id">ID: \${webhook.id}</span>
                  <span class="webhook-time">\${formatDate(webhook.timestamp)}</span>
                </div>
                <pre>\${JSON.stringify(webhook.body, null, 2)}</pre>
              </div>
            \`).join('');

            document.getElementById('webhook-list').innerHTML = html;
          } catch (error) {
            console.error('Erro ao carregar webhooks:', error);
          }
        }

        async function clearWebhooks() {
          if (!confirm('Tem certeza que deseja limpar todos os webhooks?')) {
            return;
          }

          try {
            await fetch('/webhooks', { method: 'DELETE' });
            loadWebhooks();
          } catch (error) {
            console.error('Erro ao limpar webhooks:', error);
          }
        }

        // Carrega webhooks ao iniciar
        loadWebhooks();

        // Atualiza automaticamente a cada 5 segundos
        setInterval(loadWebhooks, 5000);
      </script>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhooksCount: webhooks.length
  });
});

// Inicia o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Servidor webhook iniciado com sucesso!');
  console.log('='.repeat(50));
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📬 Endpoint webhook: POST /destrava-ai-staging-webhooks-baas`);
  console.log(`👀 Interface: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});
