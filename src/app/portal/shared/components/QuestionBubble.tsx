interface QuestionBubbleProps {
  title: string;
  subtitle?: string;
  tailSide?: "left" | "right";
}

export function QuestionBubble({
  title,
  subtitle,
  tailSide = "right",
}: QuestionBubbleProps) {
  return (
    <div className="relative">
      {/* Small tail/connector dots */}
      {tailSide === "right" ? (
        <>
          <div className="absolute right-[-6px] top-[22px] w-3 h-3 bg-white rounded-full opacity-60" />
          <div className="absolute right-[-14px] top-[30px] w-[7px] h-[7px] bg-white rounded-full opacity-40" />
        </>
      ) : (
        <>
          <div className="absolute left-[-6px] top-[22px] w-3 h-3 bg-white rounded-full opacity-60" />
          <div className="absolute left-[-14px] top-[30px] w-[7px] h-[7px] bg-white rounded-full opacity-40" />
        </>
      )}

      {/* Main bubble */}
      <div
        className="relative bg-white rounded-[28px] px-[22px] py-[20px]"
        style={{
          boxShadow:
            "0 1px 3px rgba(17, 18, 20, 0.04), 0 4px 12px rgba(17, 18, 20, 0.03)",
        }}
      >
        <h2 className="text-[#111214] text-[22px] leading-[1.3] tracking-[-0.3px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-[6px] text-[rgba(17,18,20,0.5)] text-[14px] leading-[1.4]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
