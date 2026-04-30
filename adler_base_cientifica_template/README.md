# Adler Base Cientifica Template

Este pacote serve como modelo para voce organizar a base cientifica que depois sera ingerida pelo backend do Adler AI.

Estrutura sugerida:

- `artigos/`
- `protocolos/tcc/`
- `protocolos/psicanalise/`
- `protocolos/psiquiatria/`
- `protocolos/gestalt/`
- `protocolos/terapia_do_esquema/`
- `escalas/`
- `farmacologia/`
- `genetica/`
- `exames/`
- `interacoes/`
- `dependencia_quimica/`
- `conceitos/`
- `psicopatologia/`
- `modelos_de_documentos/`
- `metadados/`

Arquivos mais importantes para preencher:

- [metadados/documentos.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/metadados/documentos.csv>)
- [interacoes/interacoes_medicamentosas.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/interacoes/interacoes_medicamentosas.csv>)
- [exames/monitoramento_exames.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/exames/monitoramento_exames.csv>)
- [escalas/escalas_psicologicas.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/escalas/escalas_psicologicas.csv>)
- [conceitos/conceitos_clinicos.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/conceitos/conceitos_clinicos.csv>)
- [psicopatologia/psicopatologias.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/psicopatologia/psicopatologias.csv>)
- [modelos_de_documentos/modelos_documentos.csv](</C:/Users/luiza/OneDrive/Documentos/New project/adler_base_cientifica_template/modelos_de_documentos/modelos_documentos.csv>)

Recomendacoes:

- Nomeie os PDFs de forma tecnica e descritiva.
- Prefira PDF com texto selecionavel.
- Use um `id` unico por documento.
- Mantenha as categorias consistentes para facilitar a indexacao.
- Se houver material de farmacocinetica ou farmacodinamica, coloque tambem em `farmacologia/` e referencie no `documentos.csv`.

Exemplo de nome de arquivo:

- `2023_lancet_ssri_meta_analise.pdf`
- `cpic_cyp2d6_ssri_2023.pdf`
- `monitoramento_litio_baseline_manutencao.pdf`
- `asrs1_escala_adulto.pdf`
