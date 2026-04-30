# Adler AI - Roadmap para virar SaaS publicavel

Este documento organiza o que o Adler precisa para deixar de ser uma demo solta e virar um SaaS real, publicavel e apresentavel para clientes, investidores ou parceiros.

## Decisao central

O Adler nao deve tentar nascer "perfeito". O caminho mais seguro e publicar um MVP real, com um fluxo principal funcionando de ponta a ponta:

1. usuario cria/acessa uma conta
2. cadastra ou abre um paciente
3. grava ou registra uma sessao
4. roda uma analise clinica estruturada
5. salva o resultado no banco
6. revisa timeline, mapa cognitivo, documentos e check-ins
7. volta dias depois e os dados continuam la

Tudo que nao ajudar esse fluxo deve ficar para depois.

## Estado atual do projeto

### Ja existe

- Frontend React/Vite em `frontend`.
- Backend FastAPI em `backend`.
- Autenticacao propria com usuarios e sessoes.
- Rotas clinicas para analise, mapa, evolucao, risco e documentos.
- Banco via SQLAlchemy, hoje preparado para SQLite ou Postgres via `DATABASE_URL`.
- Persistencia parcial de notas, documentos e analises.
- Deploy anterior em Netlify para frontend.
- Deploy anterior em Vercel para backend.
- Roteador de IA por tarefa com suporte a `rules`, `ollama`, `gemini` e `openai`.
- Fallback clinico por regras quando IA externa nao esta configurada.

### Ainda esta com cara de demo

- Pacientes principais ainda saem de dados fixos em `backend/services/adler_store.py`.
- Agenda ainda e fixa.
- Alguns fluxos do frontend ainda tem fallback local para nao quebrar.
- Banco duravel ainda nao esta consolidado como fonte unica da verdade.
- Nao ha painel de admin/tenant completo.
- Nao ha billing/assinatura.
- Nao ha governanca clinica formal dentro do produto.
- Nao ha auditoria completa de eventos sensiveis.

## Arquitetura alvo do MVP publicavel

### Frontend

Manter Netlify ou migrar depois. Para agora:

- Netlify publica o React/Vite.
- `VITE_API_BASE_URL` aponta para o backend publico.
- Remover linguagem visual e funcional de demo.
- Bloquear telas internas se o usuario nao estiver autenticado.

### Backend

Recomendada a migracao para Render ou outro servico persistente para FastAPI.

Motivo: o Adler tem API com estado, banco, analise, arquivos e possivel processamento mais longo. Um web service persistente e mais simples de operar que serverless para essa fase.

### Banco de dados

Usar Postgres duravel. Opcoes:

- Supabase Postgres: bom para comecar, painel simples, Auth/Storage opcionais depois.
- Neon Postgres: bom se quiser Postgres serverless simples.
- Render Postgres: bom se quiser backend e banco no mesmo provedor.

Recomendacao para o Adler agora: Supabase Postgres ou Render Postgres. O mais importante e sair de SQLite temporario.

### IA

Usar arquitetura hibrida:

- `rules`: fallback seguro e barato.
- `ollama`: analises locais, testes, privacidade, custo baixo.
- `gemini`: tarefas premium, contexto longo, revisao longitudinal e documentos melhores.

Config sugerida:

```env
ADLER_AI_PROVIDER=rules
ADLER_AI_PROVIDER_SESSION_ANALYSIS=ollama
ADLER_AI_PROVIDER_EVOLUTION_SUMMARY=gemini
ADLER_AI_PROVIDER_PATIENT_REPORT=gemini
ADLER_AI_PROVIDER_DOCUMENT_DRAFT=gemini

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
```

Para producao publica, Ollama local so funciona se estiver em um servidor acessivel pelo backend. Se estiver rodando no seu computador, serve para desenvolvimento, nao para SaaS publico.

## Tabelas que o Adler precisa para deixar de ser demo

### Obrigatorias para MVP

- `users`
- `user_sessions`
- `tenants`
- `tenant_members`
- `patients`
- `appointments`
- `clinical_sessions`
- `clinical_analyses`
- `clinical_documents`
- `patient_checkins`
- `uploaded_documents`
- `audit_events`

### Importantes logo depois

- `subscriptions`
- `plans`
- `usage_events`
- `ai_runs`
- `ai_prompt_versions`
- `patient_consents`
- `integration_accounts`
- `whatsapp_messages`

## Multiusuario e multi-clinica

O Adler precisa separar dados por `tenant_id`.

Regras:

- todo paciente pertence a uma clinica/tenant
- todo documento pertence a uma clinica/tenant
- toda analise pertence a uma clinica/tenant
- nenhum usuario pode consultar dados de outro tenant
- administradores veem usuarios da propria clinica

Isso e mais importante que qualquer tela bonita. Sem isolamento por tenant, nao existe SaaS real.

## Segurança minima antes de publicar como produto

Obrigatorio:

- senhas com hash forte
- tokens de sessao seguros
- CORS restrito ao dominio do frontend
- variaveis secretas fora do codigo
- logs sem dados clinicos sensiveis
- auditoria de eventos importantes
- backup do banco
- HTTPS
- consentimento para gravacao e analise de sessoes
- aviso claro de que a IA apoia, mas nao substitui decisao clinica

