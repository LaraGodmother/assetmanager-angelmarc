import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, type ApiOrder, type ApiBudget, type ApiAppointment, type ApiService } from "@/lib/api";

// ─── Status types (mapped from API English → app Portuguese display) ──────────
export type ServiceStatus = "pendente" | "em_andamento" | "concluido" | "cancelado";
export type BudgetStatus = "aguardando" | "aprovado" | "recusado";
export type AppointmentStatus = "agendado" | "confirmado" | "cancelado" | "realizado";

// ─── App-level model types ────────────────────────────────────────────────────
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
  value?: number;
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

// ─── Mapping helpers ──────────────────────────────────────────────────────────
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

function mapOrder(o: ApiOrder): ServiceOrder {
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
  };
}

function mapBudget(b: ApiBudget): Budget {
  return {
    id: String(b.id),
    clientId: String(b.clientId),
    clientName: b.clientName ?? "Cliente",
    serviceType: b.serviceName ?? "Serviço",
    serviceId: String(b.serviceId),
    description: b.observations ?? "",
    baseValue: Number(b.baseValue),
    profitMargin: Number(b.profitMargin),
    value: Number(b.finalValue),
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
    basePrice: Number(s.basePrice),
    rules: s.rules ?? undefined,
    active: s.active,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface DataContextType {
  serviceOrders: ServiceOrder[];
  budgets: Budget[];
  appointments: Appointment[];
  services: Service[];
  isLoading: boolean;
  createServiceOrder: (data: {
    clientId: string;
    serviceId: string;
    description?: string;
    preferredDate?: string;
    preferredTime?: string;
  }) => Promise<void>;
  createBudgetRequest: (data: {
    clientId: string;
    serviceId: string;
    baseValue: number;
    profitMargin?: number;
    observations?: string;
  }) => Promise<void>;
  updateServiceOrderStatus: (id: string, status: ServiceStatus) => Promise<void>;
  updateBudgetStatus: (
    id: string,
    status: BudgetStatus,
    value?: number,
    notes?: string
  ) => Promise<void>;
  refreshData: () => Promise<void>;
  getClientOrders: (clientId: string) => ServiceOrder[];
  getClientBudgets: (clientId: string) => Budget[];
  getClientAppointments: (clientId: string) => Appointment[];
}

const DataContext = createContext<DataContextType | null>(null);

export const SERVICE_TYPES = [
  "Elétrica",
  "CFTV / Câmeras",
  "Refrigeração",
  "Automação",
  "Manutenção Geral",
];

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
    } catch (err) {
      console.error("DataContext loadData error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createServiceOrder = useCallback(
    async (data: {
      clientId: string;
      serviceId: string;
      description?: string;
      preferredDate?: string;
      preferredTime?: string;
    }) => {
      const order = await api.createOrder({
        clientId: Number(data.clientId),
        serviceId: Number(data.serviceId),
        description: data.description,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
      });
      setServiceOrders((prev) => [...prev, mapOrder(order)]);
    },
    []
  );

  const createBudgetRequest = useCallback(
    async (data: {
      clientId: string;
      serviceId: string;
      baseValue: number;
      profitMargin?: number;
      observations?: string;
    }) => {
      const budget = await api.createBudget({
        clientId: Number(data.clientId),
        serviceId: Number(data.serviceId),
        baseValue: data.baseValue,
        profitMargin: data.profitMargin ?? 0,
        observations: data.observations,
      });
      setBudgets((prev) => [...prev, mapBudget(budget)]);
    },
    []
  );

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

  const updateBudgetStatus = useCallback(
    async (id: string, status: BudgetStatus, value?: number, notes?: string) => {
      const payload: any = { status: BUDGET_STATUS_REVERSE[status] };
      if (notes !== undefined) payload.observations = notes;
      const updated = await api.updateBudget(Number(id), payload);
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? mapBudget(updated) : b))
      );
    },
    []
  );

  const refreshData = useCallback(async () => {
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
    (clientId: string) => appointments.filter((a) => a.clientId === clientId),
    [appointments]
  );

  return (
    <DataContext.Provider
      value={{
        serviceOrders,
        budgets,
        appointments,
        services,
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
