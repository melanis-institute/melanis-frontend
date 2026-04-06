import type { ReactNode } from "react";
import { Card } from "@shared/ui/Card";
import { SectionHeader } from "@shared/ui/SectionHeader";

interface EmptyStateProps {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card className="px-6 py-8 text-center">
      <SectionHeader title={title} description={description} />
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
