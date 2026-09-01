# Etapa 7: estabilización del producto

La etapa 7 fortalece el editor antes de publicar Green Days. No añade otra base
de datos ni despliega la aplicación: mejora recuperación, accesibilidad y la
capacidad de detectar regresiones automáticamente.

## Edición recuperable

- Historial local de hasta 50 estados con botones para deshacer y rehacer.
- Atajos `Ctrl/Cmd + Z`, `Ctrl/Cmd + Mayús + Z` y `Ctrl + Y`.
- La escritura continua se agrupa para que una palabra no consuma un paso por
  cada tecla; arrastrar o redimensionar también registra un solo estado.
- Se puede duplicar una capa sin duplicar el archivo privado que utiliza.
- El historial persistente de MongoDB continúa siendo una segunda red de
  seguridad entre sesiones.

## Controles accesibles y táctiles

- Una capa enfocada con teclado queda seleccionada.
- Las flechas mueven la capa; `Mayús` aumenta el desplazamiento, `Suprimir` la
  quita y `Escape` cancela la selección.
- Fotografías, stickers y audios tienen un tirador táctil para redimensionar.
- Las fotografías permiten mover el punto de encuadre además de cambiar filtro.
- Los controles anuncian sus atajos y estados mediante nombres accesibles.

## Resiliencia del autoguardado

- Green Days detecta los eventos `online` y `offline` del navegador.
- Una caída de red conserva los cambios en memoria y muestra un aviso visible.
- Los reintentos usan espera progresiva de 2 a 30 segundos para no saturar la
  aplicación o la base de datos.
- Al volver internet, el editor intenta guardar inmediatamente.
- Si se intenta cerrar una pestaña con cambios pendientes, el navegador muestra
  su advertencia de salida.

Los archivos retirados de la página se conservan de forma privada mientras
existan versiones históricas que puedan referenciarlos. Se eliminan junto con la
cuenta; una limpieza futura deberá comprobar primero todas las revisiones.

## Pruebas

- 19 pruebas unitarias y de modelo cubren fechas, documentos, medios, seguridad,
  duplicación, movimiento, límites, recorte e historial local.
- 6 pruebas E2E con Playwright ejecutan tres flujos en escritorio y móvil:
  acceso/registro, protección de páginas y APIs, y adaptación sin desbordamiento
  con navegación inicial por teclado.
- `pnpm test:e2e` inicia un servidor local aislado en el puerto `3100`.
- La revisión visual se realizó a 390 × 844 píxeles sin desbordamiento ni errores
  en la consola del navegador.
- `pnpm audit --prod` no encontró vulnerabilidades conocidas en las dependencias
  que forman parte de la aplicación.

## Comandos

```bash
pnpm test:models
pnpm test:e2e
pnpm lint
pnpm build
```

Antes de desplegar sólo queda la aceptación manual con una cuenta real en los
dispositivos que se quieran soportar, especialmente permisos de micrófono y
archivos grandes. También deben rotarse las credenciales compartidas durante el
desarrollo.
