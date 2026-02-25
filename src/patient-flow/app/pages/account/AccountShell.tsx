import type { ReactNode } from "react";
import { CalendarCheck2, ChevronLeft, FileUser, ShieldCheck, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router";
import { PageLayout } from "../../components/PageLayout";
import { useAuth } from "../../auth/useAuth";
import { relationshipToLabel } from "../../account/mockAccountAdapter";

const NAV_ITEMS = [
  { to: "/patient-flow/account/select-profile", label: "Profil actif", icon: UserRound },
  { to: "/patient-flow/account/dependents", label: "Dépendants", icon: UsersRound },
  { to: "/patient-flow/account/consents", label: "Consentements", icon: ShieldCheck },
  { to: "/patient-flow/account/notifications", label: "Notifications", icon: CalendarCheck2 },
  { to: "/patient-flow/profiles", label: "Profils", icon: FileUser },
] as const;

export function AccountShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const activeProfile = auth.actingProfile;

  return (
    <PageLayout>
      <div className="relative min-h-screen overflow-hidden bg-[#FEF0D5]">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/55 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-[#5B1112]/8 blur-3xl" />

        <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 pb-6 pt-3 md:px-8 md:pb-8 md:pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#111214]/68 shadow-sm transition-colors hover:bg-white"
            >
              <ChevronLeft size={13} />
              Retour
            </button>

            <Link
              to="/patient-flow/auth/dashboard"
              className="rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-medium text-[#111214]/68 shadow-sm transition-colors hover:bg-white"
            >
              Dashboard
            </Link>
          </div>

          <section
            className="relative overflow-hidden rounded-[2rem] border border-white/70 p-5 shadow-[0_6px_36px_rgba(0,0,0,0.05)] md:p-6"
            style={{
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.92) 0%, rgba(254,240,213,0.92) 60%, rgba(253,232,190,0.88) 100%)",
            }}
          >
            <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#5B1112]/7 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/45 blur-xl" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/36">
                  Compte patient
                </p>
                <h1 className="mt-1 font-serif text-[#111214]" style={{ fontSize: 30, lineHeight: 1.1 }}>
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#111214]/58">{subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#111214] px-3 py-1.5 text-[10px] font-medium text-[#FEF0D5]">
                  Authentifié
                </span>
                {activeProfile ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-medium text-emerald-700">
                    Agir pour: {activeProfile.firstName} {activeProfile.lastName} ({relationshipToLabel(activeProfile.relationship)})
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-medium text-amber-700">
                    Aucun profil actif
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="mt-3 flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <NavPill key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pb-1">
            <div className="space-y-3">{children}</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function NavPill({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          isActive
            ? "border-transparent bg-[#5B1112] text-white shadow-md shadow-[#5B1112]/25"
            : "border-white/70 bg-white/78 text-[#111214]/68 hover:bg-white",
        ].join(" ")
      }
    >
      <Icon size={12} />
      {label}
    </NavLink>
  );
}

