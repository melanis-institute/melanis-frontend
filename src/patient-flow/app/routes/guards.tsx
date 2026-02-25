import { Navigate, Outlet, useLocation } from "react-router";
import type { ConsentType } from "../account/types";
import { useAuth } from "../auth/useAuth";
import type { UserRole } from "../auth/roles";

function FullscreenMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEF0D5] px-6">
      <div className="max-w-md rounded-2xl border border-[rgba(17,18,20,0.08)] bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-[#111214]">{title}</h1>
        <p className="mt-2 text-sm text-[rgba(17,18,20,0.65)]">{subtitle}</p>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthReady) {
    return (
      <FullscreenMessage
        title="Chargement de votre session"
        subtitle="Un instant, nous vérifions votre connexion."
      />
    );
  }

  if (!auth.isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/patient-flow/auth/connexion"
        replace
        state={{ returnTo }}
      />
    );
  }

  return <Outlet />;
}

export function RequireActiveRole() {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.activeRole) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/patient-flow/auth/select-role"
        replace
        state={{ returnTo }}
      />
    );
  }

  return <Outlet />;
}

export function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const auth = useAuth();

  if (!auth.activeRole) {
    return <Navigate to="/patient-flow/auth/select-role" replace />;
  }

  if (!allowedRoles.includes(auth.activeRole)) {
    return <Navigate to={auth.resolvePostAuthRoute()} replace />;
  }

  return <Outlet />;
}

export function RequireActingProfile() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isAccountLoading) {
    return (
      <FullscreenMessage
        title="Chargement des profils"
        subtitle="Préparation de votre contexte patient."
      />
    );
  }

  if (!auth.actingProfileId) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/patient-flow/account/select-profile"
        replace
        state={{ returnTo }}
      />
    );
  }

  return <Outlet />;
}

export function RequireConsent({ consentType }: { consentType: ConsentType }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isAccountLoading) {
    return (
      <FullscreenMessage
        title="Vérification des consentements"
        subtitle="Un instant, nous validons vos autorisations."
      />
    );
  }

  if (!auth.actingProfileId) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/patient-flow/account/select-profile"
        replace
        state={{ returnTo }}
      />
    );
  }

  const consent = auth.consentSnapshot[consentType];
  if (consent?.status === "signed") {
    return <Outlet />;
  }

  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  if (consent?.id) {
    return (
      <Navigate
        to={`/patient-flow/account/consents/${consent.id}`}
        replace
        state={{ returnTo }}
      />
    );
  }

  return (
    <Navigate
      to="/patient-flow/account/consents"
      replace
      state={{ returnTo }}
    />
  );
}
