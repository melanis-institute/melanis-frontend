import { Briefcase, ShieldCheck, Stethoscope, UserCircle2, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { roleDescription, roleHomeRoute, roleLabel, type UserRole } from "@portal/session/roles";
import { useAuth } from "@portal/session/useAuth";

function roleIcon(role: UserRole) {
  if (role === "patient") return UserCircle2;
  if (role === "caregiver") return Users;
  if (role === "practitioner") return Stethoscope;
  if (role === "staff") return Briefcase;
  return ShieldCheck;
}

export default function SelectRoleScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  useEffect(() => {
    if (auth.availableRoles.length === 1 && !auth.activeRole) {
      const [singleRole] = auth.availableRoles;
      auth.setActiveRole(singleRole);
      navigate(returnTo ?? roleHomeRoute(singleRole), { replace: true });
      return;
    }

    if (auth.activeRole && auth.availableRoles.includes(auth.activeRole)) {
      navigate(returnTo ?? roleHomeRoute(auth.activeRole), { replace: true });
    }
  }, [auth, navigate, returnTo]);

  const handleSelectRole = (role: UserRole) => {
    auth.setActiveRole(role);
    navigate(returnTo ?? roleHomeRoute(role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[rgba(17,18,20,0.09)] bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-semibold text-[#111214]">Choisissez votre espace</h1>
        <p className="mt-2 text-sm text-[rgba(17,18,20,0.62)]">
          Sélectionnez le rôle actif pour cette session.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {auth.availableRoles.map((role) => {
            const Icon = roleIcon(role);
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                className="rounded-2xl border border-[rgba(17,18,20,0.12)] bg-[#FCFCFC] p-4 text-left transition hover:border-[#5B1112]/35 hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F6EAD5] text-[#5B1112]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">{roleLabel(role)}</p>
                    <p className="mt-1 text-xs text-[rgba(17,18,20,0.58)]">{roleDescription(role)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-[rgba(17,18,20,0.52)]">
          Pour changer de rôle plus tard, déconnectez-vous puis reconnectez-vous.
        </p>
      </div>
    </div>
  );
}
