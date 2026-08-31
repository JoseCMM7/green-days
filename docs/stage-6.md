# Etapa 6: editor creativo avanzado

La etapa 6 comenzó con la estructura que necesitan fotografías, audio y otras
capas visuales: un libro que puede crecer y un lienzo con coordenadas persistentes.

## Primer incremento implementado

### Libro multipágina

- Cada entrada comienza con un pliego de dos páginas y puede crecer hasta 40.
- Los pliegos se recorren sin abandonar el editor.
- Las páginas nuevas heredan papel, rayado, tinta y tipografía de las primeras.
- Sólo se puede retirar el último pliego y nunca se permite dejar un libro con
  menos de dos páginas.
- El autoguardado existente persiste el libro completo y genera una revisión.

### Dibujo libre

- Herramienta separada del modo de escritura y movimiento de stickers.
- Selector de color y cuatro grosores.
- Deshacer el último trazo o limpiar los dibujos de la página activa.
- Pointer Events permiten usar ratón, lápiz o pantalla táctil.
- Cada punto se normaliza entre `0` y `1` y se guarda en MongoDB como un elemento
  `drawing`. SVG lo representa proporcionalmente en cualquier pantalla.

## Decisiones técnicas

Las operaciones de páginas y trazos viven en `features/journal/book-pages.ts`.
Son funciones puras y probables de forma aislada; el componente React se ocupa
únicamente de interacción, previsualización y autoguardado.

No fue necesaria una migración: el esquema documental de MongoDB ya contemplaba
páginas múltiples y elementos de dibujo desde la etapa de arquitectura.

## Próximos incrementos de la etapa 6

1. Fotografías privadas mediante Supabase Storage, con posición y recorte.
2. Audio adjunto y, cuando se habilite el permiso, grabación desde el navegador.
3. Historial visible para consultar y recuperar revisiones anteriores.
4. Controles comunes de capas, rotación y tamaño para todos los elementos.

La etapa sigue en desarrollo local y no se ha desplegado.
