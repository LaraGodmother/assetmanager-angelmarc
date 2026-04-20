import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ServiceStatus =
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "cancelado";
export type BudgetStatus = "aguardando" | "aprovado" | "recusado";
export type AppointmentStatus = "agendado" | "confirmado" | "cancelado" | "realizado";

export interface ServiceOrder {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  description: string;
  status: ServiceStatus;
  preferredDate: string;
  preferredTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  description: string;
  value?: number;
  status: BudgetStatus;
  createdAt: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
}

interface DataContextType {
  serviceOrders: ServiceOrder[];
  budgets: Budget[];
  appointments: Appointment[];
  isLoading: boolean;
  createServiceOrder: (
    data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt" | "status">
  ) => Promise<void>;
  createBudgetRequest: (
    data: Omit<Budget, "id" | "createdAt" | "status" | "value">
  ) => Promise<void>;
  updateServiceOrderStatus: (id: string, status: ServiceStatus) => Promise<void>;
  updateBudgetStatus: (id: string, status: BudgetStatus, value?: number, notes?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getClientOrders: (clientId: string) => ServiceOrder[];
  getClientBudgets: (clientId: string) => Budget[];
  getClientAppointments: (clientId: string) => Appointment[];
}

const DataContext = createContext<DataContextType | null>(null);

const ORDERS_KEY = "@servicospro_orders";
const BUDGETS_KEY = "@servicospro_budgets";
const APPOINTMENTS_KEY = "@servicospro_appointments";

const SERVICE_TYPES = [
  "Elétrica",
  "CFTV / Câmeras",
  "Refrigeração",
  "Automação",
  "Manutenção Geral",
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function seedData() {
  const now = new Date();

  const orders: ServiceOrder[] = [
    {
      id: generateId(),
      clientId: "client-seed-1",
      clientName: "Carlos Mendes",
      serviceType: "Elétrica",
      description: "Instalação de quadro de distribuição residencial",
      status: "em_andamento",
      preferredDate: now.toISOString().split("T")[0],
      preferredTime: "09:00",
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      clientId: "client-seed-2",
      clientName: "Ana Rodrigues",
      serviceType: "CFTV / Câmeras",
      description: "Instalação de câmeras de segurança na empresa",
      status: "pendente",
      preferredDate: new Date(now.getTime() + 2 * 86400000)
        .toISOString()
        .split("T")[0],
      preferredTime: "14:00",
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      clientId: "client-seed-3",
      clientName: "Pedro Silva",
      serviceType: "Refrigeração",
      description: "Manutenção preventiva do ar-condicionado",
      status: "concluido",
      preferredDate: new Date(now.getTime() - 3 * 86400000)
        .toISOString()
        .split("T")[0],
      preferredTime: "10:00",
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
  ];

  const budgets: Budget[] = [
    {
      id: generateId(),
      clientId: "client-seed-1",
      clientName: "Carlos Mendes",
      serviceType: "Automação",
      description: "Automação residencial completa com controle de iluminação",
      value: 8500,
      status: "aprovado",
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      notes: "Incluindo 3 anos de garantia",
    },
    {
      id: generateId(),
      clientId: "client-seed-4",
      clientName: "Lucia Ferreira",
      serviceType: "Manutenção Geral",
      description: "Serviços gerais de manutenção predial",
      status: "aguardando",
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: generateId(),
      clientId: "client-seed-2",
      clientName: "Ana Rodrigues",
      serviceType: "CFTV / Câmeras",
      description: "Sistema de monitoramento para loja comercial",
      value: 3200,
      status: "aguardando",
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
  ];

  const appointments: Appointment[] = [
    {
      id: generateId(),
      clientId: "client-seed-1",
      clientName: "Carlos Mendes",
      serviceType: "Elétrica",
      date: now.toISOString().split("T")[0],
      time: "09:00",
      status: "confirmado",
    },
    {
      id: generateId(),
      clientId: "client-seed-2",
      clientName: "Ana Rodrigues",
      serviceType: "CFTV / Câmeras",
      date: new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0],
      time: "14:00",
      status: "agendado",
    },
    {
      id: generateId(),
      clientId: "client-seed-5",
      clientName: "Roberto Alves",
      serviceType: "Refrigeração",
      date: new Date(now.getTime() + 4 * 86400000).toISOString().split("T")[0],
      time: "11:00",
      status: "agendado",
    },
  ];

  return { orders, budgets, appointments };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [ordersRaw, budgetsRaw, appointmentsRaw] = await Promise.all([
        AsyncStorage.getItem(ORDERS_KEY),
        AsyncStorage.getItem(BUDGETS_KEY),
        AsyncStorage.getItem(APPOINTMENTS_KEY),
      ]);

      if (!ordersRaw && !budgetsRaw && !appointmentsRaw) {
        const seed = seedData();
        setServiceOrders(seed.orders);
        setBudgets(seed.budgets);
        setAppointments(seed.appointments);
        await Promise.all([
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(seed.orders)),
          AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(seed.budgets)),
          AsyncStorage.setItem(
            APPOINTMENTS_KEY,
            JSON.stringify(seed.appointments)
          ),
        ]);
      } else {
        setServiceOrders(ordersRaw ? JSON.parse(ordersRaw) : []);
        setBudgets(budgetsRaw ? JSON.parse(budgetsRaw) : []);
        setAppointments(appointmentsRaw ? JSON.parse(appointmentsRaw) : []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createServiceOrder = useCallback(
    async (
      data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt" | "status">
    ) => {
      const newOrder: ServiceOrder = {
        ...data,
        id: generateId(),
        status: "pendente",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...serviceOrders, newOrder];
      setServiceOrders(updated);
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    },
    [serviceOrders]
  );

  const createBudgetRequest = useCallback(
    async (
      data: Omit<Budget, "id" | "createdAt" | "status" | "value">
    ) => {
      const newBudget: Budget = {
        ...data,
        id: generateId(),
        status: "aguardando",
        createdAt: new Date().toISOString(),
      };
      const updated = [...budgets, newBudget];
      setBudgets(updated);
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updated));
    },
    [budgets]
  );

  const updateServiceOrderStatus = useCallback(
    async (id: string, status: ServiceStatus) => {
      const updated = serviceOrders.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
      );
      setServiceOrders(updated);
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    },
    [serviceOrders]
  );

  const updateBudgetStatus = useCallback(
    async (id: string, status: BudgetStatus, value?: number, notes?: string) => {
      const updated = budgets.map((b) =>
        b.id === id ? { ...b, status, ...(value !== undefined ? { value } : {}), ...(notes ? { notes } : {}) } : b
      );
      setBudgets(updated);
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updated));
    },
    [budgets]
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await loadData();
  }, [loadData]);

  const getClientOrders = useCallback(
    (clientId: string) => serviceOrders.filter((o) => o.clientId === clientId),
    [serviceOrders]
  );

  const getClientBudgets = useCallback(
    (clientId: string) => budgets.filter((b) => b.clientId === clientId),
    [budgets]
  );

  const getClientAppointments = useCallback(
    (clientId: string) =>
      appointments.filter((a) => a.clientId === clientId),
    [appointments]
  );

  return (
    <DataContext.Provider
      value={{
        serviceOrders,
        budgets,
        appointments,
        isLoading,
        createServiceOrder,
        createBudgetRequest,
        updateServiceOrderStatus,
        updateBudgetStatus,
        refreshData,
        getClientOrders,
        getClientBudgets,
        getClientAppointments,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

export { SERVICE_TYPES };
