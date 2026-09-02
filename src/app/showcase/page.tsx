import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Green Days — Un diario que se siente como un libro",
  description: "Conoce la experiencia, privacidad y arquitectura de Green Days.",
};

const features = [
  { icon: "📖", title: "Un libro por cada día", text: "Escritura, dibujo, stickers, fotografías y audio en páginas que conservan su composición." },
  { icon: "🗓️", title: "Calendario emocional", text: "Cada emoción colorea el tiempo y permite volver a una fecha sin perder su contexto." },
  { icon: "⌛", title: "Recuerdos conectados", text: "Álbumes vivos y cápsulas del tiempo enlazan momentos sin convertirlos en una lista de productividad." },
];

export default function ShowcasePage() {
  return (
    <main className="overflow-hidden pb-24">
      <section className="relative px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="relative mx-auto grid max-w-[82rem] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ochre)]">Guarda la vida mientras sucede</p><h1 className="font-display mt-4 max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Un diario digital que todavía se siente como un libro.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Green Days es un espacio privado para escribir, dibujar y reunir recuerdos con calma. La tecnología permanece detrás; lo primero es la sensación de abrir algo propio.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/auth/sign-up" className="rounded-full bg-[var(--yellow)] px-6 py-3.5 font-bold text-[var(--brown-dark)] shadow-lg">Crear mi diario</Link><Link href="/auth/login" className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-6 py-3.5 font-bold text-[var(--brown)]">Ya tengo una cuenta</Link></div></div>
          <div className="relative mx-auto w-full max-w-xl" aria-label="Representación de un libro abierto"><div className="relative grid aspect-[10/7] grid-cols-2 overflow-hidden rounded-[1.5rem] border-[.6rem] border-[#70451f] bg-[#70451f] shadow-[0.7rem_0.85rem_0_#4d2f18] [transform:rotateX(5deg)_rotateZ(-1deg)]"><div className="relative rounded-l-xl bg-[#fbf0d4] p-[12%] shadow-inner"><span className="font-display text-[clamp(.8rem,2.4vw,1.7rem)] leading-relaxed text-[var(--brown)]">Hoy el sol entró por la ventana y todo pareció un poco más amable.</span><span className="absolute bottom-[10%] right-[12%] text-[clamp(1.5rem,5vw,3.5rem)]">🌼</span></div><div className="relative rounded-r-xl bg-[#f6e8c7] p-[12%] shadow-inner"><div className="h-[55%] rotate-2 rounded-lg border-4 border-white bg-[linear-gradient(145deg,#efc95e,#9fa778)] shadow-lg" /><p className="mt-[8%] text-center text-[clamp(.55rem,1.6vw,.9rem)] text-[var(--muted)]">Un martes tranquilo</p></div></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-12" aria-labelledby="features-title"><p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--ochre)]">Recuerdos, no métricas</p><h2 id="features-title" className="font-display mx-auto mt-3 max-w-3xl text-center text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Diseñado para regresar a lo que sentiste.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-7 shadow-[0_18px_50px_rgba(91,59,32,.08)]"><span className="text-4xl" aria-hidden="true">{feature.icon}</span><h3 className="font-display mt-5 text-2xl font-semibold">{feature.title}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{feature.text}</p></article>)}</div></section>

      <section className="mx-auto mt-24 grid max-w-[82rem] gap-7 px-5 sm:px-8 lg:grid-cols-2 lg:px-12"><article className="rounded-[2rem] bg-[var(--brown-dark)] p-8 text-[var(--paper)] sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#edca7a]">Privacidad desde la arquitectura</p><h2 className="font-display mt-3 text-4xl font-semibold">Tus páginas no son contenido público.</h2><p className="mt-5 leading-8 text-[#ead9c1]">Autenticación y archivos privados con Supabase, relaciones verificables en PostgreSQL y libros versionados en MongoDB. Cada lectura y escritura comprueba primero a su propietario.</p></article><article className="rounded-[2rem] border border-[var(--line)] bg-[#f4dfae] p-8 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--ochre)]">Construido para evolucionar</p><h2 className="font-display mt-3 text-4xl font-semibold">Una aplicación híbrida, no una maqueta.</h2><p className="mt-5 leading-8 text-[var(--muted)]">Next.js y React crean la experiencia; Drizzle mantiene SQL legible; Zod protege documentos flexibles; Playwright comprueba escritorio y móvil. Todo el historial técnico permanece versionado en Git.</p></article></section>
    </main>
  );
}
