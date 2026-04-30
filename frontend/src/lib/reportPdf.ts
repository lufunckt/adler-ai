import { jsPDF } from "jspdf";
import type { PatientRecord } from "../data/patientData";

export type JudicialIssuerType = "psicologo" | "psiquiatra";
export type PsychologicalDocumentType =
  | "laudo_pericial"
  | "parecer"
  | "relatorio"
  | "atestado"
  | "declaracao";
export type ReferralSourceDiscipline = "psicologo" | "psiquiatra";
export type ReferralSpecialty =
  | "psicologo"
  | "psiquiatra"
  | "neurologista"
  | "endocrinologista"
  | "nutricionista"
  | "cardiologista"
  | "nefrologista"
  | "clinico-geral"
  | "terapeuta-ocupacional";

export const PSYCHOLOGICAL_DOCUMENT_OPTIONS: Array<{
  label: string;
  value: PsychologicalDocumentType;
}> = [
  { value: "laudo_pericial", label: "Laudo Psicologico" },
  { value: "parecer", label: "Parecer" },
  { value: "relatorio", label: "Relatorio" },
  { value: "atestado", label: "Atestado" },
  { value: "declaracao", label: "Declaracao" }
];

export const REFERRAL_SOURCE_OPTIONS: Array<{
  label: string;
  value: ReferralSourceDiscipline;
}> = [
  { value: "psicologo", label: "Psicologo" },
  { value: "psiquiatra", label: "Psiquiatra" }
];

export const REFERRAL_SPECIALTY_OPTIONS: Array<{
  label: string;
  value: ReferralSpecialty;
}> = [
  { value: "psiquiatra", label: "Psiquiatra" },
  { value: "psicologo", label: "Psicologo" },
  { value: "neurologista", label: "Neurologista" },
  { value: "endocrinologista", label: "Endocrinologista" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "cardiologista", label: "Cardiologista" },
  { value: "nefrologista", label: "Nefrologista" },
  { value: "clinico-geral", label: "Clinico Geral" },
  { value: "terapeuta-ocupacional", label: "Terapeuta Ocupacional" }
];

type ReportBaseArgs = {
  approachLabel: string;
  clinicalFrame: string;
  patient: PatientRecord;
  riskLabel: string;
  riskScore: number;
  session: number;
  transcriptExcerpt: string;
};

type JudicialReportArgs = ReportBaseArgs & {
  includeAnalysis?: boolean;
  includeDemand?: boolean;
  includeGenetics?: boolean;
  includeInteractions?: boolean;
  includeLabs?: boolean;
  includePharmacology?: boolean;
  includeProcedures?: boolean;
  includeRisks?: boolean;
  includeSusContext?: boolean;
  includeTranscript?: boolean;
  issuerType: JudicialIssuerType;
  psychologicalDocumentType?: PsychologicalDocumentType;
};

type ReferralReportArgs = ReportBaseArgs & {
  includeDose?: boolean;
  includeGenetics?: boolean;
  includeInteractions?: boolean;
  includeLabs?: boolean;
  includeSymptoms?: boolean;
  includeTranscript?: boolean;
  sourceDiscipline?: ReferralSourceDiscipline;
  targetSpecialty?: ReferralSpecialty;
};

type PatientDocumentProfile = {
  accompanimentFrequency: string;
  accompanimentStart: string;
  address: string;
  age: string;
  analysisSummary: string;
  birthDate: string;
  cityUf: string;
  cid: string;
  clinicalHistory: string;
  cpf: string;
  declarationPurpose: string;
  judicialDemand: string;
  medicalRecipient: string;
  nonUseRisk: string;
  patientIdentifier: string;
  proceduresSummary: string[];
  psychologistRecipient: string;
  referralSymptoms: string[];
  rg: string;
  specializedReferralReasons: Partial<Record<ReferralSpecialty, string>>;
  susContext: string;
  technicalJustification: string;
  treatmentDuration: string;
  requestedMedication: string;
  requestedPosology: string;
};

type ClinicianProfile = {
  cityUf: string;
  label: string;
  name: string;
  register: string;
  roleLine: string;
};

