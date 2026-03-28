import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type IncomeSource = "project" | "subscription" | "one-time" | "other";

export interface Project {
  id: string;
  name: string;
  clientName: string;
  source: IncomeSource;
  amount: number;
  date: string;
  isPaid: boolean;
  description?: string;
}

export interface TaxPayment {
  id: string;
  amount: number;
  date: string;
  period: string;
  isPaid: boolean;
}

interface AppContextType {
  projects: Project[];
  taxPayments: TaxPayment[];
  addProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTaxPayment: (t: Omit<TaxPayment, "id">) => void;
  markTaxPaid: (id: string) => void;
  totalIncome: number;
  paidIncome: number;
  unpaidIncome: number;
  taxRate: number;
  estimatedTax: number;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_PROJECTS = "@selfemployed_projects";
const STORAGE_KEY_TAX = "@selfemployed_tax";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRaw, tRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_PROJECTS),
          AsyncStorage.getItem(STORAGE_KEY_TAX),
        ]);
        if (pRaw) setProjects(JSON.parse(pRaw));
        if (tRaw) setTaxPayments(JSON.parse(tRaw));
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProjects = useCallback(async (list: Project[]) => {
    setProjects(list);
    await AsyncStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
  }, []);

  const saveTax = useCallback(async (list: TaxPayment[]) => {
    setTaxPayments(list);
    await AsyncStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(list));
  }, []);

  const addProject = useCallback(
    (p: Omit<Project, "id">) => {
      const newList = [{ ...p, id: generateId() }, ...projects];
      saveProjects(newList);
    },
    [projects, saveProjects]
  );

  const updateProject = useCallback(
    (id: string, p: Partial<Project>) => {
      const newList = projects.map((proj) =>
        proj.id === id ? { ...proj, ...p } : proj
      );
      saveProjects(newList);
    },
    [projects, saveProjects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      saveProjects(projects.filter((p) => p.id !== id));
    },
    [projects, saveProjects]
  );

  const addTaxPayment = useCallback(
    (t: Omit<TaxPayment, "id">) => {
      const newList = [{ ...t, id: generateId() }, ...taxPayments];
      saveTax(newList);
    },
    [taxPayments, saveTax]
  );

  const markTaxPaid = useCallback(
    (id: string) => {
      saveTax(
        taxPayments.map((t) => (t.id === id ? { ...t, isPaid: true } : t))
      );
    },
    [taxPayments, saveTax]
  );

  const paidIncome = projects
    .filter((p) => p.isPaid)
    .reduce((s, p) => s + p.amount, 0);
  const unpaidIncome = projects
    .filter((p) => !p.isPaid)
    .reduce((s, p) => s + p.amount, 0);
  const totalIncome = paidIncome + unpaidIncome;
  const taxRate = 0.04;
  const estimatedTax = Math.round(paidIncome * taxRate);

  return (
    <AppContext.Provider
      value={{
        projects,
        taxPayments,
        addProject,
        updateProject,
        deleteProject,
        addTaxPayment,
        markTaxPaid,
        totalIncome,
        paidIncome,
        unpaidIncome,
        taxRate,
        estimatedTax,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
