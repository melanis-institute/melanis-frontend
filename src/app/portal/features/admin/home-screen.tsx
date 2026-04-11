import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@portal/session/useAuth";
import type {
  AdminUserRecord,
  AuditEvent,
  EventRecord,
  ExternalPractitionerApplicationRecord,
  InvoiceRecord,
  KnowledgeArticleRecord,
  QuoteRecord,
  SecurityPolicyRecord,
} from "@portal/domains/account/types";

export default function AdminHome() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [applications, setApplications] = useState<ExternalPractitionerApplicationRecord[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticleRecord[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicyRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [articleTitle, setArticleTitle] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  async function fetchData() {
    if (!auth.user) return;
    return Promise.all([
      auth.accountAdapter.listAdminUsers(auth.user.id),
      auth.accountAdapter.listExternalPractitionerApplications(auth.user.id),
      auth.accountAdapter.listKnowledgeArticles(auth.user.id),
      auth.accountAdapter.listSecurityPolicies(auth.user.id),
      auth.accountAdapter.listAdminEvents(auth.user.id),
      auth.accountAdapter.listAdminInvoices(auth.user.id),
      auth.accountAdapter.listAdminQuotes(auth.user.id),
      auth.accountAdapter.listAdminAuditLogs(auth.user.id),
    ]);
  }

  async function refresh() {
    const result = await fetchData();
    if (!result) return;
    const [
      nextUsers,
      nextApplications,
      nextArticles,
      nextPolicies,
      nextEvents,
      nextInvoices,
      nextQuotes,
      nextAuditLogs,
    ] = result;
    setUsers(nextUsers);
    setApplications(nextApplications);
    setArticles(nextArticles);
    setPolicies(nextPolicies);
    setEvents(nextEvents);
    setInvoices(nextInvoices);
    setQuotes(nextQuotes);
    setAuditLogs(nextAuditLogs.slice(0, 10));
  }

  useEffect(() => {
    let active = true;
    void fetchData().then((result) => {
      if (!active || !result) return;
      const [
        nextUsers,
        nextApplications,
        nextArticles,
        nextPolicies,
        nextEvents,
        nextInvoices,
        nextQuotes,
        nextAuditLogs,
      ] = result;
      setUsers(nextUsers);
      setApplications(nextApplications);
      setArticles(nextArticles);
      setPolicies(nextPolicies);
      setEvents(nextEvents);
      setInvoices(nextInvoices);
      setQuotes(nextQuotes);
      setAuditLogs(nextAuditLogs.slice(0, 10));
    });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  async function handleApprove(applicationId: string) {
    if (!auth.user) return;
    await auth.accountAdapter.approveExternalPractitionerApplication(auth.user.id, applicationId);
    await refresh();
  }

  async function handleCreateArticle() {
    if (!auth.user || !articleTitle.trim()) return;
    await auth.accountAdapter.createKnowledgeArticle({
      actorUserId: auth.user.id,
      slug: articleTitle.toLowerCase().replace(/\s+/g, "-"),
      title: articleTitle.trim(),
      summary: "Contenu scientifique à compléter.",
      body: "Brouillon scientifique structuré.",
      category: "scientifique",
    });
    setArticleTitle("");
    await refresh();
  }

  async function handlePublishArticle(articleId: string) {
    if (!auth.user) return;
    await auth.accountAdapter.publishKnowledgeArticle(auth.user.id, articleId);
    await refresh();
  }

  async function handleCreateEvent() {
    if (!auth.user || !eventTitle.trim()) return;
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    await auth.accountAdapter.createEvent({
      actorUserId: auth.user.id,
      title: eventTitle.trim(),
      summary: "Session créée depuis la console admin.",
      description: "Description à enrichir par l'équipe organisatrice.",
      audience: "patient",
      format: "digital",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      capacity: 80,
      waitlistCapacity: 20,
      requiresPayment: false,
      priceAmount: 0,
      currency: "XOF",
    });
    setEventTitle("");
    await refresh();
  }

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[#111214]">Admin</h1>
              <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
                Gouvernance, vérification praticiens, contenu scientifique, événements,
                facturation et audit.
              </p>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Vérification praticiens externes</h2>
            <div className="mt-4 space-y-3">
              {applications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#111214]">{item.fullName}</p>
                      <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">
                        {item.specialty ?? "Spécialité non précisée"} · {item.organization ?? "Structure libre"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(91,17,18,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]">
                      {item.status}
                    </span>
                  </div>
                  {item.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => void handleApprove(item.id)}
                      className="mt-3 rounded-full bg-[#5B1112] px-4 py-2 text-sm font-medium text-white"
                    >
                      Approuver
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Contenu scientifique</h2>
            <div className="mt-4 flex gap-2">
              <input
                value={articleTitle}
                onChange={(event) => setArticleTitle(event.target.value)}
                placeholder="Titre du nouvel article"
                className="flex-1 rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreateArticle()}
                className="rounded-2xl bg-[#111214] px-4 py-3 text-sm font-medium text-white"
              >
                Créer
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {articles.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#111214]">{item.title}</p>
                      <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">{item.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePublishArticle(item.id)}
                      className="rounded-full border border-[rgba(17,18,20,0.12)] px-3 py-1 text-xs font-medium text-[#111214]"
                    >
                      Publier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Événements</h2>
            <div className="mt-4 flex gap-2">
              <input
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                placeholder="Créer un événement"
                className="flex-1 rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreateEvent()}
                className="rounded-2xl bg-[#111214] px-4 py-3 text-sm font-medium text-white"
              >
                Ajouter
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {events.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <p className="font-medium text-[#111214]">{item.title}</p>
                  <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">
                    {item.audience} · {item.format} · {item.status}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Politiques & audit</h2>
            <div className="mt-4 space-y-3">
              {policies.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <p className="font-medium text-[#111214]">{item.key}</p>
                  <pre className="mt-2 overflow-auto rounded-xl bg-[#FCFCFC] p-3 text-xs text-[rgba(17,18,20,0.62)]">
                    {JSON.stringify(item.value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
              <p className="font-medium text-[#111214]">Derniers audits</p>
              <div className="mt-3 space-y-2 text-sm text-[rgba(17,18,20,0.58)]">
                {auditLogs.map((item) => (
                  <p key={item.id}>
                    {item.action} · {item.entityType} · {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Utilisateurs</h2>
            <div className="mt-4 space-y-3 text-sm text-[rgba(17,18,20,0.58)]">
              {users.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <p className="font-medium text-[#111214]">{item.fullName}</p>
                  <p className="mt-1">{item.roles.join(", ") || "Aucun rôle"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Factures</h2>
            <div className="mt-4 space-y-3 text-sm text-[rgba(17,18,20,0.58)]">
              {invoices.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <p className="font-medium text-[#111214]">{item.title}</p>
                  <p className="mt-1">
                    {item.totalAmount.toLocaleString("fr-FR")} {item.currency} · {item.status}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Devis</h2>
            <div className="mt-4 space-y-3 text-sm text-[rgba(17,18,20,0.58)]">
              {quotes.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                  <p className="font-medium text-[#111214]">{item.title}</p>
                  <p className="mt-1">
                    {item.totalAmount.toLocaleString("fr-FR")} {item.currency} · {item.status}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