type Writer = {
  doc: jsPDF;
  title: string;
  y: number;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 18;
const MARGIN_TOP = 18;
const MARGIN_BOTTOM = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const LINE_HEIGHT = 5.1;

const CLINICIAN_PROFILES: Record<JudicialIssuerType, ClinicianProfile> = {
  psicologo: {
    name: "Dra. Helena Barreto",
    label: "CRP",
    register: "06/184221",
    cityUf: "Sao Paulo - SP",
    roleLine: "Psicologa clinica e assistente tecnica"
  },
  psiquiatra: {
    name: "Dr. Andre Vasconcelos",
    label: "CRM",
    register: "52.184221-7",
    cityUf: "Sao Paulo - SP",
    roleLine: "Psiquiatra assistente"
  }
};

const PATIENT_PROFILES: Record<string, PatientDocumentProfile> = {
  "sarah-m": {
    accompanimentFrequency: "semanal",
    accompanimentStart: "03/02/2025",
    address: "Rua das Magnolias, 217, Vila Mariana, Sao Paulo - SP",
    age: "34 anos",
    analysisSummary:
      "Os dados clinicos apontam obsessividade centrada em saude, rituais de neutralizacao e piora noturna associada a fadiga, com reducao parcial do GAD-7 e persistencia de vulnerabilidade cognitiva em cenarios de incerteza.",
    birthDate: "14/09/1991",
    cityUf: "Sao Paulo - SP",
    cid: "F42.2 / F41.1",
    clinicalHistory:
      "Paciente em seguimento por quadro obsessivo com ansiedade de saude, insonia e rituais de verificacao. Ja realizou psicoterapia de suporte, fluoxetina e clomipramina com resposta insuficiente ou baixa tolerabilidade, mantendo importante prejuizo funcional e piora do sono.",
    cpf: "243.118.909-14",
    declarationPurpose:
      "Declaro, para fins de comparecimento e organizacao assistencial, que a paciente esteve em atendimento psicologico regular nesta plataforma clinica.",
    judicialDemand:
      "Solicitacao de documento tecnico para fins judiciais, com esclarecimento sobre gravidade do quadro, necessidade de continuidade assistencial e repercussao funcional do transtorno obsessivo-compulsivo.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "Sem a manutencao do esquema atual, ha risco de retorno de insonia grave, reintensificacao de rituais compulsivos, aumento de procura emergencial e grave comprometimento do bem-estar global.",
    patientIdentifier: "Sarah Mendes",
    proceduresSummary: [
      "entrevistas clinicas estruturadas com revisao longitudinal de 18 sessoes",
      "registro observacional de repertorio compulsivo, evitacao e impacto funcional",
      "analise de transcricao assistida e escalas seriadas de ansiedade e humor"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "rituais compulsivos de verificacao e neutralizacao",
      "insonia com hipervigilancia noturna",
      "ansiedade de saude com impacto ocupacional"
    ],
    rg: "33.481.221-8",
    specializedReferralReasons: {
      psiquiatra:
        "Persistencia de ansiedade de saude, insonia e necessidade de refinamento farmacologico exigem avaliacao psiquiatrica conjunta.",
      neurologista:
        "Queixas de hiperfoco corporal, cefaleia tensional e alteracoes atencionais justificam avaliacao neurologica diferencial.",
      nutricionista:
        "Regularidade alimentar pode melhorar adesao medicamentosa e reduzir flutuacoes vegetativas relacionadas a ansiedade.",
      "clinico-geral":
        "Necessita integracao clinica por somatizacao recorrente e repetidas buscas por exames."
    },
    susContext:
      "O esquema previamente disponivel no SUS foi utilizado entre 05/2024 e 11/2024 sem estabilidade clinica sustentada. O medicamento solicitado nao consta como alternativa padronizada efetiva para o perfil atual de resposta e tolerabilidade observado neste caso.",
    technicalJustification:
      "A manutencao de sertralina mostrou reducao objetiva da escalada ansiogena e melhor controle sobre a cadeia obsessiva, sendo imprescindivel para conter progressao sintomatica, evitar recaida funcional e sustentar adesao ao protocolo de exposicao.",
    treatmentDuration: "uso continuo, com reavaliacao a cada 8 semanas",
    requestedMedication: "Sertralina",
    requestedPosology: "50 mg ao dia"
  },
  "daniel-r": {
    accompanimentFrequency: "semanal",
    accompanimentStart: "17/03/2025",
    address: "Av. Nove de Julho, 880, Ribeirao Preto - SP",
    age: "38 anos",
    analysisSummary:
      "Quadro depressivo com insonia inicial e sensibilidade de absorcao alimentar, com ganho parcial de energia diurna, mas persistencia de labilidade vegetativa e fadiga ao final do dia.",
    birthDate: "03/12/1987",
    cityUf: "Ribeirao Preto - SP",
    cid: "F33.1 / F51.0",
    clinicalHistory:
      "Paciente em acompanhamento por episodio depressivo recorrente com insonia e queda importante de produtividade. Apresentou resposta incompleta a estrategias psicoterapicas isoladas e oscilacao importante em tentativas anteriores com antidepressivos.",
    cpf: "918.230.555-01",
    declarationPurpose:
      "Declaro a presenca do paciente em atendimento psicologico, sem finalidade diagnostica complementar neste documento.",
    judicialDemand:
      "Solicitacao de documento para demonstrar a necessidade de tratamento especializado e acompanhamento longitudinal por quadro depressivo de moderada intensidade.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "A ausencia de manutencao terapeutica aumenta risco de agravamento depressivo, piora do sono, queda ocupacional e prolongamento da incapacidade funcional.",
    patientIdentifier: "Daniel Rocha",
    proceduresSummary: [
      "entrevista clinica seriada com analise de humor e sono",
      "acompanhamento de adesao medicamentosa e resposta subjetiva",
      "comparacao longitudinal de sintomas depressivos e funcionamento laboral"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "insonia de inicio e despertares precoces",
      "anedonia e baixa energia diurna",
      "oscilacao vegetativa apos tomada em jejum"
    ],
    rg: "44.920.611-2",
    specializedReferralReasons: {
      psiquiatra:
        "Persistencia de sintomas depressivos residuais e necessidade de ajuste medicamentoso indicam co-manejo psiquiatrico.",
      nutricionista:
        "Padrao alimentar irregular interfere na absorcao e na estabilidade subjetiva do tratamento.",
      cardiologista:
        "Ativacao adrenergica e queixas somaticas justificam avaliacao cardiovascular de seguranca."
    },
    susContext:
      "As opcoes previamente utilizadas na rede publica nao alcancaram controle clinico adequado, com manutencao de fadiga, anedonia e desregulacao do sono. O esquema atual se mostra tecnicamente mais apropriado ao padrao de resposta do paciente.",
    technicalJustification:
      "A venlafaxina XR se mostrou necessaria para modular sintomas depressivos com ganho de energia diurna e melhor desempenho funcional, reduzindo o risco de cronificacao do episodio atual.",
    treatmentDuration: "12 meses, com revisao trimestral",
    requestedMedication: "Venlafaxina XR",
    requestedPosology: "75 mg ao dia"
  },
  "helena-v": {
    accompanimentFrequency: "semanal",
    accompanimentStart: "06/01/2025",
    address: "Rua Rio Solimoes, 92, Porto Alegre - RS",
    age: "41 anos",
    analysisSummary:
      "Paciente com hipervigilancia pos-traumatica, pesadelos e ativacao autonômica residual, com melhora parcial da intensidade onirica e permanencia de antecipacao corporal ao anoitecer.",
    birthDate: "21/07/1984",
    cityUf: "Porto Alegre - RS",
    cid: "F43.1",
    clinicalHistory:
      "Seguimento por transtorno de estresse pos-traumatico com pesadelos, evitacao e sintomas vegetativos intensos. Houve melhora parcial do sono, sem remissao completa da ativacao autonômica em contextos gatilho.",
    cpf: "774.118.220-13",
    declarationPurpose:
      "Declaro que a paciente realiza acompanhamento psicologico regular, com foco em estabilizacao e manejo de trauma.",
    judicialDemand:
      "Documento tecnico para subsidiar compreensao do impacto psicologico do trauma e da necessidade de continuidade assistencial.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "A interrupcao do manejo atual pode levar ao retorno de pesadelos intensos, piora do medo condicionado e maior comprometimento funcional.",
    patientIdentifier: "Helena Viana",
    proceduresSummary: [
      "entrevistas clinicas focadas em trauma e hipervigilancia",
      "analise de padrao de sono, pesadelos e ativacao autonômica",
      "registro longitudinal de evitacao e impacto funcional"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "pesadelos recorrentes",
      "hipervigilancia ao anoitecer",
      "evitacao e ativacao vegetativa"
    ],
    rg: "51.388.992-0",
    specializedReferralReasons: {
      psiquiatra:
        "Persistencia de sintomas pos-traumaticos e revisao de hipervigilancia residual exigem avaliacao psiquiatrica.",
      cardiologista:
        "Necessidade de monitorar pressao arterial e tolerabilidade hemodinamica do esquema noturno."
    },
    susContext:
      "As abordagens previamente disponiveis nao foram suficientes para conter pesadelos recorrentes e hipervigilancia, justificando manutencao do esquema atual em co-manejo.",
    technicalJustification:
      "A associacao em curso mostrou ganho na intensidade dos pesadelos e melhora parcial do sono, sendo necessaria para prevenir reativacao traumatica e manter o processo psicoterapico.",
    treatmentDuration: "uso continuo enquanto houver atividade clinica relevante",
    requestedMedication: "Prazosin",
    requestedPosology: "1 mg a noite"
  },
  "marcus-a": {
    accompanimentFrequency: "semanal",
    accompanimentStart: "11/11/2024",
    address: "Alameda das Acacias, 604, Curitiba - PR",
    age: "36 anos",
    analysisSummary:
      "Quadro bipolar em manutencao com boa resposta ao litio, exigindo vigilancia laboratorial, controle circadiano e integracao entre sintomas residuais de insonia e risco de descompensacao do humor.",
    birthDate: "09/04/1990",
    cityUf: "Curitiba - PR",
    cid: "F31.8",
    clinicalHistory:
      "Paciente com transtorno bipolar tipo II, historico de oscilacao de humor, insonia e reatividade a privacao de sono. Apresentou resposta parcial a esquemas anteriores, com necessidade de estabilizacao sustentada e monitoramento biologico.",
    cpf: "102.441.998-30",
    declarationPurpose:
      "Declaro a realizacao de seguimento psicologico regular para manejo de adesao, sono e sinais precoces de descompensacao do humor.",
    judicialDemand:
      "Documento tecnico para fins judiciais, com enfoque na necessidade de seguimento especializado e de manutencao do esquema farmacologico com exames seriados.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "Sem estabilizacao medicamentosa e seguimento laboratorial, ha risco de recaida do humor, insonia grave, prejuizo funcional e possibilidade de descompensacao com necessidade de atendimento de urgencia.",
    patientIdentifier: "Marcus Almeida",
    proceduresSummary: [
      "entrevistas clinicas seriadas com rastreio de humor e sono",
      "monitoramento de adesao e sinais precoces de descompensacao",
      "integracao de dados laboratoriais e marcadores de tolerabilidade"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "insonia residual com risco de virada apos privacao de sono",
      "necessidade de adesao rigorosa ao esquema",
      "monitoramento de tolerabilidade biologica"
    ],
    rg: "12.788.502-6",
    specializedReferralReasons: {
      psiquiatra:
        "Necessita co-manejo para ajuste fino do esquema estabilizador e vigilancia de recaida.",
      nefrologista:
        "Uso de litio com necessidade de seguimento de creatinina, ureia, TFG e seguranca renal.",
      endocrinologista:
        "Uso prolongado de litio requer vigilancia de TSH e T4 livre por risco de disfuncao tireoidiana.",
      cardiologista:
        "Contexto de estabilizacao do humor com insonia residual e possibilidade de revisao de ECG e seguranca clinica.",
      "clinico-geral":
        "Integracao de exames seriados e comorbidades clinicas associadas ao uso cronico do estabilizador."
    },
    susContext:
      "O manejo anterior com alternativas padronizadas nao sustentou estabilidade suficiente e cursou com efeitos adversos. O esquema atualmente indicado, com lamotrigina adjuvante e monitoramento do litio, nao esta integralmente acessivel na rede local na forma e ritmo de seguimento exigidos pelo caso.",
    technicalJustification:
      "O uso de litio com monitoramento estruturado e da lamotrigina como adjuvante e imprescindivel para reduzir risco de recaida depressiva, proteger funcionalidade e manter janela terapeutica segura.",
    treatmentDuration: "uso continuo, com revisao psiquiatrica e laboratorial regular",
    requestedMedication: "Lamotrigina",
    requestedPosology: "100 mg ao dia, associada a litio 900 mg/dia"
  },
  "rafael-n": {
    accompanimentFrequency: "semanal",
    accompanimentStart: "18/02/2025",
    address: "Rua Montevideo, 411, Belo Horizonte - MG",
    age: "29 anos",
    analysisSummary:
      "Persistem falhas de regulacao atencional e prorrogacao de sono, com melhora parcial de iniciacao diurna e dificuldade de sustentacao funcional no periodo noturno.",
    birthDate: "27/01/1997",
    cityUf: "Belo Horizonte - MG",
    cid: "F90.0",
    clinicalHistory:
      "Paciente com prejuizo executivo, variabilidade atencional e atraso cronico de sono, em seguimento para organizacao funcional e ajuste de rotina.",
    cpf: "028.557.134-41",
    declarationPurpose:
      "Declaro que o paciente permanece em seguimento psicologico regular para manejo de atencao, regulacao emocional e rotina.",
    judicialDemand:
      "Documento tecnico solicitado para descrever impacto funcional do quadro atencional e a necessidade de acompanhamento multiprofissional.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "Sem seguimento especializado, ha risco de agravamento do prejuizo funcional, queda ocupacional e piora da desorganizacao do sono.",
    patientIdentifier: "Rafael Nogueira",
    proceduresSummary: [
      "entrevistas clinicas focadas em funcoes executivas",
      "revisao longitudinal de adesao e rotinas de sono",
      "analise de distractibilidade e derramamento cognitivo noturno"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "distracao sustentada e mudanca constante de foco",
      "procrastinacao de sono",
      "derramamento emocional ao final do dia"
    ],
    rg: "55.118.632-2",
    specializedReferralReasons: {
      psiquiatra:
        "Persistencia de sintomas atencionais e necessidade de revisao farmacologica orientam avaliacao psiquiatrica.",
      neurologista:
        "Queixas cognitivas, sobrecarga noturna e necessidade de avaliacao diferencial justificam consulta neurologica.",
      "terapeuta-ocupacional":
        "Necessita treino funcional de rotina, planejamento e manejo de demandas executivas."
    },
    susContext:
      "O caso exige manejo integrado de TDAH adulto e regulacao do sono, com necessidade de continuidade especializada para evitar piora funcional.",
    technicalJustification:
      "A atomoxetina mostrou resposta parcial sobre iniciacao e organizacao, sendo relevante para reduzir prejuizo ocupacional e dar suporte ao trabalho psicoterapico.",
    treatmentDuration: "12 meses, com ajuste por resposta clinica",
    requestedMedication: "Atomoxetina",
    requestedPosology: "40 mg ao dia"
  },
  "bruno-l": {
    accompanimentFrequency: "duas vezes por semana",
    accompanimentStart: "08/01/2025",
    address: "Rua do Comercio, 49, Santos - SP",
    age: "32 anos",
    analysisSummary:
      "O caso evidencia dependencia quimica com padrao de binge alcoolico, uso de cocaina por encadeamento, oscilacao de craving e resposta parcial a estrategias de reducao de danos e suporte farmacologico.",
    birthDate: "25/08/1993",
    cityUf: "Santos - SP",
    cid: "F10.20 / F14.20",
    clinicalHistory:
      "Paciente em seguimento por uso problematico de alcool e cocaina, com episodios de binge, fissura noturna, piora do sono e risco elevado de uso solitario. O foco atual e reducao de danos, prevencao de overdose e reorganizacao funcional.",
    cpf: "620.117.704-56",
    declarationPurpose:
      "Declaro o comparecimento do paciente a atendimento psicologico voltado para reducao de danos e manejo de craving.",
    judicialDemand:
      "Documento solicitado para demonstrar gravidade do quadro de dependencia quimica, necessidade de cuidado continuado e suporte multiprofissional.",
    medicalRecipient: "Dr(a). Psiquiatra assistente",
    nonUseRisk:
      "Sem o esquema atual e sem monitoramento, ha risco de binge repetido, uso encadeado de cocaina, acidentes, agravamento psiquiatrico e grave comprometimento do bem-estar.",
    patientIdentifier: "Bruno Lima",
    proceduresSummary: [
      "entrevistas clinicas focadas em padrao de consumo, fissura e eventos de risco",
      "analise funcional de gatilhos e plano de reducao de danos",
      "seguimento de adesao medicamentosa e vigilancia de funcao hepatica"
    ],
    psychologistRecipient: "Psicologo(a) assistente",
    referralSymptoms: [
      "binge alcoolico e craving noturno",
      "risco de uso encadeado de cocaina",
      "piora de sono e impulsividade em contexto de fissura"
    ],
    rg: "40.237.115-3",
    specializedReferralReasons: {
      psiquiatra:
        "Dependencia quimica ativa, oscilacao de craving e risco de recaida grave demandam co-manejo psiquiatrico.",
      "clinico-geral":
        "Necessita vigilancia clinica integrada por risco de abstinencia, interacoes e comorbidades associadas ao uso.",
      nutricionista:
        "Regularidade alimentar e parte do plano de reducao de danos e melhora de tolerabilidade medicamentosa.",
      cardiologista:
        "Uso de cocaina e queixas vegetativas justificam avaliacao cardiovascular de seguranca."
    },
    susContext:
      "O paciente ja passou por orientacoes breves e tentativas descontinuas de tratamento em rede geral sem reducao suficiente do binge. A associacao com naltrexona, plano de seguranca e seguimento estruturado nao esta disponivel de forma integral na rede local.",
    technicalJustification:
      "A naltrexona e clinicamente indicada para reduzir craving, binge e risco de recaida grave, funcionando como suporte central em um caso no qual a reducao de danos e mais segura do que a interrupcao abrupta sem retaguarda.",
    treatmentDuration: "uso por ao menos 6 meses, com reavaliacao clinica e laboratorial",
    requestedMedication: "Naltrexona",
    requestedPosology: "50 mg ao dia"
  }
};

export function exportJudicialReportPdf(args: JudicialReportArgs) {
  const profile = getPatientProfile(args.patient);
  const clinician = CLINICIAN_PROFILES[args.issuerType];
  const documentType = args.psychologicalDocumentType ?? "laudo_pericial";
  const writer =
    args.issuerType === "psiquiatra"
      ? createWriter(
          "LAUDO MEDICO PARA JUDICIALIZACAO",
          `${profile.patientIdentifier} | Sessao ${args.session}`
        )
      : createWriter(
          getPsychologicalTitle(documentType),
          `${profile.patientIdentifier} | Sessao ${args.session}`
        );

  if (args.issuerType === "psiquiatra") {
    buildPsychiatricJudicialDocument(writer, args, profile, clinician);
    finalize(writer.doc, `laudo-judicial-psiquiatrico-${slugify(args.patient.name)}`);
    return;
  }

  buildPsychologicalJudicialDocument(writer, args, profile, clinician, documentType);
  finalize(writer.doc, `${documentType}-${slugify(args.patient.name)}`);
}

export function exportReferralReportPdf(args: ReferralReportArgs) {
  const profile = getPatientProfile(args.patient);
  const sourceDiscipline = args.sourceDiscipline ?? "psicologo";
  const targetSpecialty = args.targetSpecialty ?? "psiquiatra";
  const sourceClinician = CLINICIAN_PROFILES[sourceDiscipline];
  const symptomSummary =
    args.includeSymptoms === false
      ? "sofrimento psiquico com impacto funcional persistente"
      : profile.referralSymptoms.join(", ");
  const writer = createWriter(
    getReferralTitle(sourceDiscipline, targetSpecialty),
    `${profile.patientIdentifier} | ${getReferralTargetMeta(targetSpecialty).title}`
  );

  addSectionTitle(writer, `Ao(À) ${getReferralTargetMeta(targetSpecialty).title}`);
  addParagraph(
    writer,
    `Identificacao do paciente: ${profile.patientIdentifier}, ${profile.age}, CPF/RG ${profile.cpf} / ${profile.rg}.`
  );
  addParagraph(writer, "Prezado(a) colega,");

  if (sourceDiscipline === "psicologo" && targetSpecialty === "psiquiatra") {
    addParagraph(
      writer,
      `Declaro, para os devidos fins, que o(a) paciente acima citado(a) encontra-se em acompanhamento psicoterapico sob minha responsabilidade desde ${profile.accompanimentStart}, com frequencia ${profile.accompanimentFrequency}, apresentando adesao compativel com o plano terapeutico atual.`
    );
    addParagraph(
      writer,
      `Durante o processo terapeutico, observou-se quadro compativel com hipotese diagnostica de ${profile.cid}, caracterizado por:`
    );
    if (args.includeSymptoms !== false) {
      addBulletList(writer, profile.referralSymptoms);
    }
    addParagraph(
      writer,
      "Diante da persistencia e intensidade dos sintomas, que limitam progressos adicionais no processo psicoterapico, encaminho o(a) paciente para avaliacao psiquiatrica visando possivel intervencao medicamentosa e manejo conjunto do caso."
    );
  } else if (sourceDiscipline === "psiquiatra" && targetSpecialty === "psicologo") {
    addParagraph(
      writer,
      `Encaminho o(a) paciente acima, por mim avaliado(a) em consulta psiquiatrica longitudinal nesta plataforma, com diagnostico/hipotese diagnostica de ${profile.cid}.`
    );
    addParagraph(
      writer,
      `O caso apresenta ${symptomSummary}, com impacto funcional descrito como ${args.riskLabel.toLowerCase()} e escore atual de risco em ${args.riskScore}%.`
    );
    addParagraph(
      writer,
      "Considero fundamental a inclusao de acompanhamento psicoterapico para suporte emocional, reestruturacao cognitiva, manejo de fatores estressores e adesao ao tratamento."
    );
  } else {
    addParagraph(
      writer,
      `Encaminho o(a) paciente para avaliacao em ${getReferralTargetMeta(targetSpecialty).title}, considerando o quadro de ${profile.cid} e a necessidade de suporte especializado complementar.`
    );
    addParagraph(writer, getSpecialtyReason(profile, targetSpecialty));
  }

  if (args.includeDose) {
    addSectionTitle(writer, "Intervencao farmacologica em curso");
    addKeyValueRows(writer, [
      ["Esquema principal", `${args.patient.medications.primary.title} - ${args.patient.medications.primary.dose}`],
      ["Esquema adjunto", `${args.patient.medications.secondary.title} - ${args.patient.medications.secondary.dose}`],
      ["Janela PK / PD", `${args.patient.pharmacology.pharmacokinetic.value} | ${args.patient.pharmacology.pharmacodynamic.value}`]
    ]);
  }

  if (args.includeGenetics) {
    addSectionTitle(writer, "Farmacogenetica");
    addParagraph(
      writer,
      `${args.patient.genetics.gene}: ${args.patient.genetics.phenotype}. ${args.patient.genetics.summary}`
    );
  }

  if (args.includeLabs) {
    appendLabSection(writer, args.patient);
  }

  if (args.includeInteractions) {
    appendInteractionSection(writer, args.patient);
  }

  if (args.patient.harmReduction) {
    appendHarmReductionSection(writer, args.patient);
  }

  if (args.includeTranscript) {
    addSectionTitle(writer, "Extrato clinico de sessao");
    addParagraph(writer, args.transcriptExcerpt);
  }

  addParagraph(
    writer,
    "Coloco-me a disposicao para trocas de informacoes tecnicas e para manejo compartilhado do caso, respeitando o sigilo etico-profissional."
  );
  addSignatureBlock(writer, sourceClinician);
  finalize(writer.doc, `encaminhamento-${targetSpecialty}-${slugify(args.patient.name)}`);
}

function buildPsychiatricJudicialDocument(
  writer: Writer,
  args: JudicialReportArgs,
  profile: PatientDocumentProfile,
  clinician: ClinicianProfile
) {
  addSectionTitle(writer, "Ao Juizo competente da Vara Civel/Fazenda Publica");
  addSectionTitle(writer, "1. Identificacao do paciente");
  addKeyValueRows(writer, [
    ["Nome", profile.patientIdentifier],
    ["CPF", profile.cpf],
    ["Data de nascimento", profile.birthDate],
    ["Endereco", profile.address]
  ]);

  addSectionTitle(writer, "2. Diagnostico e fundamentacao tecnica");
  addKeyValueRows(writer, [
    ["Patologia / CID", profile.cid],
    ["Abordagem ativa", args.approachLabel],
    ["Frame clinico", args.clinicalFrame]
  ]);
  addParagraph(writer, profile.clinicalHistory);
  addParagraph(
    writer,
    `Justificativa tecnica: ${profile.technicalJustification} Escore atual de risco: ${args.riskScore}% (${args.riskLabel.toLowerCase()}).`
  );

  if (args.includeSusContext) {
    addSectionTitle(writer, "3. Ineficacia / indisponibilidade no SUS");
    addParagraph(writer, profile.susContext);
  }

  addSectionTitle(writer, "4. Riscos da nao utilizacao");
  addChecklist(writer, [
    {
      checked: args.patient.id === "bruno-l" || args.riskScore >= 65,
      label: "Risco de morte"
    },
    {
      checked: args.patient.id === "marcus-a",
      label: "Perda irreversivel de funcao organica"
    },
    {
      checked: true,
      label: "Grave comprometimento do bem-estar"
    }
  ]);

  if (args.includeRisks !== false) {
    addParagraph(writer, `Detalhamento: ${profile.nonUseRisk}`);
  }

  addSectionTitle(writer, "5. Prescricao");
  addKeyValueRows(writer, [
    ["Medicamento", profile.requestedMedication],
    ["Dosagem / posologia", profile.requestedPosology],
    ["Tempo de tratamento", profile.treatmentDuration]
  ]);

  if (args.includePharmacology) {
    addSectionTitle(writer, "6. Fundamentacao farmacocinetica e farmacodinamica");
    addParagraph(
      writer,
      `${args.patient.pharmacology.pharmacokinetic.label}: ${args.patient.pharmacology.pharmacokinetic.value}. ${args.patient.pharmacology.pharmacokinetic.detail}`
    );
    addParagraph(
      writer,
      `${args.patient.pharmacology.pharmacodynamic.label}: ${args.patient.pharmacology.pharmacodynamic.value}. ${args.patient.pharmacology.pharmacodynamic.detail}`
    );
  }

  if (args.includeGenetics) {
    addSectionTitle(writer, "7. Base farmacogenetica");
    addParagraph(
      writer,
      `${args.patient.genetics.gene}: ${args.patient.genetics.phenotype}. ${args.patient.genetics.summary}`
    );
  }

  if (args.includeLabs) {
    addSectionTitle(writer, "8. Exames e monitoramento obrigatorios");
    appendLabSection(writer, args.patient);
  }

  if (args.includeInteractions) {
    addSectionTitle(writer, "9. Interacoes e seguranca clinica");
    appendInteractionSection(writer, args.patient);
  }

  if (args.patient.harmReduction) {
    appendHarmReductionSection(writer, args.patient);
  }

  if (args.includeTranscript) {
    addSectionTitle(writer, "10. Extrato clinico relevante");
    addParagraph(writer, args.transcriptExcerpt);
  }

  addSectionTitle(writer, "11. Conclusao e assinatura");
  addParagraph(
    writer,
    "Declaro, sob as penas da lei, que as informacoes acima sao verdadeiras, tecnicamente fundamentadas e necessarias para preservacao da saude e da funcionalidade do paciente."
  );
  addEvidenceSeal(writer);
  addSignatureBlock(writer, clinician);
}

function buildPsychologicalJudicialDocument(
  writer: Writer,
  args: JudicialReportArgs,
  profile: PatientDocumentProfile,
  clinician: ClinicianProfile,
  documentType: PsychologicalDocumentType
) {
  switch (documentType) {
    case "laudo_pericial":
      addSectionTitle(writer, "1. Identificacao");
      addKeyValueRows(writer, [
        ["Profissional", `${clinician.name} - ${clinician.label} ${clinician.register}`],
        ["Interessado(a)", profile.patientIdentifier],
        ["Assunto / finalidade", profile.judicialDemand]
      ]);
      if (args.includeDemand !== false) {
        addSectionTitle(writer, "2. Descricao da demanda");
        addParagraph(writer, profile.judicialDemand);
        addParagraph(writer, profile.clinicalHistory);
      }
      if (args.includeProcedures !== false) {
        addSectionTitle(writer, "3. Procedimentos");
        addBulletList(writer, profile.proceduresSummary);
      }
      if (args.includeAnalysis !== false) {
        addSectionTitle(writer, "4. Analise");
        addParagraph(writer, profile.analysisSummary);
        addParagraph(
          writer,
          `Na sessao ${args.session}, o frame predominante foi ${args.clinicalFrame.toLowerCase()}, com escore de risco de ${args.riskScore}% e indicios consistentes de impacto funcional mantido.`
        );
      }
      addSectionTitle(writer, "5. Conclusao");
      addParagraph(
        writer,
        "Considera-se necessario o seguimento psicologico continuado e a manutencao do manejo multiprofissional, com indicacao de articulacao com a equipe medica sempre que houver oscilacao funcional relevante."
      );
      if (args.includeTranscript) {
        addParagraph(writer, `Extrato clinico de apoio: ${args.transcriptExcerpt}`);
      }
      addEvidenceSeal(writer);
      addSignatureBlock(writer, clinician);
      return;

    case "parecer":
      addSectionTitle(writer, "1. Identificacao");
      addKeyValueRows(writer, [
        ["Parecerista", `${clinician.name} - ${clinician.label} ${clinician.register}`],
        ["Interessado(a)", profile.patientIdentifier],
        ["Objeto", "Analise tecnica complementar de material psicologico/pericial"]
      ]);
      addSectionTitle(writer, "2. Objeto do parecer");
      addParagraph(
        writer,
        "Este parecer psicologico foi elaborado com base no material clinico assistencial, dados longitudinais e na consistencia entre a demanda judicial e o funcionamento psicologico observado no acompanhamento."
      );
      if (args.includeAnalysis !== false) {
        addSectionTitle(writer, "3. Analise tecnica");
        addParagraph(writer, profile.analysisSummary);
      }
      addSectionTitle(writer, "4. Manifestacao conclusiva");
      addParagraph(
        writer,
        "Do ponto de vista psicologico, ha coerencia entre a gravidade relatada, o impacto funcional e a necessidade de continuidade assistencial, sem que isso substitua a autonomia decisoria do juizo."
      );
      addSignatureBlock(writer, clinician);
      return;

    case "relatorio":
      addSectionTitle(writer, "1. Identificacao");
      addKeyValueRows(writer, [
        ["Profissional", `${clinician.name} - ${clinician.label} ${clinician.register}`],
        ["Paciente", profile.patientIdentifier],
        ["Inicio do acompanhamento", profile.accompanimentStart]
      ]);
      addSectionTitle(writer, "2. Descricao do acompanhamento");
      addParagraph(
        writer,
        `O(a) paciente encontra-se em acompanhamento psicologico desde ${profile.accompanimentStart}, com frequencia ${profile.accompanimentFrequency}.`
      );
      addSectionTitle(writer, "3. Sintese clinica");
      addParagraph(writer, profile.analysisSummary);
      if (args.includeTranscript) {
        addParagraph(writer, `Extrato clinico de apoio: ${args.transcriptExcerpt}`);
      }
      addSectionTitle(writer, "4. Conclusao e encaminhamentos");
      addParagraph(
        writer,
        "Mantem-se indicacao de continuidade do acompanhamento psicologico e da articulacao multiprofissional conforme necessidade do caso."
      );
      addSignatureBlock(writer, clinician);
      return;

    case "atestado":
      addSectionTitle(writer, "Atestado psicologico");
      addParagraph(
        writer,
        `Atesto, para os devidos fins, que ${profile.patientIdentifier}, CPF ${profile.cpf}, encontra-se em acompanhamento psicologico regular desde ${profile.accompanimentStart}, demandando continuidade assistencial em virtude de sofrimento psiquico clinicamente relevante.`
      );
      addParagraph(
        writer,
        "Este documento nao se destina a detalhamento diagnostico ampliado, servindo apenas para certificacao de necessidade de seguimento e justificativa assistencial."
      );
      addSignatureBlock(writer, clinician);
      return;

    case "declaracao":
      addSectionTitle(writer, "Declaracao psicologica");
      addParagraph(writer, profile.declarationPurpose);
      addParagraph(
        writer,
        `O acompanhamento ocorre desde ${profile.accompanimentStart}, com frequencia ${profile.accompanimentFrequency}, junto a ${clinician.name}.`
      );
      addSignatureBlock(writer, clinician);
      return;
  }
}

function appendLabSection(writer: Writer, patient: PatientRecord) {
  if (!patient.labs) {
    addParagraph(
      writer,
      "Nao ha protocolo laboratorial especifico parametrizado para o esquema atual."
    );
    return;
  }

  addParagraph(
    writer,
    `Medicamento monitorado: ${patient.labs.medication}. Baseline: ${patient.labs.baseline}`
  );
  addParagraph(writer, `Inicio: ${patient.labs.startSchedule}`);
  addParagraph(writer, `Manutencao: ${patient.labs.maintenanceSchedule}`);
  addBulletList(
    writer,
    patient.labs.tests.map(
      (test) =>
        `${test.name} | frequencia: ${test.frequency} | ultimo resultado: ${test.lastResult} | objetivo: ${test.purpose}`
    )
  );
  addParagraph(writer, `Sinais de alerta: ${patient.labs.alertSymptoms}`);
  addParagraph(writer, `Interacao critica: ${patient.labs.interactionNote}`);
}

function appendInteractionSection(writer: Writer, patient: PatientRecord) {
  if (!patient.interactions?.length) {
    addParagraph(writer, "Nao ha interacoes ou sinergias parametrizadas para este caso.");
    return;
  }

  addBulletList(
    writer,
    patient.interactions.map(
      (interaction) =>
        `${interaction.title} com ${interaction.counterpart}: ${interaction.effect}. Conduta: ${interaction.guidance}. Intensidade: ${interaction.severity}.`
    )
  );
}

function appendHarmReductionSection(writer: Writer, patient: PatientRecord) {
  if (!patient.harmReduction) {
    return;
  }

  addSectionTitle(writer, "Reducao de danos e dependencia quimica");
  addKeyValueRows(writer, [
    ["Estagio atual", patient.harmReduction.currentStage],
    ["Substancias ativas", patient.harmReduction.activeSubstances.join(", ")],
    ["Rede de apoio", patient.harmReduction.supportNetwork]
  ]);
  addParagraph(writer, `Sinais criticos: ${patient.harmReduction.redFlags}`);
  addBulletList(writer, patient.harmReduction.goals.map((goal) => `Meta: ${goal}`));
  addBulletList(
    writer,
    patient.harmReduction.safetyPlan.map((step) => `Plano de seguranca: ${step}`)
  );
}

function createWriter(title: string, subtitle: string) {
  const doc = new jsPDF({
    format: "a4",
    unit: "mm"
  });

  doc.setFillColor(10, 14, 20);
  doc.rect(0, 0, PAGE_WIDTH, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, MARGIN_X, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.4);
  doc.setTextColor(190, 201, 219);
  doc.text(subtitle, MARGIN_X, 20);

  return {
    doc,
    title,
    y: 32
  };
}

function addSectionTitle(writer: Writer, title: string) {
  ensurePageSpace(writer, 12);
  writer.doc.setFont("helvetica", "bold");
  writer.doc.setFontSize(11.2);
  writer.doc.setTextColor(20, 26, 37);
  writer.doc.text(title, MARGIN_X, writer.y);
  writer.y += 6.2;
}

function addParagraph(writer: Writer, text: string) {
  const lines = writer.doc.splitTextToSize(text, CONTENT_WIDTH);
  ensurePageSpace(writer, lines.length * LINE_HEIGHT + 2);
  writer.doc.setFont("helvetica", "normal");
  writer.doc.setFontSize(10.2);
  writer.doc.setTextColor(36, 43, 52);
  writer.doc.text(lines, MARGIN_X, writer.y);
  writer.y += lines.length * LINE_HEIGHT + 1.2;
}

function addKeyValueRows(writer: Writer, rows: Array<[string, string]>) {
  rows.forEach(([label, value]) => {
    const lines = writer.doc.splitTextToSize(value, CONTENT_WIDTH - 40);
    ensurePageSpace(writer, lines.length * LINE_HEIGHT + 2);
    writer.doc.setFont("helvetica", "bold");
    writer.doc.setFontSize(10.1);
    writer.doc.setTextColor(24, 31, 41);
    writer.doc.text(`${label}:`, MARGIN_X, writer.y);
    writer.doc.setFont("helvetica", "normal");
    writer.doc.text(lines, MARGIN_X + 40, writer.y);
    writer.y += lines.length * LINE_HEIGHT + 1;
  });
  writer.y += 0.5;
}

function addBulletList(writer: Writer, items: string[]) {
  items.forEach((item) => {
    const lines = writer.doc.splitTextToSize(item, CONTENT_WIDTH - 7);
    ensurePageSpace(writer, lines.length * LINE_HEIGHT + 1);
    writer.doc.setFont("helvetica", "normal");
    writer.doc.setFontSize(10.1);
    writer.doc.setTextColor(36, 43, 52);
    writer.doc.text("-", MARGIN_X + 1.5, writer.y);
    writer.doc.text(lines, MARGIN_X + 6, writer.y);
    writer.y += lines.length * LINE_HEIGHT + 0.8;
  });
  writer.y += 0.5;
}

function addChecklist(
  writer: Writer,
  items: Array<{
    checked: boolean;
    label: string;
  }>
) {
  addBulletList(
    writer,
    items.map((item) => `${item.checked ? "[x]" : "[ ]"} ${item.label}`)
  );
}

function addEvidenceSeal(writer: Writer) {
  ensurePageSpace(writer, 16);
  writer.doc.setDrawColor(41, 57, 78);
  writer.doc.setFillColor(244, 247, 252);
  writer.doc.roundedRect(MARGIN_X, writer.y, CONTENT_WIDTH, 12, 2, 2, "FD");
  writer.doc.setFont("helvetica", "bold");
  writer.doc.setFontSize(9.4);
  writer.doc.setTextColor(37, 48, 63);
  writer.doc.text(
    "Human-Curated Data: Validated by Neuroscientists & Clinical Psychologists",
    MARGIN_X + 4,
    writer.y + 7.7
  );
  writer.y += 15;
}

function addSignatureBlock(writer: Writer, clinician: ClinicianProfile) {
  ensurePageSpace(writer, 20);
  writer.doc.setDrawColor(140, 149, 164);
  writer.doc.line(MARGIN_X, writer.y + 2, MARGIN_X + 70, writer.y + 2);
  writer.y += 7;
  writer.doc.setFont("helvetica", "normal");
  writer.doc.setFontSize(10.2);
  writer.doc.setTextColor(36, 43, 52);
  writer.doc.text(`${clinician.cityUf}, ${formatLongDate()}.`, MARGIN_X, writer.y);
  writer.y += 6;
  writer.doc.setFont("helvetica", "bold");
  writer.doc.text(clinician.name, MARGIN_X, writer.y);
  writer.y += 5;
  writer.doc.setFont("helvetica", "normal");
  writer.doc.text(`${clinician.roleLine} | ${clinician.label} ${clinician.register}`, MARGIN_X, writer.y);
  writer.y += 4;
}

function ensurePageSpace(writer: Writer, spaceNeeded: number) {
  if (writer.y + spaceNeeded < PAGE_HEIGHT - MARGIN_BOTTOM) {
    return;
  }

  writer.doc.addPage();
  writer.y = MARGIN_TOP;
  writer.doc.setFont("helvetica", "bold");
  writer.doc.setFontSize(11);
  writer.doc.setTextColor(20, 26, 37);
  writer.doc.text(writer.title, MARGIN_X, writer.y);
  writer.y += 8;
}

function finalize(doc: jsPDF, filename: string) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(223, 228, 237);
    doc.line(MARGIN_X, PAGE_HEIGHT - 11, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    doc.setTextColor(94, 104, 120);
    doc.text("Adler AI | Base cientifica rastreavel", MARGIN_X, PAGE_HEIGHT - 6.6);
    doc.text(`Pagina ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN_X - 20, PAGE_HEIGHT - 6.6);
  }

  doc.save(`${filename}.pdf`);
}

function getPatientProfile(patient: PatientRecord) {
  return (
    PATIENT_PROFILES[patient.id] ?? {
      accompanimentFrequency: "semanal",
      accompanimentStart: "01/01/2025",
      address: "Endereco clinico nao parametrizado",
      age: "idade nao parametrizada",
      analysisSummary: patient.diagnosis,
      birthDate: "01/01/1990",
      cityUf: "Sao Paulo - SP",
      cid: "CID em parametrizacao",
      clinicalHistory: patient.diagnosis,
      cpf: "000.000.000-00",
      declarationPurpose:
        "Declaro acompanhamento psicologico regular, para os devidos fins.",
      judicialDemand:
        "Documento tecnico solicitado para subsidiar necessidade assistencial.",
      medicalRecipient: "Dr(a). medico(a) assistente",
      nonUseRisk: "Ausencia de manutencao terapeutica com potencial de agravamento clinico.",
      patientIdentifier: patient.name,
      proceduresSummary: [
        "entrevista clinica",
        "revisao longitudinal do caso",
        "analise assistida por dados"
      ],
      psychologistRecipient: "Psicologo(a) assistente",
      referralSymptoms: [patient.focus, patient.diagnosis],
      rg: "00.000.000-0",
      specializedReferralReasons: {},
      susContext:
        "Contexto de indisponibilidade no SUS ainda nao parametrizado para este caso.",
      technicalJustification:
        "O manejo assistencial atual e considerado clinicamente necessario para preservar funcionalidade e reduzir risco de agravamento.",
      treatmentDuration: "conforme reavaliacao clinica",
      requestedMedication: patient.medications.primary.title,
      requestedPosology: patient.medications.primary.dose
    }
  );
}

function getPsychologicalTitle(documentType: PsychologicalDocumentType) {
  switch (documentType) {
    case "laudo_pericial":
      return "LAUDO PSICOLOGICO / PERICIAL";
    case "parecer":
      return "PARECER PSICOLOGICO";
    case "relatorio":
      return "RELATORIO PSICOLOGICO";
    case "atestado":
      return "ATESTADO PSICOLOGICO";
    case "declaracao":
      return "DECLARACAO PSICOLOGICA";
  }
}

function getReferralTitle(
  source: ReferralSourceDiscipline,
  target: ReferralSpecialty
) {
  if (source === "psicologo" && target === "psiquiatra") {
    return "RELATORIO DE ENCAMINHAMENTO PARA AVALIACAO PSIQUIATRICA";
  }
  if (source === "psiquiatra" && target === "psicologo") {
    return "RELATORIO DE ENCAMINHAMENTO MEDICO";
  }
  return "RELATORIO DE ENCAMINHAMENTO PARA AVALIACAO ESPECIALIZADA";
}

function getReferralTargetMeta(target: ReferralSpecialty) {
  const option = REFERRAL_SPECIALTY_OPTIONS.find((item) => item.value === target);
  return {
    title: option?.label ?? "Especialista assistente"
  };
}

function getSpecialtyReason(
  profile: PatientDocumentProfile,
  target: ReferralSpecialty
) {
  return (
    profile.specializedReferralReasons[target] ??
    "Ha necessidade de avaliacao complementar para refinamento diagnostico e construcao de conduta compartilhada."
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatLongDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());
}
