import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  type ApiOrder,
  type ApiBudget,
  type ApiAppointment,
  type ApiService,
} from "@/lib/api";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export type ServiceStatus =
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "cancelado";

export type BudgetStatus = "aguardando" | "aprovado" | "recusado";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "cancelado"
  | "realizado";

export interface ServiceOrder {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  serviceId: string;
  description: string;
  status: ServiceStatus;
  preferredDate: string;
  preferredTime: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  cost: number;
  profit: number;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  serviceId: string;
  description: string;
  baseValue: number;
  profitMargin: number;
  value: number;
  observations?: string;
  status: BudgetStatus;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  serviceId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rules?: string;
  active: boolean;
}

// ─── MAPAS DE STATUS (API inglês → PT) ────────────────────────────────────────
const ORDER_STATUS_MAP: Record<ApiOrder["status"], ServiceStatus> = {
  pending: "pendente",
  in_progress: "em_andamento",
  done: "concluido",
  cancelled: "cancelado",
};

const ORDER_STATUS_REVERSE: Record<ServiceStatus, ApiOrder["status"]> = {
  pendente: "pending",
  em_andamento: "in_progress",
  concluido: "done",
  cancelado: "cancelled",
};

const BUDGET_STATUS_MAP: Record<ApiBudget["status"], BudgetStatus> = {
  pending: "aguardando",
  approved: "aprovado",
  rejected: "recusado",
};

const BUDGET_STATUS_REVERSE: Record<BudgetStatus, ApiBudget["status"]> = {
  aguardando: "pending",
  aprovado: "approved",
  recusado: "rejected",
};

const APPT_STATUS_MAP: Record<ApiAppointment["status"], AppointmentStatus> = {
  scheduled: "agendado",
  confirmed: "confirmado",
  cancelled: "cancelado",
  done: "realizado",
};

const APPT_STATUS_REVERSE: Record<AppointmentStatus, ApiAppointment["status"]> =
  {
    agendado: "scheduled",
    confirmado: "confirmed",
    cancelado: "cancelled",
    realizado: "done",
  };

// ─── CONVERSORES ──────────────────────────────────────────────────────────────
function mapOrder(o: ApiOrder): ServiceOrder {
  const price = Number((o as any).price ?? 0);
  const cost = Number((o as any).cost ?? 0);
  return {
    id: String(o.id),
    clientId: String(o.clientId),
    clientName: o.clientName ?? "Cliente",
    serviceType: o.serviceName ?? "Serviço",
    serviceId: String(o.serviceId),
    description: o.description ?? "",
    status: ORDER_STATUS_MAP[o.status] ?? "pendente",
    preferredDate: o.preferredDate ?? "",
    preferredTime: o.preferredTime ?? "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    price,
    cost,
    profit: price - cost,
  };
}

function mapBudget(b: ApiBudget): Budget {
  const baseValue = Number(b.baseValue) || 0;
  const profitMargin = Number(b.profitMargin) || 0;
  const finalValue = Number(b.finalValue) || 0;
  const value =
    finalValue > 0 ? finalValue : baseValue + baseValue * (profitMargin / 100);
  return {
    id: String(b.id),
    clientId: String(b.clientId),
    clientName: b.clientName ?? "Cliente",
    serviceType: b.serviceName ?? "Serviço",
    serviceId: String(b.serviceId),
    description: b.observations ?? "",
    baseValue,
    profitMargin,
    value,
    observations: b.observations ?? undefined,
    status: BUDGET_STATUS_MAP[b.status] ?? "aguardando",
    createdAt: b.createdAt,
  };
}

function mapAppointment(a: ApiAppointment): Appointment {
  return {
    id: String(a.id),
    clientId: String(a.clientId),
    clientName: a.clientName ?? "Cliente",
    serviceType: a.serviceName ?? "Serviço",
    serviceId: String(a.serviceId),
    date: a.date,
    time: a.time,
    status: APPT_STATUS_MAP[a.status] ?? "agendado",
    notes: a.notes ?? undefined,
  };
}

function mapService(s: ApiService): Service {
  return {
    id: String(s.id),
    name: s.name,
    description: s.description,
    basePrice: Number(s.basePrice) || 0,
    rules: s.rules ?? undefined,
    active: s.active,
  };
}

