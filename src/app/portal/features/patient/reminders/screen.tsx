import type { ScreeningCadence, ScreeningReminder } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const CADENCE_OPTIONS: ScreeningCadence[] = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
];

const CADENCE_LABELS: Record<ScreeningCadence, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semiannual: "Semestriel",
  annual: "Annuel",
};

export default function PatientRemindersScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ScreeningReminder[]>([]);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId) return;
    auth.accountAdapter
      .listScreeningReminders(auth.user.id, auth.actingProfileId)
      .then(setReminders);
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";

  const updateReminder = async (
    reminder: ScreeningReminder,
    patch: Partial<Pick<ScreeningReminder, "status" | "cadence">>,
  ) => {
    if (!auth.user || !auth.actingProfileId) return;
    const updated = await auth.accountAdapter.updateScreeningReminder({
      actorUserId: auth.user.id,
      profileId: auth.actingProfileId,
      reminderId: reminder.id,
      patch,
    });
    setReminders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
            Rappels & dépistage
          </p>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            Vos prochaines échéances de suivi.
          </h1>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <BellRing size={17} className="text-[#5B1112]" />
            <h2 className="font-serif text-[1.5rem] text-[#111214]">Rappels actifs</h2>
          </div>
          <div className="mt-5 space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#111214]">{reminder.screeningType}</p>
                    <p className="mt-1 text-sm text-[#111214]/58">
                      Prochaine échéance : {new Date(reminder.nextDueAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={reminder.cadence}
                      onChange={(event) =>
                        void updateReminder(reminder, {
                          cadence: event.currentTarget.value as ScreeningCadence,
                        })
                      }
                      className="rounded-full border border-[#111214]/10 bg-white px-3 py-1.5 text-xs text-[#111214]/68"
                    >
                      {CADENCE_OPTIONS.map((cadence) => (
                        <option key={cadence} value={cadence}>
                          {CADENCE_LABELS[cadence]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        void updateReminder(reminder, {
                          status:
                            reminder.status === "completed" ? "active" : "completed",
                        })
                      }
                      className="rounded-full border border-[#111214]/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111214]/68"
                    >
                      {reminder.status === "completed" ? "Réactiver" : "Marquer fait"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
