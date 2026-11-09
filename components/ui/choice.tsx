"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// 整列可點的作答選項（雜誌條目樣式）。語意上仍是 radio / checkbox，
// 鍵盤操作與螢幕閱讀器行為由 Base UI 提供。
const choiceClass =
  "group/choice relative flex w-full cursor-pointer items-center gap-4 border-t border-ink/15 py-4 pr-3 pl-1 text-left text-[1.05rem] leading-snug transition-[background-color,color,padding] duration-300 ease-[var(--ease-dream)] outline-none select-none last:border-b not-data-checked:hover:bg-haze/25 hover:pl-3 not-data-checked:focus-visible:bg-haze/25 focus-visible:pl-3 data-checked:bg-ink data-checked:pl-3 data-checked:text-paper sm:py-5 sm:text-lg"

const markerClass =
  "grid size-9 shrink-0 place-items-center rounded-full border border-current font-display text-sm font-semibold uppercase italic transition-colors group-data-checked/choice:border-coral group-data-checked/choice:bg-coral group-data-checked/choice:text-ink"

function ChoiceMarker({ marker, checkIcon }: { marker: string; checkIcon?: boolean }) {
  return (
    <span aria-hidden className={markerClass}>
      {checkIcon ? (
        <>
          <span className="group-data-checked/choice:hidden">{marker}</span>
          <Check className="hidden size-4 animate-stamp group-data-checked/choice:block" strokeWidth={3} />
        </>
      ) : (
        <span className="group-data-checked/choice:animate-stamp">{marker}</span>
      )}
    </span>
  )
}

function ChoiceRadio({
  marker,
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props & { marker: string }) {
  return (
    <RadioPrimitive.Root data-slot="choice" className={cn(choiceClass, className)} {...props}>
      <ChoiceMarker marker={marker} />
      <span className="flex-1">{children}</span>
    </RadioPrimitive.Root>
  )
}

function ChoiceCheckbox({
  marker,
  className,
  children,
  ...props
}: CheckboxPrimitive.Root.Props & { marker: string }) {
  return (
    <CheckboxPrimitive.Root data-slot="choice" className={cn(choiceClass, className)} {...props}>
      <ChoiceMarker marker={marker} checkIcon />
      <span className="flex-1">{children}</span>
    </CheckboxPrimitive.Root>
  )
}

export { ChoiceCheckbox, ChoiceRadio }
