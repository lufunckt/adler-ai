# Fluxo de Farmacogenética (PGx) - Adler AI

Este módulo permite solicitar e gerenciar laudos de farmacogenética de parceiros externos.

## Estados da Solicitação

- `requested`: Aguardando coleta da amostra (estado inicial).
- `sample_collected`: Amostra enviada ao laboratório.
- `lab_processing`: Em processamento no laboratório parceiro.
- `report_ready`: Laudo disponível para interpretação.
- `clinician_reviewed`: Interpretado e validado pelo médico.

## Endpoint de Atualização

`PUT /api/adler/intelligence/pharmacogenetics/{request_id}`

Payload sugerido para webhook ou integração manual:
```json
{
  "status": "sample_collected",
  "phenotype": "Metabolizador Extensivo",
  "result_json": {
    "gene": "CYP2D6",
    "updated_by": "Laboratório Parceiro X"
  }
}
```
