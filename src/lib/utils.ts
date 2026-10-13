import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CSSProperties } from "react"
import type { ImageAdjustments } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFilterStyle(adjustments: ImageAdjustments): CSSProperties {
  const { brightness, contrast, saturation, exposure, blur } = adjustments;
  return {
    filter: `
      brightness(${1 + (brightness + exposure) / 100})
      contrast(${1 + contrast / 100})
      saturate(${1 + saturation / 100})
      blur(${blur}px)
    `,
  };
}

export function getTemperatureStyle(adjustments: ImageAdjustments): CSSProperties {
  const { temperature } = adjustments;
  return {
    backgroundColor:
      temperature > 0
        ? `rgba(255, 160, 0, ${temperature / 200})`
        : `rgba(0, 100, 255, ${Math.abs(temperature) / 200})`,
    mixBlendMode: 'overlay',
  };
}

export function getTintStyle(adjustments: ImageAdjustments): CSSProperties {
  const { tint } = adjustments;
  return {
    backgroundColor:
      tint > 0
        ? `rgba(0, 255, 0, ${tint / 200})`
        : `rgba(255, 0, 255, ${Math.abs(tint) / 200})`,
    mixBlendMode: 'overlay',
  };
}

export function getVignetteStyle(adjustments: ImageAdjustments): CSSProperties {
  const vignetteStrength = adjustments.vignette / 100;
  return {
    backgroundColor: 'transparent',
    backgroundImage: `radial-gradient(circle, transparent ${50 - vignetteStrength * 50}%, rgba(0,0,0,${vignetteStrength}) 100%)`,
    mixBlendMode: 'overlay',
  };
}
