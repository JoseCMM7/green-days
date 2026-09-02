# Etapa 9: el diario como objeto físico

Esta etapa cambia el centro de la experiencia: el usuario ya no navega una lista
de páginas mediante un menú, sino que abre, toca, escribe y hojea un libro. Todo
continúa funcionando localmente y no se realizó ningún despliegue.

## Apariencia cinematográfica

- La portada usa una textura fotográfica original de cuero cognac envejecido,
  generada para Green Days y optimizada a 768 × 768 píxeles y 173 KB.
- Gradientes, doble borde dorado, patina, lomo sombreado y profundidad convierten
  esa textura en una cubierta con volumen.
- El bloque inferior representa el canto de decenas de hojas mediante líneas de
  papel y una sombra proyectada sobre la mesa.
- Las páginas tienen fibra, pequeñas imperfecciones, curvatura hacia el lomo y
  una hoja intermedia durante la animación de cambio.
- Las preferencias de movimiento reducido continúan anulando las animaciones.

El archivo final vive en `public/textures/aged-leather-cover.jpg`; no depende de
un servidor externo.

## Escritura editable

Next.js carga y sirve de forma local la fuente variable Caveat mediante
`next/font`. El tamaño persistido en MongoDB ahora sí se transforma en tamaño
visual dentro de la página lógica.

Al enfocar un texto aparece un tirador para mover su caja, otro para cambiar
simultáneamente sus dimensiones y tipografía, y uno más para girarlo libremente.
Una regla visible sobre el libro ofrece además tamaño `−`/`+` y giro hacia ambos
lados sin obligar a abrir el estuche. Los libros
creados con la antigua caja bloqueada se preparan en memoria: se cambia la fuente
anterior por la nueva y se desbloquea únicamente el marco legado de 840 × 1120;
el documento original no se muta hasta que el usuario realiza y guarda un cambio.

## Capas entre páginas

Fotografías, audios, stickers y cajas de texto se pueden redimensionar. Al
arrastrar una capa a través del lomo, el editor detecta la página bajo el puntero,
retira el elemento de la página de origen y lo inserta en la de destino conservando
un marco válido. También existe el botón explícito `Mover a página N`, útil con
teclado o en pantallas pequeñas.

La transferencia aumenta su `zIndex` en la página receptora y queda incluida en
el mismo historial de deshacer. No duplica fotografías ni archivos privados.

## Navegación física

- Desapareció la lista de números de pliego.
- Las esquinas exteriores del libro funcionan como áreas para hojear.
- En móvil hay un control de páginas adherido a la parte inferior del libro, ya
  que sus esquinas completas quedan fuera del ancho visible.
- Los gestos horizontales siguen funcionando sobre el papel libre.
- El menú global se oculta en `/journal/*`; quedan solamente salidas discretas
  hacia el calendario y las cápsulas.
- Una salida fija permanece visible con el libro cerrado o abierto y permite
  volver al calendario aunque el usuario no haya escrito nada.
- Las herramientas creativas están plegadas dentro de un “estuche de escritura”.

## Calendario como separador

Cada fecha pasada o presente del calendario es ahora un enlace directo a
`/journal/AAAA-MM-DD?open=1`. El libro llega abierto y muestra una cinta ocre con
la fecha, como un separador físico. Los días futuros aparecen desactivados y no
crean entradas antes de tiempo.

## Refinamiento visual humano

- El separador de fecha permanece invisible detrás de la portada cerrada y sólo
  aparece cuando el diario ya está abierto.
- Se retiraron los fondos con manchas luminosas, `backdrop-filter`, paneles de
  vidrio y sombras desenfocadas que no representaban un material real.
- Los degradados conservados tienen una función concreta: simular papel, cuero,
  fibra, canto o volumen del libro.
- La navegación principal usa subrayado y superficies opacas; la pantalla de
  acceso parece una hoja pegada sobre una mesa, con bordes ligeramente irregulares.
- El logotipo original entregado para Green Days reemplaza la marca genérica
  anterior y se sirve localmente desde `public/green-days-logo.png`.
- Un segundo ajuste amplía y reencuadra ese logotipo, convierte la cabecera en
  una franja cálida de papel y devuelve estados activos claros a la navegación
  sin usar transparencias ni desenfoques.
- El fondo general usa tonos miel y una fibra apenas visible. Las tarjetas
  principales emplean bordes irregulares, cinta y sombras cortas para evitar la
  cuadrícula excesivamente perfecta de una plantilla generada.

## Verificación

- 28 pruebas de lógica y modelo aprobadas.
- TypeScript y ESLint sin errores.
- Compilación de producción correcta con Next.js 16.3.3.
- 8 pruebas públicas de Playwright aprobadas; 2 autenticadas omitidas por no
  existir credenciales E2E locales.
- Revisión visual del libro cerrado y abierto en escritorio.
- Revisión móvil a 390 × 844 sin desbordamiento del documento; el lienzo del
  libro conserva desplazamiento horizontal interno y controles visibles.
- Consola del navegador sin errores durante la revisión.

Cuando ya existe un servidor local, Playwright puede reutilizarlo sin detenerlo:

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
pnpm test:e2e
```
