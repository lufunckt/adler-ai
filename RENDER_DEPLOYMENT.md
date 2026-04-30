# Adler AI - Deploy no Render

Este guia mostra como publicar o backend FastAPI do Adler no Render usando o Postgres duravel do Render.

## 1. Banco

Banco escolhido:

- Provedor: Render Postgres
- Nome sugerido: `adler-db`
- Database: `adler`
- User: `adler_user`

Use a **Internal Database URL** somente como variavel de ambiente do backend no Render. Nao coloque essa URL em arquivo do projeto.

## 2. Criar o backend no Render

No Render:

1. Clique em `New +`.
2. Escolha `Web Service`.
3. Conecte o repositorio do Adler.
4. Configure:

```text
Name: adler-ai-backend
Runtime: Python
Region: a mesma regiao do banco
Root Directory: deixe vazio, se o repo inteiro for este projeto
Build Command: pip install -r requirements.txt
Start Command: uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

Se voce configurar o root directory como `backend`, use:

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

Mas a configuracao mais simples para este projeto e deixar o root directory vazio.

## 3. Variaveis de ambiente do backend

Em `Environment`, adicione:

```env
APP_NAME=Adler AI
DATABASE_URL=<cole aqui a Internal Database URL do Render Postgres>
ADLER_STORAGE_MODE=postgres
ADLER_AI_PROVIDER=rules
ADLER_AI_PROVIDER_SESSION_ANALYSIS=rules
ADLER_AI_PROVIDER_EVOLUTION_SUMMARY=rules
ADLER_AI_PROVIDER_PATIENT_REPORT=rules
ADLER_AI_PROVIDER_DOCUMENT_DRAFT=rules
ADLER_SHARED_ACCOUNT_NAME=Equipe Adler Demo
ADLER_SHARED_ACCOUNT_EMAIL=clinica.demo@adler.ai
ADLER_SHARED_ACCOUNT_PASSWORD=AdlerClinicDemo2026!
ADLER_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,https://adler-ai-demo-20260423.netlify.app
```

Depois, quando o dominio final do frontend mudar, atualize `ADLER_CORS_ORIGINS`.

## 4. Verificar backend

Depois do deploy, abra:

```text
https://SEU-BACKEND-RENDER.onrender.com/api/adler/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "adler"
}
```

## 5. Conectar o frontend

No Netlify, atualize:

```env
VITE_API_BASE_URL=https://SEU-BACKEND-RENDER.onrender.com
```

Depois rode um novo deploy do frontend.

## 6. Proximos passos depois do primeiro deploy

- Confirmar que login funciona em producao.
- Confirmar que `/api/adler/bootstrap` cria os pacientes seed no Postgres.
- Confirmar que sair/entrar preserva pacientes e agenda.
- Trocar pacientes seedados por criacao/edicao real no frontend.
- Corrigir Alembic para migracoes formais do backend atual.
