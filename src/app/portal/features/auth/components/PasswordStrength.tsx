import { motion } from "motion/react";
import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

function computeStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (pw.length === 0)
    return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;

  if (s <= 1) return { score: 1, label: "Faible", color: "#6A1D1F" };
  if (s <= 2) return { score: 2, label: "Moyen", color: "#5B1112" };
  if (s <= 3) return { score: 3, label: "Bon", color: "#00415E" };
  return { score: 4, label: "Excellent", color: "#00415E" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color } = useMemo(
    () => computeStrength(password),
    [password]
  );

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="overflow-hidden mt-2 px-1"
    >
      {/* Bars */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="flex-1 h-[3px] rounded-full"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: 1,
              backgroundColor:
                i <= score ? color : "rgba(17,18,20,0.08)",
            }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>
      <p
        className="text-[11px] mt-1.5 tracking-[-0.02px]"
        style={{ color, fontWeight: 520 }}
      >
        {label}
      </p>
    </motion.div>
  );
}
