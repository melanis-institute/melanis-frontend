import type { AccountAdapter } from "@portal/domains/account/adapter.types";
import { BackendAccountAdapter } from "@portal/domains/account/backendAccountAdapter";
import { mockAccountAdapter } from "@portal/domains/account/mockAccountAdapter";
import type { AppointmentAdapter } from "@portal/domains/appointments/adapter.types";
import { BackendAppointmentAdapter } from "@portal/domains/appointments/backendAppointmentAdapter";
import { mockAppointmentAdapter } from "@portal/domains/appointments/mockAppointmentAdapter";
import type { AuthAdapter } from "@portal/domains/auth/adapter.types";
import { BackendAuthAdapter } from "@portal/domains/auth/backendAuthAdapter";
import { mockAuthAdapter } from "@portal/domains/auth/mockAuthAdapter";

const apiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const authAdapter: AuthAdapter = apiUrl
  ? new BackendAuthAdapter(apiUrl)
  : mockAuthAdapter;

export const accountAdapter: AccountAdapter = apiUrl
  ? new BackendAccountAdapter(apiUrl)
  : mockAccountAdapter;

export const appointmentAdapter: AppointmentAdapter = apiUrl
  ? new BackendAppointmentAdapter(apiUrl)
  : mockAppointmentAdapter;