Para contexto clinico, tambem preparar:

- termo de uso
- politica de privacidade
- politica de retencao/exclusao de dados
- controle de acesso por perfil
- exportacao/exclusao de dados de paciente

## MVP publicavel

### O que precisa estar pronto

1. Login real funcionando em producao.
2. Banco Postgres duravel em producao.
3. Pacientes vindos do banco, nao de lista fixa.
4. Criar/editar paciente.
5. Gravar ou registrar sessao.
6. Rodar analise e salvar no banco.
7. Timeline lendo analises salvas.
8. Mapa cognitivo lendo analises salvas.
9. Check-in salvo no banco.
10. Documentos/rascunhos salvos no banco.
11. Deploy do frontend e backend integrados.
12. Remover botoes/textos "demo" do fluxo principal.

### O que pode ficar para depois

- Billing com Stripe.
- WhatsApp real com envio automatico.
- Supabase Auth.
- App mobile.
- Treinamento/fine-tuning.
- Marketplace de clinicas.
- Dashboards financeiros.
- Integracoes com prontuario externo.

## Ordem de execucao recomendada

## Progresso iniciado

### 2026-04-29

- Criados modelos duraveis para pacientes e agenda:
  - `AdlerPatient`
  - `AdlerAppointment`
- Rotas principais de pacientes passaram a ler por `tenant_id`.
- Dashboard/bootstrap passaram a seedar pacientes e compromissos no banco quando o tenant ainda esta vazio.
- Workspace do paciente passou a poder carregar o perfil a partir do banco.
- Exportacao CSV de pacientes passou a respeitar tenant.
- O formato de resposta foi preservado para nao quebrar o frontend atual.
- Banco duravel escolhido: Render Postgres.
- Adicionado guia de deploy em `RENDER_DEPLOYMENT.md`.
- `backend/requirements.txt` passou a incluir driver Postgres.

Debito tecnico identificado:

- A pasta `alembic` ainda aponta para um pacote antigo `server`, nao para o backend FastAPI atual. Para producao de verdade, precisamos corrigir Alembic antes de depender de migracoes formais.

### Fase 1 - Fundacao real

Objetivo: publicar um Adler que salva dados de verdade.

1. Escolher provedor do backend: Render recomendado.
2. Escolher banco Postgres duravel: Supabase ou Render Postgres.
3. Configurar `DATABASE_URL` em producao.
4. Rodar backend contra Postgres.
5. Trocar pacientes/agenda fixos por tabelas reais.
6. Confirmar login e sessoes em producao.

### Fase 2 - Produto clinico funcional

Objetivo: fazer o chefe/cliente enxergar o valor real.

1. Melhorar cadastro de paciente.
2. Melhorar gravador de sessao.
3. Mostrar resultado da analise logo apos rodar.
4. Timeline e mapa lendo somente banco real.
5. Documentos gerados a partir das analises reais.
6. Check-ins vinculados ao paciente real.

### Fase 3 - IA forte

Objetivo: transformar a analise em diferencial competitivo.

1. Criar biblioteca de prompts versionados.
2. Criar 20 a 50 exemplos bons de entrada/saida.
3. Medir qualidade das respostas.
4. Usar Ollama para tarefas comuns.
5. Usar Gemini para tarefas premium.
6. Registrar toda execucao em `ai_runs`.

### Fase 4 - SaaS comercial

Objetivo: poder vender com menos risco.

1. Planos e assinatura.
2. Limites de uso por plano.
3. Tela de admin da clinica.
4. Convite de usuarios.
5. Auditoria e exportacao de dados.
6. Backups e monitoramento.
7. Termos, privacidade e consentimentos.

## Checklist de publicacao

Antes de chamar de SaaS real:

- [ ] Backend publico estavel.
- [ ] Frontend publico apontando para backend certo.
- [ ] Postgres duravel configurado.
- [ ] `DATABASE_URL` em producao.
- [ ] `ADLER_CORS_ORIGINS` restrito ao dominio real.
- [ ] Usuario consegue criar paciente.
- [ ] Usuario consegue gravar/registrar sessao.
- [ ] Analise e salva no banco.
- [ ] Timeline e mapa mostram dados salvos.
- [ ] Logout/login preserva dados.
- [ ] Nao ha dependência de SQLite temporario.
- [ ] Nao ha dependência do navegador para persistencia principal.
- [ ] Textos "demo" removidos do fluxo principal.
- [ ] Logs nao vazam dados sensiveis.
- [ ] Backup do banco existe.

## Decisao recomendada agora

Para sair da confusao, a proxima decisao deve ser simples:

**Vamos transformar o Adler em MVP SaaS com backend FastAPI em Render, banco Postgres duravel e frontend Netlify.**

Depois disso, a primeira implementacao deve ser:

1. criar modelos reais de paciente e agenda
2. migrar endpoints para usar banco
3. publicar backend persistente
4. apontar frontend para ele
5. remover o modo demo do fluxo principal
