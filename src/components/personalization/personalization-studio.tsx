"use client";

import type { CSSProperties } from "react";
import { useActionState, useState } from "react";
import { savePersonalizationAction, type PersonalizationState } from "@/app/personalization/actions";
import { THEME_PRESETS, themeCssVariables, type ThemePresetId, type ThemeTokens } from "@/features/personalization/model";

const initialState: PersonalizationState = { status: "idle" };
const colorFields: { key: keyof ThemeTokens; label: string }[] = [
  { key: "cream", label: "Fondo" }, { key: "paper", label: "Papel" },
  { key: "ink", label: "Tinta" }, { key: "yellow", label: "Acento" },
  { key: "brown", label: "Portada" }, { key: "brownDark", label: "Lomo" },
];

export function PersonalizationStudio({ initialMode, initialTokens, initialReducedMotion }: { initialMode: ThemePresetId | "custom"; initialTokens: ThemeTokens; initialReducedMotion: boolean }) {
  const [state, action, pending] = useActionState(savePersonalizationAction, initialState);
  const [mode, setMode] = useState<ThemePresetId | "custom">(initialMode);
  const [tokens, setTokens] = useState(initialTokens);

  function chooseMode(next: ThemePresetId | "custom") {
    setMode(next);
    if (next !== "custom") setTokens(THEME_PRESETS[next].tokens);
  }

  const previewStyle = themeCssVariables(tokens) as CSSProperties;
  return (
    <form action={action} className="grid gap-7 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)]">
        <h2 className="font-display text-2xl font-semibold">Elige una atmósfera</h2>
        <div className="mt-5 grid gap-3">
          {Object.entries(THEME_PRESETS).map(([id, preset]) => (
            <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${mode === id ? "border-[var(--ochre)] bg-[var(--yellow-soft)]" : "border-[var(--line)]"}`}>
              <input type="radio" name="mode" value={id} checked={mode === id} onChange={() => chooseMode(id as ThemePresetId)} />
              <span className="flex gap-1" aria-hidden="true"><i className="size-5 rounded-full" style={{ background: preset.tokens.cream }} /><i className="size-5 rounded-full" style={{ background: preset.tokens.yellow }} /><i className="size-5 rounded-full" style={{ background: preset.tokens.brownDark }} /></span>
              <span className="text-sm font-bold">{preset.name}</span>
            </label>
          ))}
          <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${mode === "custom" ? "border-[var(--ochre)] bg-[var(--yellow-soft)]" : "border-[var(--line)]"}`}><input type="radio" name="mode" value="custom" checked={mode === "custom"} onChange={() => chooseMode("custom")} /><span className="text-xl" aria-hidden="true">🎨</span><span className="text-sm font-bold">Mi propia mezcla</span></label>
        </div>
        <label className="mt-6 flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="reducedMotion" defaultChecked={initialReducedMotion} className="mt-1" /><span><strong className="block">Movimiento tranquilo</strong>Reduce aperturas, giros y transiciones.</span></label>
      </section>

      <div className="space-y-7">
        <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Portada, papel y tinta</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Los colores personalizados se guardan sólo cuando eliges “Mi propia mezcla”.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorFields.map(({ key, label }) => <label key={key} className="grid gap-2 text-sm font-bold">{label}<input type="color" name={key} value={String(tokens[key])} onChange={(event) => { setMode("custom"); setTokens((current) => ({ ...current, [key]: event.target.value })); }} className="h-14 w-full rounded-2xl border border-[var(--line)] bg-[#fff8e8] p-1" /></label>)}
          </div>
          <label className="mt-5 grid max-w-sm gap-2 text-sm font-bold">Tipografía de títulos<select name="displayFont" value={tokens.displayFont} onChange={(event) => { setMode("custom"); setTokens((current) => ({ ...current, displayFont: event.target.value as ThemeTokens["displayFont"] })); }} className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal"><option value="classic">Clásica</option><option value="friendly">Manuscrita</option><option value="elegant">Elegante</option></select></label>
          {(["muted", "line", "yellowSoft", "ochre", "brownLight", "sage", "sageSoft", "sageDark"] as const).map((key) => <input type="hidden" name={key} value={tokens[key]} key={key} />)}
        </section>

        <section className="overflow-hidden rounded-[1.8rem] border border-[var(--line)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" style={{ ...previewStyle, background: "var(--cream)", color: "var(--ink)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--ochre)" }}>Vista previa</p>
          <h2 className="font-display mt-2 text-4xl font-semibold">Un rincón que se siente tuyo.</h2>
          <div className="mt-6 rounded-[1.5rem] border p-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}><p className="leading-7" style={{ color: "var(--muted)" }}>La portada, el papel, la tinta y los acentos de Green Days responderán a esta paleta.</p><span className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold" style={{ background: "var(--yellow)", color: "var(--brown-dark)" }}>Así se verá un botón</span></div>
        </section>
        <div className="flex flex-wrap items-center gap-4"><button disabled={pending} className="rounded-full bg-[var(--yellow)] px-7 py-3 text-sm font-bold text-[var(--brown-dark)] disabled:opacity-60">{pending ? "Guardando…" : "Aplicar a mi espacio"}</button>{state.message && <p role="status" className={`text-sm font-semibold ${state.status === "error" ? "text-[#8b3e2c]" : "text-[var(--sage-dark)]"}`}>{state.message}</p>}</div>
      </div>
    </form>
  );
}
