import type { Ref } from "react"

import type { Emblem } from "@/lib/quiz/emblem"
import { cn } from "@/lib/utils"

function petalPath(length: number, width: number) {
  const l = length
  const w = width
  return `M0 0 C ${w} ${-l * 0.3} ${w * 0.9} ${-l * 0.85} 0 ${-l} C ${-w * 0.9} ${-l * 0.85} ${-w} ${-l * 0.3} 0 0 Z`
}

function sparklePath(size: number) {
  const s = size
  return `M0 ${-s} Q0 0 ${s} 0 Q0 0 0 ${s} Q0 0 ${-s} 0 Q0 0 0 ${-s} Z`
}

const ink = "var(--ink)"
const paper = "var(--paper)"

/**
 * 人格徽章：花瓣＝各結果類型的得分比例，中央是一顆會做夢的星球。
 * 顏色只用 CSS 變數；下載結果卡時會把變數解析成實際色值。
 */
export function PersonaEmblem({
  emblem,
  title,
  animated = true,
  className,
  ref,
}: {
  emblem: Emblem
  /** 提供時作為圖片的替代文字，否則視為裝飾 */
  title?: string
  animated?: boolean
  className?: string
  ref?: Ref<SVGSVGElement>
}) {
  const { petals, stars, face, ringTilt, ringRadius, coreRadius } = emblem
  const eyeY = -coreRadius * 0.12
  const eyeX = coreRadius * 0.38

  return (
    <svg
      ref={ref}
      viewBox="-100 -100 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* 星軌 */}
      <g
        className={animated ? "animate-orbit" : undefined}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
      >
        <ellipse
          rx={ringRadius + 26}
          ry={(ringRadius + 26) * 0.34}
          transform={`rotate(${ringTilt})`}
          fill="none"
          stroke={ink}
          strokeWidth={0.9}
          strokeDasharray="1.5 4.5"
          strokeLinecap="round"
        />
      </g>

      {/* 花冠 */}
      {petals.map((petal, i) => (
        <g key={i} transform={`rotate(${petal.angle})`}>
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "50% 100%",
              animation: animated
                ? `bloom 0.9s var(--ease-dream) ${0.15 + i * 0.07}s both`
                : undefined,
            }}
          >
            <path
              d={petalPath(petal.length, petal.width)}
              fill={`var(--persona-${petal.colorIndex})`}
              stroke={ink}
              strokeWidth={petal.highlight ? 1.8 : 1.1}
              strokeLinejoin="round"
            />
            <path
              d={`M0 ${-coreRadius - 2} L0 ${-petal.length * 0.82}`}
              stroke={ink}
              strokeWidth={0.7}
              strokeLinecap="round"
              opacity={0.5}
            />
            {petal.highlight && (
              <circle cy={-petal.length - 7} r={3.2} fill="var(--citron)" stroke={ink} strokeWidth={1.2} />
            )}
          </g>
        </g>
      ))}

      {/* 做夢的星球 */}
      <circle r={coreRadius} fill={paper} stroke={ink} strokeWidth={1.6} />
      <g stroke={ink} strokeWidth={1.6} strokeLinecap="round" fill="none">
        {face === "dots" ? (
          <>
            <circle cx={-eyeX} cy={eyeY} r={1.6} fill={ink} stroke="none" />
            <circle cx={eyeX} cy={eyeY} r={1.6} fill={ink} stroke="none" />
          </>
        ) : (
          <>
            <path d={`M${-eyeX - 3.5} ${eyeY} q3.5 3.5 7 0`} />
            {face === "wink" ? (
              <circle cx={eyeX} cy={eyeY} r={1.6} fill={ink} stroke="none" />
            ) : (
              <path d={`M${eyeX - 3.5} ${eyeY} q3.5 3.5 7 0`} />
            )}
          </>
        )}
        <path d={`M-3 ${coreRadius * 0.32} q3 2.6 6 0`} />
      </g>
      <ellipse cx={-eyeX - 2} cy={coreRadius * 0.22} rx={3} ry={1.6} fill="var(--coral)" opacity={0.55} />
      <ellipse cx={eyeX + 2} cy={coreRadius * 0.22} rx={3} ry={1.6} fill="var(--coral)" opacity={0.55} />

      {/* 星點 */}
      {stars.map((star, i) => (
        <g key={i} transform={`translate(${star.x} ${star.y})`}>
          <path
            d={sparklePath(star.r * 2.2)}
            fill={i % 3 === 0 ? "var(--citron)" : ink}
            stroke={i % 3 === 0 ? ink : "none"}
            strokeWidth={0.6}
            className={animated ? "animate-twinkle" : undefined}
            style={{
              transformBox: "fill-box",
              transformOrigin: "50% 50%",
              animationDelay: `${star.delay}s`,
            }}
          />
        </g>
      ))}
    </svg>
  )
}
