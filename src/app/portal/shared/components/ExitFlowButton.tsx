import { X } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@portal/session/useAuth";

interface ExitFlowButtonProps {
  className?: string;
}

export function ExitFlowButton({ className = "" }: ExitFlowButtonProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const destination = auth.isAuthenticated ? auth.resolvePostAuthRoute() : "/";

  return (
    <button
      type="button"
      onClick={() => {
        auth.clearBookingFlowContext();
        navigate(destination);
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,18,20,0.14)] bg-[rgba(250,250,250,0.88)] px-3 py-1.5 text-[12px] text-[rgba(17,18,20,0.74)] backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] ${className}`}
      style={{ fontWeight: 560 }}
      aria-label="Quitter le parcours"
      title="Quitter le parcours"
    >
      <X className="h-[13px] w-[13px]" strokeWidth={2} />
      <span className="hidden sm:inline">Quitter</span>
    </button>
  );
}
