"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#efe0bd", color: "#493625", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
          <section style={{ maxWidth: 560, border: "1px solid #ddc79c", borderRadius: 28, background: "#f9edd1", padding: 36, textAlign: "center" }}>
            <p style={{ fontSize: 44, margin: 0 }} aria-hidden="true">🌿</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, margin: "18px 0 10px" }}>Green Days necesita un momento.</h1>
            <p style={{ lineHeight: 1.6, color: "#806b55" }}>Ocurrió un error inesperado. Tus recuerdos no fueron eliminados.</p>
            <button onClick={() => retry()} style={{ marginTop: 20, border: 0, borderRadius: 999, background: "#eebc3f", padding: "12px 22px", color: "#493625", fontWeight: 700, cursor: "pointer" }}>
              Intentar nuevamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

