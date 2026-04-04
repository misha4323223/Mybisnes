import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type IncomeSource = "project" | "subscription" | "one-time" | "other";
export type Currency = "RUB" | "USD" | "EUR" | "USDT";

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  source: IncomeSource;
  amount: number;
  date: string;
  isPaid: boolean;
  description?: string;
  receiptSent?: boolean;
  currency?: Currency;
  currencyAmount?: number;
  currencyRate?: number;
  isRecurring?: boolean;
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
  deleteTaxPayment: (id: string) => void;
  markTaxPaid: (id: string) => void;
  markTaxUnpaid: (id: string) => void;
  totalIncome: number;
  paidIncome: number;
  unpaidIncome: number;
  yearlyIncome: number;
  currentMonthIncome: number;
  currentMonthPaidIncome: number;
  taxRate: number;
  setTaxRate: (rate: number) => Promise<void>;
  estimatedTax: number;
  loading: boolean;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_PROJECTS = "@selfemployed_projects";
const STORAGE_KEY_TAX = "@selfemployed_tax";
const STORAGE_KEY_TAX_RATE = "@selfemployed_tax_rate";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([]);
  const [taxRate, setTaxRateState] = useState<number>(0.04);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRaw, tRaw, rRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_PROJECTS),
          AsyncStorage.getItem(STORAGE_KEY_TAX),
          AsyncStorage.getItem(STORAGE_KEY_TAX_RATE),
        ]);
        if (pRaw) setProjects(JSON.parse(pRaw));
        if (tRaw) setTaxPayments(JSON.parse(tRaw));
        if (rRaw) setTaxRateState(parseFloat(rRaw));
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

  const setTaxRate = useCallback(async (rate: number) => {
    setTaxRateState(rate);
    await AsyncStorage.setItem(STORAGE_KEY_TAX_RATE, String(rate));
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

  const deleteTaxPayment = useCallback(
    (id: string) => {
      saveTax(taxPayments.filter((t) => t.id !== id));
    },
    [taxPayments, saveTax]
  );

  const markTaxPaid = useCallback(
    (id: string) => {
      setTaxPayments((prev) => {
        const newList = prev.map((t) =>
          t.id === id ? { ...t, isPaid: true, date: new Date().toISOString() } : t
        );
        AsyncStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(newList));
        return newList;
      });
    },
    []
  );

  const markTaxUnpaid = useCallback(
    (id: string) => {
      setTaxPayments((prev) => {
        const newList = prev.map((t) =>
          t.id === id ? { ...t, isPaid: false } : t
        );
        AsyncStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(newList));
        return newList;
      });
    },
    []
  );

  const exportData = useCallback(async (): Promise<string> => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      taxPayments,
      taxRate,
    };
    return JSON.stringify(data, null, 2);
  }, [projects, taxPayments, taxRate]);

  const importData = useCallback(async (json: string): Promise<void> => {
    const data = JSON.parse(json);
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error("Неверный формат файла резервной копии");
    }
    await saveProjects(data.projects);
    if (data.taxPayments && Array.isArray(data.taxPayments)) {
      await saveTax(data.taxPayments);
    }
    if (data.taxRate && typeof data.taxRate === "number") {
      await setTaxRate(data.taxRate);
    }
  }, [saveProjects, saveTax, setTaxRate]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const paidIncome = projects
    .filter((p) => p.isPaid)
    .reduce((s, p) => s + p.amount, 0);
  const unpaidIncome = projects
    .filter((p) => !p.isPaid)
    .reduce((s, p) => s + p.amount, 0);
  const totalIncome = paidIncome + unpaidIncome;

  const yearlyIncome = projects
    .filter((p) => new Date(p.date).getFullYear() === currentYear)
    .reduce((s, p) => s + p.amount, 0);

  const currentMonthIncome = projects
    .filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((s, p) => s + p.amount, 0);

  const currentMonthPaidIncome = projects
    .filter((p) => {
      const d = new Date(p.date);
      return (
        p.isPaid &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    })
    .reduce((s, p) => s + p.amount, 0);

  const estimatedTax = Math.round(currentMonthPaidIncome * taxRate);

  return (
    <AppContext.Provider
      value={{
        projects,
        taxPayments,
        addProject,
        updateProject,
        deleteProject,
        addTaxPayment,
        deleteTaxPayment,
        markTaxPaid,
        markTaxUnpaid,
        totalIncome,
        paidIncome,
        unpaidIncome,
        yearlyIncome,
        currentMonthIncome,
        currentMonthPaidIncome,
        taxRate,
        setTaxRate,
        estimatedTax,
        loading,
        exportData,
        importData,
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
