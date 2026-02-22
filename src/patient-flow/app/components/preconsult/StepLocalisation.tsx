import { motion } from "motion/react";
import {
  SmilePlus,
  PersonStanding,
  Hand,
  Footprints,
  Fingerprint,
  ShieldQuestion,
} from "lucide-react";
import { ZONES } from "./types";
import { SelectableChip } from "./SelectableChip";
import ChuteDeCheveux from "../../../imports/ChuteDeCheveux";
import type { LucideIcon } from "lucide-react";

const ZONE_ICONS: Record<string, LucideIcon> = {
  Visage: SmilePlus,
  Corps: PersonStanding,
  Mains: Hand,
  Pieds: Footprints,
  Ongles: Fingerprint,
  "Zones intimes": ShieldQuestion,
};

interface StepLocalisationProps {
  selected: string[];
  onToggle: (zone: string) => void;
}

export function StepLocalisation({
  selected,
  onToggle,
}: StepLocalisationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-wrap gap-3"
    >
      {ZONES.map((zone, i) => (
        <motion.div
          key={zone}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: i * 0.04,
            ease: "easeOut",
          }}
        >
          <SelectableChip
            label={zone}
            selected={selected.includes(zone)}
            onToggle={() => onToggle(zone)}
            icon={ZONE_ICONS[zone]}
            customIcon={
              zone === "Cuir chevelu" ? (
                <span
                  className="w-[18px] h-[18px] block"
                  style={{
                    "--fill-0": selected.includes(zone) ? "#5B1112" : "#9CA3AF",
                    "--stroke-0": selected.includes(zone) ? "#5B1112" : "#9CA3AF",
                  } as React.CSSProperties}
                >
                  <ChuteDeCheveux />
                </span>
              ) : undefined
            }
          />
        </motion.div>
      ))}
    </motion.div>
  );
}