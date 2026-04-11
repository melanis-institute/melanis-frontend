import { useEffect, useState } from "react";
import { CreditCard, FileText, Receipt } from "lucide-react";
import { useNavigate } from "react-router";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { useAuth } from "@portal/session/useAuth";
import type { BillingOverviewRecord } from "@portal/domains/account/types";

export default function PatientBillingScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<BillingOverviewRecord | null>(null);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId) return;
    let active = true;
    void auth.accountAdapter
      .getBillingOverview(auth.user.id, auth.actingProfileId)
      .then((nextOverview) => {
        if (!active) return;
        setOverview(nextOverview);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  return (
    <DashboardLayout fullName={auth.user?.fullName ?? "Patient"} onLogout={handleLogout}>
      {!overview ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 text-sm text-[#111214]/50">
          Chargement de la facturation...
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#111214]/35">
              Facturation
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#111214]">Devis, factures et paiements</h1>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/75 p-4">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <Receipt size={16} />
                  <span className="text-sm font-medium">À régler</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#111214]">
                  {overview.outstandingTotal.toLocaleString("fr-FR")} XOF
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/75 p-4">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <FileText size={16} />
                  <span className="text-sm font-medium">Factures</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#111214]">{overview.invoices.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#FEF0D5]/75 p-4">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <CreditCard size={16} />
                  <span className="text-sm font-medium">Paiements</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#111214]">
                  {overview.recentPayments.length}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111214]">Factures</h2>
              <div className="mt-4 space-y-3">
                {overview.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-[1.5rem] border border-[#111214]/8 bg-white/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#111214]">{invoice.title}</p>
                        <p className="mt-1 text-sm text-[#111214]/55">
                          {invoice.totalAmount.toLocaleString("fr-FR")} {invoice.currency}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#5B1112]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]">
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111214]">Paiements récents</h2>
              <div className="mt-4 space-y-3">
                {overview.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-[1.5rem] border border-[#111214]/8 bg-white/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#111214]">
                          {payment.amount.toLocaleString("fr-FR")} {payment.currency}
                        </p>
                        <p className="mt-1 text-sm text-[#111214]/55">
                          {payment.providerKey} · {payment.method}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-[#111214]/7 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111214]/65">
                          {payment.status}
                        </span>
                        {payment.checkoutUrl && payment.status !== "paid" ? (
                          <button
                            type="button"
                            onClick={() => window.open(payment.checkoutUrl, "_blank", "noopener")}
                            className="text-sm font-medium text-[#5B1112]"
                          >
                            Reprendre le paiement
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
