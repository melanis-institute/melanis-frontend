import { classNames } from "@shared/lib/classNames";

interface BodySilhouetteProps {
  selectedAreas: string[];
  className?: string;
}

export function BodySilhouette({ selectedAreas, className }: BodySilhouetteProps) {
  const has = (area: string) => selectedAreas.includes(area);
  const skin = "#F4E8D2";
  const outline = "#BBA07A";
  const hair = "#C8A67A";
  const detail = "rgba(187,160,122,0.42)";
  const selectedFill = "rgba(91,17,18,0.14)";
  const selectedStroke = "#7B2324";

  const fill = (area: string) => (has(area) ? selectedFill : skin);
  const stroke = (area: string) => (has(area) ? selectedStroke : outline);
  const detailStroke = (area: string) => (has(area) ? "rgba(123,35,36,0.28)" : detail);

  return (
    <svg
      viewBox="0 0 260 444"
      fill="none"
      className={classNames("mx-auto drop-shadow-sm", className)}
      aria-hidden
    >
      <path
        d="M100 50 C99 30 111 18 130 18 C149 18 161 30 160 50 C156 38 146 30 130 30 C114 30 104 38 100 50Z"
        fill={has("cuir-chevelu") ? selectedFill : hair}
        stroke={stroke("cuir-chevelu")}
        strokeWidth="1.6"
        className="transition-colors duration-300"
      />
      <ellipse
        cx="130"
        cy="57"
        rx="27"
        ry="33"
        fill={fill("visage")}
        stroke={stroke("visage")}
        strokeWidth="2"
        className="transition-colors duration-300"
      />
      <path
        d="M116 88 L144 88 L146 104 L114 104Z"
        fill={fill("torse")}
        stroke="none"
        className="transition-colors duration-300"
      />
      <path
        d="M78 112 C70 112 60 116 52 126 C46 134 44 150 44 168 L44 222 C44 238 46 252 48 264 C50 272 52 280 52 286 C52 294 55 301 62 304 C69 307 75 302 77 296 C79 289 77 280 75 272 C73 262 73 246 73 230 L73 188 C75 166 79 146 83 128 C85 120 83 114 78 112Z"
        fill={fill("bras")}
        stroke={stroke("bras")}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
      <path
        d="M182 112 C190 112 200 116 208 126 C214 134 216 150 216 168 L216 222 C216 238 214 252 212 264 C210 272 208 280 208 286 C208 294 205 301 198 304 C191 307 185 302 183 296 C181 289 183 280 185 272 C187 262 187 246 187 230 L187 188 C185 166 181 146 177 128 C175 120 177 114 182 112Z"
        fill={fill("bras")}
        stroke={stroke("bras")}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
      <path
        d="M114 104 C104 106 90 112 78 120 C74 123 73 126 75 130 C79 116 81 116 83 120 C87 138 89 160 89 182 C89 200 87 214 85 224 C83 232 82 240 84 250 C86 260 92 268 106 272 L154 272 C168 268 174 260 176 250 C178 240 177 232 175 224 C173 214 171 200 171 182 C171 160 173 138 177 120 C179 116 181 116 185 130 C187 126 186 123 182 120 C170 112 156 106 146 104Z"
        fill={fill("torse")}
        stroke={stroke("torse")}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
      <path
        d="M106 272 C98 264 88 256 84 248 C82 256 84 266 92 276 C102 284 116 288 130 288 C144 288 158 284 168 276 C176 266 178 256 176 248 C172 256 162 264 154 272Z"
        fill={has("intime") ? "rgba(0,65,94,0.14)" : skin}
        stroke={has("intime") ? "#00415E" : outline}
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      <path
        d="M106 272 C114 276 122 278 130 278 C138 278 146 276 154 272"
        stroke={has("intime") ? "#00415E" : detail}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M106 272 C98 274 90 282 87 295 L85 323 C85 335 85 343 87 354 C91 370 93 388 93 404 C93 414 91 422 89 430 C87 436 91 440 101 440 L122 440 C130 440 132 436 131 430 C130 424 126 415 123 406 C120 394 120 378 120 362 C120 345 118 328 116 314 L114 295 C112 283 110 275 106 272Z"
        fill={fill("jambes")}
        stroke={stroke("jambes")}
        strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />
      <path
        d="M154 272 C162 274 170 282 173 295 L175 323 C175 335 175 343 173 354 C169 370 167 388 167 404 C167 414 169 422 171 430 C173 436 169 440 159 440 L138 440 C130 440 128 436 129 430 C130 424 134 415 137 406 C140 394 140 378 140 362 C140 345 142 328 144 314 L146 295 C148 283 150 275 154 272Z"
        fill={fill("jambes")}
        stroke={stroke("jambes")}
        strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />
      <path d="M130 106 L130 224" stroke={detailStroke("torse")} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M93 130 C101 126 112 126 121 130" stroke={detailStroke("torse")} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M139 130 C148 126 159 126 167 130" stroke={detailStroke("torse")} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M118 162 C121 159 126 159 130 159 C134 159 139 159 142 162" stroke={detailStroke("torse")} strokeWidth="1" strokeLinecap="round" />
      <path d="M118 184 C121 181 126 181 130 181 C134 181 139 181 142 184" stroke={detailStroke("torse")} strokeWidth="1" strokeLinecap="round" />
      <ellipse
        cx="100"
        cy="342"
        rx="13"
        ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={stroke("jambes")}
        strokeWidth="1.2"
        className="transition-colors duration-300"
      />
      <ellipse
        cx="160"
        cy="342"
        rx="13"
        ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={stroke("jambes")}
        strokeWidth="1.2"
        className="transition-colors duration-300"
      />
      <path d="M48 224 C50 230 52 234 54 238" stroke={has("bras") ? "rgba(122,35,36,0.2)" : detail} strokeWidth="1" strokeLinecap="round" />
      <path d="M212 224 C210 230 208 234 206 238" stroke={has("bras") ? "rgba(122,35,36,0.2)" : detail} strokeWidth="1" strokeLinecap="round" />
      <path d="M55 292 C56 298 58 302 62 304" stroke={has("ongles") ? selectedStroke : outline} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M205 292 C204 298 202 302 198 304" stroke={has("ongles") ? selectedStroke : outline} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M100 436 C104 439 110 440 116 440" stroke={has("ongles") ? selectedStroke : outline} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M160 436 C156 439 150 440 144 440" stroke={has("ongles") ? selectedStroke : outline} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
    </svg>
  );
}
