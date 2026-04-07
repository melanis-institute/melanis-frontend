import type { ClinicalDocumentRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { ArrowUpRight, Clock3, FileText, Pill } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

const DASHBOARD_RECORDS_PATH = "/patient-flow/auth/dashboard#records";
const EMPTY_DOCUMENTS: ClinicalDocumentRecord[] = [];

function documentKindLabel(kind: ClinicalDocumentRecord["kind"]) {
  if (kind === "prescription") return "Ordonnance";
  if (kind === "report") return "Compte-rendu";
  return "Document";
}

function formatDate(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDocumentDetailPath(documentId: string) {
  return `/patient-flow/auth/dashboard/documents/${documentId}`;
}

export default function PatientDocumentDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { documentId } = useParams();
  const userId = auth.user?.id ?? null;
  const actingProfileId = auth.actingProfileId;
  const hasPatientContext = Boolean(userId && actingProfileId);
  const [documents, setDocuments] = useState<ClinicalDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !actingProfileId) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);

      try {
        const records = await auth.accountAdapter.listClinicalDocuments(
          userId,
          actingProfileId,
        );
        if (cancelled) return;
        const sorted = [...records].sort((first, second) =>
          (second.publishedAt ?? second.createdAt).localeCompare(
            first.publishedAt ?? first.createdAt,
          ),
        );
        setDocuments(sorted);
      } catch (adapterError) {
        if (cancelled) return;
        setDocuments([]);
        setError(
          adapterError instanceof Error
            ? adapterError.message
            : "Impossible de charger ce document pour le moment.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auth.accountAdapter, actingProfileId, userId]);

  const visibleDocuments = hasPatientContext ? documents : EMPTY_DOCUMENTS;
  const visibleError = hasPatientContext ? error : null;
  const visibleIsLoading = hasPatientContext ? isLoading : false;

  const document = useMemo(
    () => visibleDocuments.find((item) => item.id === documentId) ?? null,
    [documentId, visibleDocuments],
  );
  const relatedDocuments = useMemo(
    () => visibleDocuments.filter((item) => item.id !== documentId).slice(0, 3),
    [documentId, visibleDocuments],
  );

  const handleLogout = () => {
    void auth.logout().finally(() => {
      navigate("/patient-flow/auth", { replace: true });
    });
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout
      fullName={auth.user?.fullName ?? "Fatou Diop"}
      onLogout={handleLogout}
    >
      <div className="mx-auto w-full max-w-[58rem] space-y-4 pb-28 pt-1 lg:pb-10">
        <section className="rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_6px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
            Dossier patient
          </p>
          <h1 className="mt-2 font-serif text-[2.1rem] leading-tight text-[#111214]">
            Document praticien
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#111214]/58">
            Consultez vos ordonnances, comptes-rendus et consignes sans quitter
            l&apos;espace dashboard.
          </p>
        </section>

        {visibleIsLoading ? (
          <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-[#111214]/62">Chargement du document...</p>
          </section>
        ) : visibleError ? (
          <section className="rounded-[2rem] border border-[#5B1112]/18 bg-[#5B1112]/[0.04] p-5 text-sm text-[#5B1112]">
            {visibleError}
          </section>
        ) : !document ? (
          <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <p className="font-serif text-2xl text-[#111214]">Document introuvable</p>
            <p className="mt-2 text-sm text-[#111214]/62">
              Ce document n&apos;est pas disponible pour le profil actif ou n&apos;existe plus.
            </p>
            <Link
              to={DASHBOARD_RECORDS_PATH}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-semibold text-white"
            >
              Retour au dossier
              <ArrowUpRight size={12} />
            </Link>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-white bg-white/88 shadow-[0_6px_30px_rgba(0,0,0,0.05)]">
              <div className="border-b border-[#111214]/6 bg-[linear-gradient(145deg,#fff9ef_0%,#fff0d7_100%)] p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#111214] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    {documentKindLabel(document.kind)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B1112]">
                    Version {document.version}
                  </span>
                </div>

                <h2 className="mt-4 font-serif text-[2rem] leading-tight text-[#111214]">
                  {document.title}
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#111214]/58">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} className="text-[#5B1112]/60" />
                    Publié le {formatDate(document.publishedAt ?? document.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {document.kind === "prescription" ? (
                      <Pill size={14} className="text-[#5B1112]/60" />
                    ) : (
                      <FileText size={14} className="text-[#5B1112]/60" />
                    )}
                    {document.prescriptionItems.length > 0
                      ? `${document.prescriptionItems.length} ligne${
                          document.prescriptionItems.length > 1 ? "s" : ""
                        } de prescription`
                      : "Document clinique"}
                  </span>
                </div>

                {document.summary ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[#111214]/68">
                    {document.summary}
                  </p>
                ) : null}
              </div>

              <div className="space-y-5 p-6">
                {document.prescriptionItems.length > 0 ? (
                  <section>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                      Prescription
                    </p>
                    <div className="mt-3 grid gap-3">
                      {document.prescriptionItems.map((item) => (
                        <article
                          key={`${document.id}-${item.name}`}
                          className="rounded-[1.35rem] border border-[#111214]/8 bg-[#FCFCFC] p-4"
                        >
                          <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-[#5B1112]/8 p-2 text-[#5B1112]">
                              <Pill size={13} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111214]">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-[#111214]/52">
                                {item.isMedication ? "Médicament" : "Soin / conseil"}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#111214]/68">
                            {item.instructions}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {document.body ? (
                  <section>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                      Contenu du document
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap rounded-[1.35rem] border border-[#111214]/8 bg-[#FCFCFC] p-4 text-sm leading-6 text-[#111214]/72">
                      {document.body}
                    </pre>
                  </section>
                ) : null}

                {!document.body && document.prescriptionItems.length === 0 ? (
                  <section className="rounded-[1.35rem] border border-dashed border-[#111214]/14 bg-[#FCFCFC] p-4 text-sm text-[#111214]/58">
                    Aucun contenu détaillé supplémentaire n&apos;est associé à ce document.
                  </section>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                    Navigation rapide
                  </p>
                  <p className="mt-1 text-sm text-[#111214]/58">
                    Retournez au tableau de bord ou ouvrez un autre document récent.
                  </p>
                </div>

                <Link
                  to={DASHBOARD_RECORDS_PATH}
                  className="inline-flex items-center gap-2 rounded-full border border-[#111214]/10 bg-white px-4 py-2 text-xs font-semibold text-[#111214]"
                >
                  Retour au dossier
                  <ArrowUpRight size={12} />
                </Link>
              </div>

              {relatedDocuments.length > 0 ? (
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {relatedDocuments.map((item) => (
                    <Link
                      key={item.id}
                      to={getDocumentDetailPath(item.id)}
                      className="rounded-[1.25rem] border border-[#111214]/8 bg-[#FCFCFC] p-3 transition hover:border-[#5B1112]/18 hover:bg-white"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B1112]/65">
                        {documentKindLabel(item.kind)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-[#111214]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-xs text-[#111214]/48">
                        {formatDate(item.publishedAt ?? item.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
