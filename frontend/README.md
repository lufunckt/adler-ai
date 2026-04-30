# Adler AI Frontend

Aplicacao React + Vite + Tailwind do Adler AI, com dashboard do clinico, workspace de paciente, DSM/Psicopatologia, documentos, evolucao clinica, WhatsApp operacional e consulta medicamentosa baseada em evidencias.

## Rodar localmente

```bash
cd frontend
npm install
npm run dev
```

Por padrao, o frontend chama `http://127.0.0.1:8000`.
Para apontar para outro backend, crie `frontend/.env`:

```env
VITE_API_BASE_URL=https://seu-backend.com
```

## Validar antes de publicar

```bash
cd frontend
npm run check
npm run build
```

## Publicacao

O projeto raiz ja possui `netlify.toml` configurado para publicar `frontend/dist`.
No Netlify, defina a variavel `VITE_API_BASE_URL` com a URL publica do backend FastAPI.

## Observacao clinica

O Adler organiza dados, evidencias e documentos para apoio ao profissional. Ele nao substitui avaliacao clinica, prescricao, julgamento profissional ou atendimento de urgencia.
