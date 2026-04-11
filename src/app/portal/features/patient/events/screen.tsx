import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { useAuth } from "@portal/session/useAuth";
import type { EventRecord, EventRegistrationRecord } from "@portal/domains/account/types";

export default function PatientEventsScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    let active = true;
    void Promise.all([
      auth.accountAdapter.listEvents(auth.user.id),
      auth.accountAdapter.listMyEventRegistrations(auth.user.id),
    ]).then(([nextEvents, nextRegistrations]) => {
      if (!active) return;
      setEvents(nextEvents);
      setRegistrations(nextRegistrations);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  const registrationsByEventId = new Map(
    registrations.map((item) => [item.eventId, item]),
  );

  return (
    <DashboardLayout fullName={auth.user?.fullName ?? "Patient"} onLogout={handleLogout}>
      <div className="space-y-6 py-2">
        <section className="rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#111214]/35">
            Événements
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#111214]">
            Rencontres, ateliers et sessions Melanis
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#111214]/60">
            Retrouvez les événements patients et les sessions mixtes. Les inscriptions
            payantes restent pilotées par la même couche de facturation que le reste du
            produit.
          </p>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 text-sm text-[#111214]/50">
            Chargement des événements...
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {events.map((event) => {
            const registration = registrationsByEventId.get(event.id);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(`/patient-flow/auth/events/${event.id}`)}
                className="rounded-[2rem] border border-white/70 bg-white/70 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5B1112]/55">
                      {event.audience === "both" ? "Mixte" : "Patient"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#111214]">{event.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#111214]/58">{event.summary}</p>
                  </div>
                  <div className="rounded-full bg-[#5B1112]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B1112]">
                    {registration?.status ?? "À découvrir"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#111214]/58 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-[#5B1112]/55" />
                    <span>{new Date(event.startsAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#5B1112]/55" />
                    <span>{event.locationLabel ?? "En ligne"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {registration?.ticketId ? (
                      <>
                        <Ticket size={16} className="text-[#5B1112]/55" />
                        <span>Ticket généré</span>
                      </>
                    ) : (
                      <>
                        <Users size={16} className="text-[#5B1112]/55" />
                        <span>
                          {event.requiresPayment
                            ? `${event.priceAmount.toLocaleString("fr-FR")} ${event.currency}`
                            : "Gratuit"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
