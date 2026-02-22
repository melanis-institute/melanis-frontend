import type { ReactNode } from "react";
import { ExitFlowButton } from "./ExitFlowButton";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#F3F1EE]">
      {/* Full viewport background gradients */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 82% 52% at 50% 0%, rgba(255, 255, 255, 0.66) 0%, transparent 72%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 10%, rgba(91, 17, 18, 0.025) 0%, transparent 74%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 20% 80%, rgba(0, 65, 94, 0.018) 0%, transparent 74%)",
        }}
      />

      {/* Centered responsive layout */}
      <div className="pf-shell relative flex items-start md:items-center justify-center min-h-[100dvh] w-full md:px-3 md:py-3 lg:px-5 lg:py-5">
        {/* Content panel */}
        <div
          className="
            pf-panel relative w-full h-[100dvh] overflow-hidden
            md:h-[min(920px,calc(100dvh-1.5rem))] md:w-[min(96vw,900px)] md:max-w-none md:rounded-[32px] md:shadow-lg
            lg:w-[min(94vw,1080px)]
            xl:w-[min(92vw,1220px)] xl:h-[min(940px,calc(100dvh-2rem))]
            bg-[#FAFAFA]
          "
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
          }}
        >
          <div
            className="absolute right-3 z-20"
            style={{ top: "max(env(safe-area-inset-top, 0px), 10px)" }}
          >
            <ExitFlowButton />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
