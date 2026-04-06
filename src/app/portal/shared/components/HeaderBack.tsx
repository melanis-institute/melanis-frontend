import { ChevronLeft } from "lucide-react";

interface HeaderBackProps {
  onBack?: () => void;
}

export function HeaderBack({ onBack }: HeaderBackProps) {
  return (
    <button
      onClick={onBack}
      className="flex items-center justify-center w-[44px] h-[44px] rounded-full transition-colors hover:bg-[rgba(17,18,20,0.04)] active:bg-[rgba(17,18,20,0.06)]"
      aria-label="Retour"
    >
      <ChevronLeft className="w-6 h-6 text-[#111214]" strokeWidth={1.8} />
    </button>
  );
}