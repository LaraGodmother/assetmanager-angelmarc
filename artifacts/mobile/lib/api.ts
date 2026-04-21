const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.origin + "/api"
    : "https://0c4f309c-6b3c-4e2f-96e4-8aadfecef50e-00-3gjzlqu4remhq.picard.replit.dev/api");

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, phone?: string) =>
    request<{ user: ApiUser; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    }),

  // Services
  getServices: () => request<ApiService[]>("/services"),

  // Budgets
  getBudgets: (clientId?: number) =>
    request<ApiBudget[]>(clientId ? `/budgets?clientId=${clientId}` : "/budgets"),

  createBudget: (data: {
    clientId: number;
    serviceId: number;
    baseValue: number;
    profitMargin?: number;
    observations?: string;
  }) =>
    request<ApiBudget>("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBudget: (
    id: number,
    data: Partial<{ status: string; baseValue: number; profitMargin: number; finalValue: number; observations: string; paymentConditions: string }>
  ) =>
    request<ApiBudget>(`/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Appointments
  getAppointments: (clientId?: number) =>
    request<ApiAppointment[]>(
      clientId ? `/appointments?clientId=${clientId}` : "/appointments"
    ),

  createAppointment: (data: {
    clientId: number;
    serviceId: number;
    date: string;
    time: string;
    notes?: string;
  }) =>
    request<ApiAppointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAppointment: (id: number, data: Partial<{ status: string; date: string; time: string }>) =>
    request<ApiAppointment>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Orders
  getOrders: (clientId?: number) =>
    request<ApiOrder[]>(clientId ? `/orders?clientId=${clientId}` : "/orders"),

  createOrder: (data: {
    clientId: number;
    serviceId: number;
    description?: string;
    preferredDate?: string;
    preferredTime?: string;
    budgetId?: number;
  }) =>
    request<ApiOrder>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateOrder: (id: number, data: Partial<{ status: string; description: string; paymentMethod: string; amountPaid: number }>) =>
    request<ApiOrder>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Services CRUD
  createService: (data: {
    name: string;
    description: string;
    basePrice: number;
    profitMargin?: number;
    rules?: string;
    active?: boolean;
  }) =>
    request<ApiService>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateService: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      basePrice: number;
      profitMargin: number;
      rules: string;
      active: boolean;
    }>
  ) =>
    request<ApiService>(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteService: (id: number) =>
    request<{ success: boolean }>(`/services/${id}`, { method: "DELETE" }),

  // Clients
  getClients: () => request<ApiUser[]>("/clients"),

  updateClient: (id: number, data: Partial<{ name: string; phone: string; document: string; address: string }>) =>
    request<ApiUser>(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Auth
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Calendar Notes
  getCalendarNotes: () => request<ApiCalendarNote[]>("/calendar-notes"),

  saveCalendarNote: (date: string, note: string) =>
    request<ApiCalendarNote>("/calendar-notes", {
      method: "POST",
      body: JSON.stringify({ date, note }),
    }),

  deleteCalendarNote: (date: string) =>
    request<{ success: boolean }>(`/calendar-notes/${date}`, { method: "DELETE" }),
};

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client";
  phone?: string | null;
  document?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface ApiService {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  profitMargin: string;
  rules?: string | null;
  active: boolean;
  createdAt: string;
}

export interface ApiBudget {
  id: number;
  clientId: number;
  serviceId: number;
  baseValue: string;
  profitMargin: string;
  finalValue: string;
  observations?: string | null;
  paymentConditions?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  clientName?: string | null;
  clientPhone?: string | null;
  serviceName?: string | null;
}

export interface ApiAppointment {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  time: string;
  status: "scheduled" | "confirmed" | "cancelled" | "done";
  notes?: string | null;
  createdAt: string;
  clientName?: string | null;
  serviceName?: string | null;
}

export interface ApiOrder {
  id: number;
  budgetId?: number | null;
  clientId: number;
  serviceId: number;
  description?: string | null;
  status: "pending" | "in_progress" | "done" | "cancelled";
  preferredDate?: string | null;
  preferredTime?: string | null;
  paymentMethod?: string | null;
  amountPaid?: string | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string | null;
  serviceName?: string | null;
  serviceBasePrice?: string | null;
  serviceProfitMargin?: string | null;
}

export interface ApiCalendarNote {
  id: number;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
