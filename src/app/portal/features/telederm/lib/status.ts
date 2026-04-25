import type { AsyncCaseStatus, PatientRecordEventType } from "@portal/domains/account/types";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileClock,
  Inbox,
  type LucideIcon,
} from "lucide-react";

export const TELEDERM_STATUS_LABELS: Record<AsyncCaseStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  in_review: "En revue",
  waiting_for_patient: "En attente patient",
  patient_replied: "Réponse patient",
  responded: "Répondu",
  closed: "Clôturé",
};

export const TELEDERM_STATUS_STYLES: Record<
  AsyncCaseStatus,
  { tone: string; icon: LucideIcon }
> = {
  draft: { tone: "bg-[#111214]/6 text-[#111214]/58", icon: CircleDashed },
  submitted: { tone: "bg-[#5B1112]/10 text-[#5B1112]", icon: Inbox },
  in_review: { tone: "bg-[#00415E]/10 text-[#00415E]", icon: FileClock },
  waiting_for_patient: { tone: "bg-amber-100 text-amber-800", icon: AlertCircle },
  patient_replied: { tone: "bg-[#00415E]/10 text-[#00415E]", icon: Clock3 },
  responded: { tone: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  closed: { tone: "bg-[#111214]/8 text-[#111214]/56", icon: CheckCircle2 },
};

export function formatTeledermDate(value?: string) {
  if (!value) return "Non daté";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function teledermTimelineTone(type: PatientRecordEventType) {
  if (type === "telederm_case_submitted") return "Soumis";
  if (type === "telederm_case_claimed") return "Pris en charge";
  if (type === "telederm_more_info_requested") return "Action requise";
  if (type === "telederm_patient_replied") return "Patient";
  if (type === "telederm_response_published") return "Réponse";
  if (type === "telederm_case_closed") return "Clos";
  return "Suivi";
}
