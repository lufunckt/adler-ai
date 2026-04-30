# Adler AI Backend

Backend FastAPI do Adler AI. O MVP usa custo operacional baixo e pode rodar com SQLite local para demo, mantendo estrutura pronta para Supabase/PostgreSQL, arquivos externos e IA local/free-tier.

## Rodar localmente

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn backend.app:app --reload --app-dir ..
```

Servidor local: `http://127.0.0.1:8000`

## Variaveis de ambiente

Copie `.env.example` na raiz do projeto para `.env`.

Variaveis principais:

- `APP_NAME=Adler AI`
- `ADLER_STORAGE_MODE=local`
- `DATABASE_URL=sqlite:///backend/data/adler.db`
- `ADLER_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173`

Em producao, configure `ADLER_CORS_ORIGINS` com a URL publica do frontend.

## Rotas importantes

- `GET /api/adler/health`
- `GET /api/adler/bootstrap`
- `GET /api/adler/patients`
- `GET /api/adler/workspace/{patient_id}`
- `GET /api/adler/medications/search?q=sertralina`
- `POST /api/adler/intelligence/sessions/analyze`
- `GET /api/adler/intelligence/patients/{patient_id}/evolution/decision`
- `GET /api/adler/intelligence/patients/{patient_id}/abandonment-risk`
- `GET /api/adler/whatsapp/patients/{patient_id}/dashboard`

## Publicacao

Para publicar backend em Render/Railway/Fly/Vercel, use o comando:

```bash
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

No Vercel, o arquivo `api/index.py` importa `backend.app:app`.

## Limite clinico

As respostas do backend sao apoio estruturado para decisao e documentacao. O Adler nao realiza prescricao autonoma, atendimento emergencial ou diagnostico fechado sem revisao profissional.
