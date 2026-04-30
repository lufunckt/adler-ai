import type { ClinicalApproach } from "../context/AdlerShellContext";

export type EvidenceSource = {
  href: string;
  source: string;
  title: string;
};

const APA_DSM: EvidenceSource = {
  source: "APA / DSM-5-TR",
  title: "DSM-5-TR framework and Section II diagnostic organization",
  href: "https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/DSM-5-TR/APA-DSM5TR-TheOrganizationofDSM.pdf"
};

const NICE_GAD: EvidenceSource = {
  source: "NICE CG113",
  title: "Generalised anxiety disorder and panic disorder in adults: management",
  href: "https://www.nice.org.uk/guidance/cg113/resources/nice-updates-guidance-on-generalised-anxiety-disorder"
};

const NICE_OCD: EvidenceSource = {
  source: "NICE CG31",
  title: "Obsessive-compulsive disorder and body dysmorphic disorder: treatment",
  href: "https://www.nice.org.uk/guidance/cg31"
};

const CPIC_SSRI: EvidenceSource = {
  source: "CPIC 2023",
  title:
    "Guideline for serotonin reuptake inhibitors and CYP2D6, CYP2C19, CYP2B6, SLC6A4, and HTR2A",
  href: "https://files.cpicpgx.org/data/guideline/publication/serotonin_reuptake_inhibitor_antidepressants/2023/37032427.pdf"
};

const PANDA_TRIAL: EvidenceSource = {
  source: "Lancet Psychiatry",
  title:
    "PANDA trial: clinical effectiveness of sertraline in primary care",
  href: "https://pubmed.ncbi.nlm.nih.gov/31543474/"
};

const LANCET_META: EvidenceSource = {
  source: "Lancet",
  title:
    "Comparative efficacy and acceptability of 21 antidepressant drugs: network meta-analysis",
  href: "https://pubmed.ncbi.nlm.nih.gov/29477251/"
};

export function getEvidenceSources(approach: ClinicalApproach) {
  if (approach === "cbt") {
    return [APA_DSM, NICE_GAD, NICE_OCD, PANDA_TRIAL];
  }

  if (approach === "psychoanalysis") {
    return [APA_DSM, NICE_OCD, NICE_GAD, PANDA_TRIAL];
  }

  if (approach === "schema") {
    return [APA_DSM, NICE_OCD, NICE_GAD, PANDA_TRIAL];
  }

  if (approach === "couples" || approach === "generalist" || approach === "systemic") {
    return [APA_DSM, NICE_GAD, NICE_OCD, PANDA_TRIAL];
  }

  return [APA_DSM, CPIC_SSRI, LANCET_META, NICE_GAD, PANDA_TRIAL];
}
