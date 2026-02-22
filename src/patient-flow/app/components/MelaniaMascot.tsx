import { useState, useEffect, useId } from "react";
import { motion } from "motion/react";
import svgPaths from "../../imports/svg-9j3o87u1xl";

interface MelaniaMascotProps {
  /** Pixel size (width & height) */
  size?: number;
  /** Enable animations — set false for static renders */
  animated?: boolean;
  /** Delay before entrance animation starts */
  delay?: number;
}

export function MelaniaMascot({
  size = 64,
  animated = true,
  delay = 0,
}: MelaniaMascotProps) {
  const uid = useId().replace(/:/g, "");
  const [isBlinking, setIsBlinking] = useState(false);

  // ——— Random blink timer ———
  useEffect(() => {
    if (!animated) return;

    let timer: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const nextDelay = 2200 + Math.random() * 3500;
      timer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 160);
        scheduleBlink();
      }, nextDelay);
    };

    // Initial delay before first blink
    timer = setTimeout(() => {
      scheduleBlink();
    }, 1000 + delay * 1000);

    return () => clearTimeout(timer);
  }, [animated, delay]);

  // Filter / gradient IDs scoped to this instance
  const filtInner = `fi_${uid}`;
  const filtGlow = `fg_${uid}`;
  const filtHighlight = `fh_${uid}`;
  const filtBlush = `fb_${uid}`;
  const gradFace = `gf_${uid}`;
  const gradGlow = `gg_${uid}`;

  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 2px 8px rgba(17, 18, 20, 0.06))",
      }}
      // ——— Entrance ———
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 20,
        delay: delay,
      }}
    >
      {/* ——— Floating wrapper ——— */}
      <motion.div
        className="relative size-full"
        animate={
          animated
            ? { y: [0, -3, 0, 2, 0] }
            : {}
        }
        transition={
          animated
            ? {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
      >
        {/* ===== OUTER GLOW (blurred edge) ===== */}
        <motion.div
          className="absolute inset-[-3.59%_-3.51%]"
          animate={
            animated
              ? { opacity: [0.7, 1, 0.7] }
              : {}
          }
          transition={
            animated
              ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 610.552 597.414"
          >
            <g filter={`url(#${filtGlow})`}>
              <path
                d={svgPaths.p36012a00}
                fill={`url(#${gradGlow})`}
                fillOpacity="0.2"
              />
              <path
                d={svgPaths.p2e55fe00}
                stroke="#F2E8D8"
                strokeWidth="4"
              />
              <path
                d={svgPaths.p2e55fe00}
                stroke="#EFE5D5"
                strokeWidth="4"
              />
            </g>
            <defs>
              <filter
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
                height="597.414"
                id={filtGlow}
                width="610.552"
                x="0"
                y="0"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  mode="normal"
                  result="shape"
                />
                <feGaussianBlur
                  result="blur"
                  stdDeviation="8"
                />
              </filter>
              <radialGradient
                cx="0"
                cy="0"
                gradientTransform="translate(305.276 298.707) rotate(-132.171) scale(262.452 268.638)"
                gradientUnits="userSpaceOnUse"
                id={gradGlow}
                r="1"
              >
                <stop stopColor="#F7F3ED" />
                <stop offset="1" stopColor="#EDE4D5" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* ===== FACE BASE ===== */}
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 570.552 557.414"
        >
          <g>
            <g filter={`url(#${filtInner})`}>
              <path d={svgPaths.p7884d80} fill="#EFE6D8" />
              <path
                d={svgPaths.p7884d80}
                fill={`url(#${gradFace})`}
                fillOpacity="0.2"
              />
            </g>
            <path d={svgPaths.p3025070} stroke="#F6EFE5" />
          </g>
          <defs>
            <filter
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="567.414"
              id={filtInner}
              width="570.552"
              x="0"
              y="0"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                mode="normal"
                result="shape"
              />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="10" />
              <feGaussianBlur stdDeviation="15" />
              <feComposite
                in2="hardAlpha"
                k2="-1"
                k3="1"
                operator="arithmetic"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.0666667 0 0 0 0 0.0705882 0 0 0 0 0.0784314 0 0 0 0.08 0"
              />
              <feBlend in2="shape" mode="normal" />
            </filter>
            <radialGradient
              cx="0"
              cy="0"
              gradientTransform="translate(285.276 278.707) rotate(-132.171) scale(262.452 268.638)"
              gradientUnits="userSpaceOnUse"
              id={gradFace}
              r="1"
              >
              <stop stopColor="#F3ECE2" />
              <stop offset="1" stopColor="#E6D7C1" stopOpacity="0.54" />
            </radialGradient>
          </defs>
        </svg>

        {/* ===== HIGHLIGHT (top-left sparkle) ===== */}
        <motion.div
          className="absolute"
          style={{
            left: "15.7%",
            top: "20%",
            width: "4.7%",
            aspectRatio: 1,
          }}
          animate={
            animated
              ? { opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.1, 0.95] }
              : {}
          }
          transition={
            animated
              ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <div className="absolute inset-[-56%]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 53 53"
            >
              <g filter={`url(#${filtHighlight})`}>
                <circle cx="26.5" cy="26.5" fill="white" fillOpacity="0.3" r="12.5" />
              </g>
              <defs>
                <filter
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                  height="53"
                  id={filtHighlight}
                  width="53"
                  x="0"
                  y="0"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    mode="normal"
                    result="shape"
                  />
                  <feGaussianBlur result="blur" stdDeviation="7" />
                </filter>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* ===== LEFT EYE ===== */}
        <motion.div
          className="absolute"
          style={{
            inset: "30.34% 64.87% 59.14% 15.75%",
            transformOrigin: "center 80%",
          }}
          animate={isBlinking ? { scaleY: 0.05 } : { scaleY: 1 }}
          transition={{ duration: 0.08, ease: "easeInOut" }}
        >
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 110.584 58.6379"
          >
            <path d={svgPaths.p11441cb0} fill="#5B1112" />
          </svg>
        </motion.div>

        {/* ===== RIGHT EYE ===== */}
        <motion.div
          className="absolute"
          style={{
            inset: "36.57% 22.54% 51.27% 58.41%",
            transformOrigin: "center 80%",
          }}
          animate={isBlinking ? { scaleY: 0.05 } : { scaleY: 1 }}
          transition={{ duration: 0.08, ease: "easeInOut" }}
        >
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 108.681 67.7739"
          >
            <path d={svgPaths.p2b2e200} fill="#5B1112" />
          </svg>
        </motion.div>

        {/* ===== SMILE ===== */}
        <motion.div
          className="absolute"
          style={{
            inset: "48.28% 37.78% 32.28% 24.93%",
            transformOrigin: "center 30%",
          }}
          animate={
            animated
              ? { scale: [1, 1.04, 1], rotate: [0, 1, 0, -1, 0] }
              : {}
          }
          transition={
            animated
              ? { duration: 5, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <svg
            className="absolute block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 212.768 108.338"
          >
            <path d={svgPaths.p19839a00} fill="#5B1112" />
          </svg>
        </motion.div>

        {/* ===== LEFT BLUSH ===== */}
        <motion.div
          className="absolute"
          style={{
            left: "11.32%",
            width: "8.76%",
            top: "53.5%",
            aspectRatio: 1,
          }}
          animate={
            animated
              ? { opacity: [0.1, 0.2, 0.1], scale: [0.95, 1.08, 0.95] }
              : {}
          }
          transition={
            animated
              ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              : {}
          }
        >
          <div className="absolute inset-[-80%]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 130 130"
            >
              <g filter={`url(#${filtBlush}_l)`}>
                <circle cx="65" cy="65" fill="#5B1112" fillOpacity="0.11" r="25" />
              </g>
              <defs>
                <filter
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                  height="130"
                  id={`${filtBlush}_l`}
                  width="130"
                  x="0"
                  y="0"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    mode="normal"
                    result="shape"
                  />
                  <feGaussianBlur result="blur" stdDeviation="20" />
                </filter>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* ===== RIGHT BLUSH ===== */}
        <motion.div
          className="absolute"
          style={{
            left: "67.93%",
            width: "8.76%",
            top: "58%",
            aspectRatio: 1,
          }}
          animate={
            animated
              ? { opacity: [0.1, 0.2, 0.1], scale: [0.95, 1.08, 0.95] }
              : {}
          }
          transition={
            animated
              ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }
              : {}
          }
        >
          <div className="absolute inset-[-80%]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 130 130"
            >
              <g filter={`url(#${filtBlush}_r)`}>
                <circle cx="65" cy="65" fill="#5B1112" fillOpacity="0.11" r="25" />
              </g>
              <defs>
                <filter
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                  height="130"
                  id={`${filtBlush}_r`}
                  width="130"
                  x="0"
                  y="0"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    mode="normal"
                    result="shape"
                  />
                  <feGaussianBlur result="blur" stdDeviation="20" />
                </filter>
              </defs>
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
