import type { AuthAdapter } from "./adapter";
import type { AuthFlowContext, AuthSession, AuthUser } from "./types";
import type { AccountAdapter } from "../account/adapter.types";
import type { AppointmentAdapter } from "../appointments/adapter.types";
import type {
  ConsentSnapshot,
  PatientProfileRecord,
} from "../account/types";
import type { UserRole } from "./roles";

export interface AuthContextValue {
  adapter: AuthAdapter;
  accountAdapter: AccountAdapter;
  appointmentAdapter: AppointmentAdapter;
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isAccountLoading: boolean;
  flowContext: AuthFlowContext | null;
  profiles: PatientProfileRecord[];
  actingProfileId: string | null;
  actingProfile: PatientProfileRecord | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  consentSnapshot: ConsentSnapshot;
  login: (nextSession: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
  refreshAccountData: () => Promise<void>;
  refreshConsentSnapshot: (profileId?: string | null) => Promise<void>;
  setActingProfile: (profileId: string | null) => Promise<void>;
  clearActingProfile: () => void;
  setActiveRole: (role: UserRole) => void;
  clearActiveRole: () => void;
  setFlowContext: (context: AuthFlowContext | null) => void;
  clearBookingFlowContext: () => void;
  resolvePostAuthRoute: (context?: AuthFlowContext | null) => string;
}
