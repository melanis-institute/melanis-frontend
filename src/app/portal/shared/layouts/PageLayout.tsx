import type { ReactNode } from "react";
import { ExitFlowButton } from "@portal/shared/components/ExitFlowButton";
import { ScreenShell } from "@shared/ui";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return <ScreenShell topRightSlot={<ExitFlowButton />}>{children}</ScreenShell>;
}
