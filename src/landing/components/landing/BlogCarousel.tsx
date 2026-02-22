import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedSection } from "./AnimatedSection";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  href: string;
  image: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "L'hydratation sous l'Harmattan",
    date: "12 Oct 2025",
    excerpt: "Comment protéger sa peau contre la sécheresse intense et la poussière durant la saison de l'Harmattan.",
    author: "Dr. A. Sow",
    href: "#",
    image: "https://images.unsplash.com/photo-1681841902330-045551fadeab?q=80&w=1973&auto=format&fit=crop"
  },
  {
    id: "2",
    title: "Les dangers de la dépigmentation",
    date: "28 Sep 2025",
    excerpt: "Analyse médicale des risques liés aux produits éclaircissants et alternatives saines pour l'éclat.",
    author: "Dr. M. Fall",
    href: "#",
    image: "https://images.unsplash.com/photo-1651848894662-5245755aea8e?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "Eczéma sur peau noire",
    date: "15 Sep 2025",
    excerpt: "Reconnaître les signes de l'atopie sur les peaux pigmentées et adapter sa routine de soin.",
    author: "Dr. S. Ndiaye",
    href: "#",
    image: "https://images.unsplash.com/photo-1646457417455-77a66a9fcf34?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "4",
    title: "Protection solaire au Sénégal",
    date: "03 Sep 2025",
    excerpt: "Pourquoi et comment utiliser un écran solaire adapté au climat ouest-africain sans traces blanches.",
    author: "Dr. A. Sow",
    href: "#",
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "5",
    title: "Kéloïdes : Traitements actuels",
    date: "20 Aug 2025",
    excerpt: "Les nouvelles approches pour traiter et prévenir les cicatrices chéloïdes fréquentes sur peaux noires.",
    author: "Dr. M. Fall",
    href: "#",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop"
  }
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

function BlogCard({
  post,
  softBg = "#FEF0D5",
}: {
  post: BlogPost;
  softBg?: string;
}) {
  return (
    <article
      className="shrink-0 overflow-hidden rounded-[1.75rem] border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.01]"
      style={{
        width: "min(420px, 84vw)",
        height: 280,
        background: "rgba(255, 255, 255, 0.45)", // Glassy white base
      }}
    >
      <a href={post.href} className="block h-full p-2">
        <div className="flex h-full overflow-hidden relative rounded-[1.25rem]">
          {/* Text side */}
          <div className="relative w-2/3 p-4 flex flex-col justify-between z-10">
            {/* Inner warmth - kept subtle to blend with glass */}
            <div
              className="absolute inset-0 rounded-[1rem] z-[-1]"
              style={{ background: `linear-gradient(135deg, ${softBg}80, ${softBg}40)` }}
            />
            
            <div className="flex flex-col gap-2 relative z-10">
              <time
                className="text-[13px] leading-[13px] text-[#111214]/50"
                style={{ fontWeight: 400 }}
              >
                {post.date}
              </time>
              <h3
                className="text-[20px] tracking-[-0.01em] leading-[1.05] text-[#111214]"
                style={{ fontWeight: 600 }}
              >
                {post.title}
              </h3>
              <p
                className="text-[13.5px] text-[#111214]/70 leading-[1.45] line-clamp-3"
                style={{ fontWeight: 400 }}
              >
                {post.excerpt}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[12.5px] relative z-10">
              <div className="w-6 h-6 rounded-full bg-white/40 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                <span className="text-[10px] text-[#5B1112]" style={{ fontWeight: 600 }}>
                  {post.author.charAt(4)}
                </span>
              </div>
              <span className="text-[#111214]/65" style={{ fontWeight: 400 }}>
                {post.author}
              </span>
            </div>
          </div>

          {/* Image side */}
          <div className="w-1/3 h-full relative overflow-hidden rounded-r-[1rem] -ml-2">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-700"
              style={{ objectPosition: "50% 35%" }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to left, transparent, ${softBg}20)`,
              }}
            />
          </div>
        </div>
      </a>
    </article>
  );
}

function InfiniteCarousel({
  direction = "left",
  speed = 22,
  bg = "#FFFFFF",
  softBg = "#FEF0D5",
}: {
  direction?: "left" | "right";
  speed?: number;
  bg?: string;
  softBg?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const doubled = useMemo(() => [...blogPosts, ...blogPosts], []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prefersReducedMotion) {
      el.style.transform = "translate3d(0,0,0)";
      return;
    }

    const totalWidth = el.scrollWidth / 2;
    const dir = direction === "left" ? -1 : 1;

    if (direction === "right") posRef.current = -totalWidth;

    const animate = () => {
      posRef.current += dir * (speed / 60);

      if (direction === "left" && posRef.current <= -totalWidth) posRef.current = 0;
      if (direction === "right" && posRef.current >= 0) posRef.current = -totalWidth;

      el.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, speed, prefersReducedMotion]);

  return (
    <div className="relative w-full overflow-visible py-4"> {/* overflow-visible for shadows/glass */}
      {/* Edge fades match section bg */}
      <div
        className="absolute left-0 top-0 h-full w-32 z-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(to right, ${bg}, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 h-full w-32 z-10 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(to left, ${bg}, transparent)` }}
      />

      <div ref={scrollRef} className="flex will-change-transform">
        {doubled.map((post, i) => (
          <div key={`${post.id}-${i}`} className="mx-5">
            <BlogCard post={post} softBg={softBg} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlogCarousel() {
  const SECTION_BG = "#FFFFFF";
  const SOFT_BG = "#FEF0D5";

  return (
    <section 
      id="centre-de-savoir" 
      className="relative flex flex-col items-center py-24 gap-12 overflow-hidden" 
      style={{ background: SECTION_BG }}
    >
      {/* Decorative background elements to enhance glass effect */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#FEF0D5]/30 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#5B1112]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <AnimatedSection className="relative z-10">
        <h2
          className="text-center text-[#111214] text-[clamp(34px,4vw,52px)] tracking-[-0.02em] leading-[1]"
          style={{ fontWeight: 600 }}
        >
          Centre de savoir
        </h2>
        <p
          className="mt-3 text-center text-[#111214]/60 max-w-[720px] text-[15px] leading-[1.6] px-6"
          style={{ fontWeight: 400 }}
        >
          Des ressources médicales fiables, adaptées aux réalités des peaux noires et au climat ouest-africain.
        </p>
      </AnimatedSection>

      <div className="flex flex-col gap-6 w-full relative z-10">
        <InfiniteCarousel direction="left" speed={22} bg={SECTION_BG} softBg={SOFT_BG} />
        <InfiniteCarousel direction="right" speed={22} bg={SECTION_BG} softBg={SOFT_BG} />
      </div>
    </section>
  );
}
