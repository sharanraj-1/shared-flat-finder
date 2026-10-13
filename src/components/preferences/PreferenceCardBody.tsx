"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { PreferenceCard, Priority } from "@/lib/preferenceDeck";
import { CATEGORY_META } from "@/lib/preferenceDeck";
import type { CommitFn } from "@/components/SwipeStack";
import { PriorityChips } from "./PriorityChips";

export function priorityToDragParams(priority: Priority): { direction: "left" | "right"; intensity: number } {
  switch (priority) {
    case "DEALBREAKER":
      return { direction: "left", intensity: 1 };
    case "NICE":
      return { direction: "left", intensity: 0.3 };
    case "PREFER":
      return { direction: "right", intensity: 0.3 };
    case "MUST_HAVE":
      return { direction: "right", intensity: 1 };
  }
}

export function dragParamsToPriority(direction: "left" | "right", intensity: number): Priority {
  if (direction === "left") return intensity >= 0.6 ? "DEALBREAKER" : "NICE";
  return intensity >= 0.6 ? "MUST_HAVE" : "PREFER";
}

interface Props {
  card: PreferenceCard;
  index: number;
  total: number;
  commit: CommitFn;
  onValueChange: (value: unknown) => void;
}

export function PreferenceCardBody({ card, index, total, commit, onValueChange }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between bg-gradient-to-br from-brand to-accent px-6 py-4 text-brand-foreground">
        <span className="text-xs font-bold uppercase tracking-wide opacity-90">{CATEGORY_META[card.category].label}</span>
        <span className="text-xs font-bold opacity-90">
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h2 className="text-2xl font-extrabold leading-snug">{card.label}</h2>
          <p className="mt-2 text-muted">{card.question}</p>
        </div>

        <div className="mt-6">
          {card.kind === "priority" && (
            <PriorityChips
              variant="generic"
              onPick={(p) => {
                const { direction, intensity } = priorityToDragParams(p);
                commit(direction, intensity);
              }}
            />
          )}

          {card.kind === "location" && (
            <PriorityChips
              variant="location"
              onPick={(p) => {
                const { direction, intensity } = priorityToDragParams(p);
                commit(direction, intensity);
              }}
            />
          )}

          {card.kind === "choice" && (
            <ChoiceBody
              card={card}
              commit={commit}
              onValueChange={onValueChange}
            />
          )}

          {card.kind === "budget" && <BudgetBody commit={commit} onValueChange={onValueChange} />}

          {card.kind === "commute" && <CommuteBody card={card} commit={commit} onValueChange={onValueChange} />}
        </div>
      </div>
    </div>
  );
}

function ChoiceBody({
  card,
  commit,
  onValueChange,
}: {
  card: Extract<PreferenceCard, { kind: "choice" }>;
  commit: CommitFn;
  onValueChange: (value: unknown) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {card.choices.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setSelected(c.value);
              onValueChange({ choice: c.value });
            }}
            className={clsx(
              "rounded-full border-2 px-4 py-2 text-sm font-bold transition",
              selected === c.value
                ? "border-brand bg-brand-soft text-brand"
                : "border-border bg-background text-foreground hover:border-brand"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {selected && (
        <div>
          <p className="mb-2 text-sm font-semibold text-muted">How important is this?</p>
          <PriorityChips
            variant="generic"
            onPick={(p) => {
              const { direction, intensity } = priorityToDragParams(p);
              commit(direction, intensity);
            }}
          />
        </div>
      )}
    </div>
  );
}

function BudgetBody({ commit, onValueChange }: { commit: CommitFn; onValueChange: (value: unknown) => void }) {
  const [comfortable, setComfortable] = useState(22000);
  const [max, setMax] = useState(28000);

  return (
    <div className="flex flex-col gap-5">
      <SliderField
        label="Comfortable monthly contribution"
        value={comfortable}
        min={5000}
        max={60000}
        step={500}
        onChange={setComfortable}
      />
      <SliderField
        label="Absolute maximum"
        value={max}
        min={comfortable}
        max={80000}
        step={500}
        onChange={setMax}
      />
      <button
        onClick={() => {
          onValueChange({ comfortable, max: Math.max(max, comfortable) });
          commit("right", 1);
        }}
        className="rounded-2xl bg-brand py-3 text-sm font-bold text-brand-foreground"
      >
        Continue
      </button>
    </div>
  );
}

function CommuteBody({
  card,
  commit,
  onValueChange,
}: {
  card: Extract<PreferenceCard, { kind: "commute" }>;
  commit: CommitFn;
  onValueChange: (value: unknown) => void;
}) {
  const [minutes, setMinutes] = useState(card.mode === "max" ? 40 : 20);

  return (
    <div className="flex flex-col gap-5">
      <SliderField label="Minutes" value={minutes} min={5} max={90} step={5} onChange={setMinutes} suffix=" min" />
      <button
        onClick={() => {
          onValueChange({ minutes });
          commit("right", 1);
        }}
        className="rounded-2xl bg-brand py-3 text-sm font-bold text-brand-foreground"
      >
        Continue
      </button>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className="text-sm font-extrabold text-brand">
          {suffix === " min" ? `${value}${suffix}` : `₹${value.toLocaleString("en-IN")}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand)]"
      />
    </div>
  );
}
