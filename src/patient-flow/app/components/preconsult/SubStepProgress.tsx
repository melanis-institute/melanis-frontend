import { motion } from "motion/react";

interface SubStepProgressProps {
  current: number;
  total: number;
}

export function SubStepProgress({ current, total }: SubStepProgressProps) {
  const progress = Math.max(0, Math.min(1, current / total));

  return (
    <div className="w-full h-[3px] bg-[rgba(17,18,20,0.06)] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, #5B1112 0%, #6A1D1F 100%)",
        }}
        initial={false}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
