interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`Progression: étape ${current} sur ${total}`}
    >
      <span className="sr-only">{`Étape ${current} sur ${total}`}</span>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div
            key={step}
            className="rounded-full transition-all duration-300"
            aria-hidden="true"
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              backgroundColor: isActive
                ? "#5B1112"
                : isCompleted
                  ? "rgba(91, 17, 18, 0.35)"
                  : "rgba(17, 18, 20, 0.1)",
              borderRadius: 100,
            }}
          />
        );
      })}
    </div>
  );
}