// ─── TIPO DO CONTEXTO ─────────────────────────────────────────────────────────
interface DataContextType {
  serviceOrders: ServiceOrder[];
  budgets: Budget[];
  appointments: Appointment[];
  services: Service[];
  isLoading: boolean;

  updateServiceOrderStatus: (id: string, status: ServiceStatus) => Promise<void>;
  updateServiceOrderFinance: (
    id: string,
    price: number,
    cost: number
  ) => Promise<void>;
  createOrder: (data: {
    clientId: number;
    serviceId: number;
    description?: string;
    preferredDate?: string;
    preferredTime?: string;
  }) => Promise<ServiceOrder>;

  updateBudgetStatus: (id: string, status: BudgetStatus) => Promise<void>;
  createBudget: (data: {
    clientId: number;
    serviceId: number;
    baseValue: number;
    profitMargin?: number;
    observations?: string;
  }) => Promise<Budget>;

  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus
  ) => Promise<void>;
  createAppointment: (data: {
    clientId: number;
    serviceId: number;
    date: string;
    time: string;
    notes?: string;
  }) => Promise<Appointment>;

  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersRaw, budgetsRaw, apptsRaw, svcsRaw] = await Promise.all([
        api.getOrders().catch(() => [] as ApiOrder[]),
        api.getBudgets().catch(() => [] as ApiBudget[]),
        api.getAppointments().catch(() => [] as ApiAppointment[]),
        api.getServices().catch(() => [] as ApiService[]),
      ]);
      setServiceOrders(ordersRaw.map(mapOrder));
      setBudgets(budgetsRaw.map(mapBudget));
      setAppointments(apptsRaw.map(mapAppointment));
      setServices(svcsRaw.map(mapService));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Operações de Ordens ────────────────────────────────────────────────
  const updateServiceOrderStatus = useCallback(
    async (id: string, status: ServiceStatus) => {
      const updated = await api.updateOrder(Number(id), {
        status: ORDER_STATUS_REVERSE[status],
      });
      setServiceOrders((prev) =>
        prev.map((o) => (o.id === id ? mapOrder(updated) : o))
      );
    },
    []
  );

  const updateServiceOrderFinance = useCallback(
    async (id: string, price: number, cost: number) => {
      const updated = await api.updateOrder(Number(id), {
        price,
        cost,
      } as any);
      setServiceOrders((prev) =>
        prev.map((o) => (o.id === id ? mapOrder(updated) : o))
      );
    },
    []
  );

  const createOrder = useCallback(
    async (data: {
      clientId: number;
      serviceId: number;
      description?: string;
      preferredDate?: string;
      preferredTime?: string;
    }) => {
      const created = await api.createOrder(data);
      const mapped = mapOrder(created);
      setServiceOrders((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  // ── Operações de Orçamentos ────────────────────────────────────────────
  const updateBudgetStatus = useCallback(
    async (id: string, status: BudgetStatus) => {
      const updated = await api.updateBudget(Number(id), {
        status: BUDGET_STATUS_REVERSE[status],
      });
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? mapBudget(updated) : b))
      );
    },
    []
  );

  const createBudget = useCallback(
    async (data: {
      clientId: number;
      serviceId: number;
      baseValue: number;
      profitMargin?: number;
      observations?: string;
    }) => {
      const created = await api.createBudget(data);
      const mapped = mapBudget(created);
      setBudgets((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  // ── Operações de Agendamentos ──────────────────────────────────────────
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const updated = await api.updateAppointment(Number(id), {
        status: APPT_STATUS_REVERSE[status],
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? mapAppointment(updated) : a))
      );
    },
    []
  );

  const createAppointment = useCallback(
    async (data: {
      clientId: number;
      serviceId: number;
      date: string;
      time: string;
      notes?: string;
    }) => {
      const created = await api.createAppointment(data);
      const mapped = mapAppointment(created);
      setAppointments((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
        serviceOrders,
        budgets,
        appointments,
        services,
        isLoading,
        updateServiceOrderStatus,
        updateServiceOrderFinance,
        createOrder,
        updateBudgetStatus,
        createBudget,
        updateAppointmentStatus,
        createAppointment,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
