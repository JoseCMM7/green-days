import { z } from "zod";

const color = z.string().regex(/^#[0-9a-f]{6}$/i);

export const themeTokensSchema = z.object({
  cream: color,
  paper: color,
  ink: color,
  muted: color,
  line: color,
  yellow: color,
  yellowSoft: color,
  ochre: color,
  brownLight: color,
  brown: color,
  brownDark: color,
  sage: color,
  sageSoft: color,
  sageDark: color,
  displayFont: z.enum(["classic", "friendly", "elegant"]),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type ThemePresetId = "warm-paper" | "golden-hour" | "forest-floor" | "cocoa-night";

export const THEME_PRESETS: Record<ThemePresetId, { name: string; tokens: ThemeTokens }> = {
  "warm-paper": { name: "Papel cálido", tokens: { cream: "#efe0bd", paper: "#f9edd1", ink: "#493625", muted: "#806b55", line: "#ddc79c", yellow: "#eebc3f", yellowSoft: "#f8dc8a", ochre: "#9a641e", brownLight: "#cfad78", brown: "#805735", brownDark: "#5a3a24", sage: "#a7a77a", sageSoft: "#ded9b6", sageDark: "#62684e", displayFont: "classic" } },
  "golden-hour": { name: "Hora dorada", tokens: { cream: "#f0d39c", paper: "#ffedc4", ink: "#4a2d1f", muted: "#79533d", line: "#d3a360", yellow: "#f2aa2e", yellowSoft: "#ffd97a", ochre: "#a45417", brownLight: "#ca8d55", brown: "#7a4528", brownDark: "#4d2a20", sage: "#9b925f", sageSoft: "#ded49b", sageDark: "#5c5c3d", displayFont: "friendly" } },
  "forest-floor": { name: "Suelo del bosque", tokens: { cream: "#d9d2ad", paper: "#eee6c8", ink: "#30382b", muted: "#61664f", line: "#b5aa7e", yellow: "#d6a936", yellowSoft: "#e8cf7a", ochre: "#7b6120", brownLight: "#aa8d63", brown: "#66503a", brownDark: "#3c382a", sage: "#82906b", sageSoft: "#c4c9a3", sageDark: "#46533d", displayFont: "classic" } },
  "cocoa-night": { name: "Noche de cacao", tokens: { cream: "#c7a982", paper: "#ead6b7", ink: "#34241e", muted: "#674f43", line: "#a98568", yellow: "#e0a93b", yellowSoft: "#ebc86d", ochre: "#80541e", brownLight: "#9f775a", brown: "#604236", brownDark: "#33231f", sage: "#78806b", sageSoft: "#adb196", sageDark: "#444b3e", displayFont: "elegant" } },
};

export const personalizationInputSchema = z.object({
  mode: z.enum(["warm-paper", "golden-hour", "forest-floor", "cocoa-night", "custom"]),
  reducedMotion: z.boolean(),
  tokens: themeTokensSchema,
});

const fontFamilies: Record<ThemeTokens["displayFont"], string> = {
  classic: 'Georgia, "Times New Roman", serif',
  friendly: 'var(--font-pencil), "Segoe Print", "Bradley Hand", cursive',
  elegant: 'Garamond, Georgia, serif',
};

export function themeCssVariables(tokens: ThemeTokens) {
  return {
    "--cream": tokens.cream, "--paper": tokens.paper, "--ink": tokens.ink,
    "--muted": tokens.muted, "--line": tokens.line, "--yellow": tokens.yellow,
    "--yellow-soft": tokens.yellowSoft, "--ochre": tokens.ochre,
    "--brown-light": tokens.brownLight, "--brown": tokens.brown,
    "--brown-dark": tokens.brownDark, "--sage": tokens.sage,
    "--sage-soft": tokens.sageSoft, "--sage-dark": tokens.sageDark,
    "--display-font": fontFamilies[tokens.displayFont],
  };
}
