import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, MapPin, Ticket } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { useAuth } from "@portal/session/useAuth";
import type { EventDetailRecord, PaymentRecord } from "@portal/domains/account/types";

export default function PatientEventDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { eventId = "" } = useParams();
  const [detail, setDetail] = useState<EventDetailRecord | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!auth.user || !eventId) return;
    const nextDetail = await auth.accountAdapter.getEvent(auth.user.id, eventId);
    const nextPayment = nextDetail.myRegistration?.paymentId
      ? await auth.accountAdapter.getPayment(
          auth.user.id,
          nextDetail.myRegistration.paymentId,
        )
      : null;
    setDetail(nextDetail);
    setPayment(nextPayment);
  }

  useEffect(() => {
    let active = true;
    if (!auth.user || !eventId) return;
    const userId = auth.user.id;
    void auth.accountAdapter.getEvent(userId, eventId).then(async (nextDetail) => {
      const nextPayment = nextDetail.myRegistration?.paymentId
        ? await auth.accountAdapter.getPayment(
            userId,
            nextDetail.myRegistration.paymentId,
          )
        : null;
      if (!active) return;
      setDetail(nextDetail);
      setPayment(nextPayment);
    });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user, eventId]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  async function handleRegister() {
    if (!auth.user || !auth.actingProfileId || !eventId) return;
    setBusy(true);
    try {
      await auth.accountAdapter.registerForEvent(auth.user.id, eventId, auth.actingProfileId);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!auth.user || !auth.actingProfileId || !eventId) return;
    setBusy(true);
    try {
      await auth.accountAdapter.cancelEventRegistration(
        auth.user.id,
        eventId,
        auth.actingProfileId,
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout fullName={auth.user?.fullName ?? "Patient"} onLogout={handleLogout}>
      {!detail ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 text-sm text-[#111214]/50">
          Chargement de l'événement...
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5B1112]/55">
                  {detail.event.audience === "both" ? "Événement mixte" : "Événement patient"}
                </p>
                <h1 className="mt-2 font-serif text-3xl text-[#111214]">{detail.event.title}</h1>
                <p className="mt-3 text-sm leading-6 text-[#111214]/60">
                  {detail.event.description}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[#5B1112]/8 px-4 py-3 text-sm font-medium text-[#5B1112]">
                {detail.myRegistration?.status ?? "Non inscrit"}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/70 p-4 text-sm text-[#111214]/62">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <CalendarDays size={16} />
                  <span className="font-medium">Quand</span>
                </div>
                <p className="mt-2">{new Date(detail.event.startsAt).toLocaleString("fr-FR")}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/70 p-4 text-sm text-[#111214]/62">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <MapPin size={16} />
                  <span className="font-medium">Où</span>
                </div>
                <p className="mt-2">{detail.event.locationLabel ?? "En ligne"}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/70 p-4 text-sm text-[#111214]/62">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <Ticket size={16} />
                  <span className="font-medium">Accès</span>
                </div>
                <p className="mt-2">
                  {detail.event.requiresPayment
                    ? `${detail.event.priceAmount.toLocaleString("fr-FR")} ${detail.event.currency}`
                    : "Gratuit"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111214]">Inscription</h2>
            {detail.myRegistration ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-[#111214]/62">
                  Statut actuel : <strong>{detail.myRegistration.status}</strong>
                </p>
                {detail.myTicket ? (
                  <div className="rounded-[1.5rem] bg-[#5B1112]/7 p-4 text-sm text-[#111214]/65">
                    Ticket : <strong>{detail.myTicket.code}</strong>
                  </div>
                ) : null}
                {payment?.checkoutUrl && payment.status !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => window.open(payment.checkoutUrl, "_blank", "noopener")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#111214] px-4 py-2 text-sm font-medium text-white"
                  >
                    <CreditCard size={16} />
                    Payer via NabooPay
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCancel()}
                  className="rounded-full border border-[#111214]/12 px-4 py-2 text-sm font-medium text-[#111214]/70"
                >
                  Annuler l'inscription
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRegister()}
                className="mt-4 rounded-full bg-[#5B1112] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#5B1112]/20"
              >
                S'inscrire
              </button>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
