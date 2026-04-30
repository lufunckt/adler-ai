import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren
} from "react";

export type ClinicalApproach =
  | "psychiatry"
  | "cbt"
  | "schema"
  | "psychoanalysis"
  | "couples"
  | "generalist"
  | "systemic";
export type ShellTab =
  | "map"
  | "evolution"
  | "meds"
  | "exams"
  | "tests"
  | "session";

type AdlerShellContextValue = {
  activeTab: ShellTab;
  approach: ClinicalApproach;
  hasContractedGeneticTest: boolean;
  isRecording: boolean;
  selectedPatientId: string;
  setActiveTab: (value: ShellTab) => void;
  setApproach: (value: ClinicalApproach) => void;
  setHasContractedGeneticTest: (value: boolean) => void;
  setSelectedPatientId: (value: string) => void;
  setSelectedSession: (value: number) => void;
  selectedSession: number;
  toggleRecording: () => void;
};

const AdlerShellContext = createContext<AdlerShellContextValue | null>(null);

export function AdlerShellProvider({ children }: PropsWithChildren) {
  const [approach, setApproach] = useState<ClinicalApproach>("schema");
  const [activeTab, setActiveTab] = useState<ShellTab>("map");
  const [hasContractedGeneticTest, setHasContractedGeneticTest] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("sarah-m");
  const [selectedSession, setSelectedSession] = useState(18);

  return (
    <AdlerShellContext.Provider
      value={{
        approach,
        activeTab,
        hasContractedGeneticTest,
        isRecording,
        selectedPatientId,
        setApproach,
        setActiveTab,
        setHasContractedGeneticTest,
        setSelectedPatientId,
        setSelectedSession,
        selectedSession,
        toggleRecording: () => setIsRecording((current) => !current)
      }}
    >
      {children}
    </AdlerShellContext.Provider>
  );
}

export function useAdlerShell() {
  const context = useContext(AdlerShellContext);

  if (!context) {
    throw new Error("useAdlerShell must be used inside AdlerShellProvider.");
  }

  return context;
}
