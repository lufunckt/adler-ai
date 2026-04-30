# Adler AI

Hub de inteligencia clinica para saude mental. O Adler combina prontuario, analise clinica estruturada, evolucao longitudinal, documentos assistidos, DSM/Psicopatologia, suporte operacional via WhatsApp e consulta medicamentosa baseada em evidencias.

## Estado atual do MVP

- Frontend React + Tailwind com dashboard do clinico e workspace de paciente.
- Backend FastAPI com rotas Adler, banco local SQLite para desenvolvimento e estrutura preparada para Postgres duravel.
- Busca medicamentosa com RxNorm/RxNav, openFDA e base cientifica local curada.
- Analise clinica estruturada em JSON por sessao.
- Evolucao longitudinal e risco de abandono.
- Modulo WhatsApp premium para lembretes, confirmacoes e check-ins estruturados.
- Biblioteca de documentos/modelos e exportacao CSV de pacientes.

## Rodar localmente

Backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn backend.app:app --reload --app-dir ..
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`.

## Variaveis de ambiente

Copie `.env.example` para `.env` na raiz.
Copie `frontend/.env.example` para `frontend/.env` se quiser apontar para outro backend.

Em producao:

- `VITE_API_BASE_URL`: URL publica do backend.
- `ADLER_CORS_ORIGINS`: URL publica do frontend.
- `DATABASE_URL`: URL do banco de dados, se nao usar SQLite local.
- `ADLER_SHARED_ACCOUNT_EMAIL` / `ADLER_SHARED_ACCOUNT_PASSWORD`: conta compartilhavel para testes guiados.

## Validacao antes de publicar

```bash
cd frontend
npm run check
npm run build
```

```bash
cd ..
.\backend\.venv\Scripts\python.exe -c "from backend.app import app; print(len(app.routes))"
```

## Publicacao sugerida

Frontend:

- Netlify usando o `netlify.toml` da raiz.
- Build command: `npm --prefix frontend run build`
- Publish directory: `frontend/dist`

Backend:

- Render Web Service recomendado para o MVP.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
- Banco: Render Postgres ou outro Postgres via `DATABASE_URL`.

## Aviso clinico

O Adler AI e um sistema de apoio a organizacao, documentacao e decisao clinica. Ele nao substitui julgamento profissional, consulta, diagnostico, prescricao, conduta de urgencia ou revisao humana de documentos.
