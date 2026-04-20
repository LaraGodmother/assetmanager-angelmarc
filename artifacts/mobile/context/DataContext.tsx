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

// ─── TYPES ─────────────────────────────────────────────
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

// ─── MAPS ─────────────────────────────────────────────
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

// ─── MAPPER ───────────────────────────────────────────
function mapOrder(o: ApiOrder): ServiceOrder {
  const price = Number(o.price ?? 0);
  const cost = Number(o.cost ?? 0);

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

// ─── CONTEXT ─────────────────────────────────────────
interface DataContextType {
  serviceOrders: ServiceOrder[];
  budgets: Budget[];
  appointments: Appointment[];
  services: Service[];

  isLoading: boolean;

  updateServiceOrderStatus: (
    id: string,
    status: ServiceStatus
  ) => Promise<void>;

  updateServiceOrderFinance: (
    id: string,
    price: number,
    cost: number
  ) => Promise<void>;

  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// ─── PROVIDER ─────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orders, buds, apps, svcs] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getBudgets().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getServices().catch(() => []),
      ]);

      setServiceOrders(orders.map(mapOrder));
      setBudgets(buds);
      setAppointments(apps);
      setServices(svcs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      });

      setServiceOrders((prev) =>
        prev.map((o) => (o.id === id ? mapOrder(updated) : o))
      );
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
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}