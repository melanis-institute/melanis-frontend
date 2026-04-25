import type { ReactNode } from "react";
import { X } from "lucide-react";
import { classNames } from "@shared/lib/classNames";
import { IconButton } from "@shared/ui/IconButton";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export function Modal({ children, className, onClose, open, title }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={classNames(
          "w-full max-w-lg rounded-[20px] border border-melanis-semantic-border-default bg-white p-5 shadow-xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-heading-h5 text-melanis-semantic-text-primary">
            {title}
          </h2>
          <IconButton label="Fermer" variant="ghost" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
