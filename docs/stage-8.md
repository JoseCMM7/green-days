# Etapa 8: pulido, almacenamiento y presentación

La etapa 8 convierte lo construido en una experiencia más cómoda de enseñar y
usar, todavía sólo en desarrollo local. No despliega Green Days ni modifica el
esquema de las bases de datos.

## Un libro más natural

- Los botones de pliego conservan la navegación exacta y ahora activan una
  transición distinta al avanzar o retroceder.
- En pantallas táctiles se puede deslizar horizontalmente sobre el espacio libre
  del libro. El gesto ignora botones, campos, audios y capas para no interferir
  con escribir, dibujar, mover o redimensionar.
- El zoom permite trabajar al 75 %, 100 %, 125 % o 150 %. Al aumentar, el libro
  permanece dentro de un contenedor desplazable en lugar de romper la página.
- Los cálculos de límite de zoom y dirección del gesto viven en funciones puras
  que pueden probarse sin navegador.

## Fotografías más ligeras

Antes de enviar una fotografía, el navegador lee su orientación y dimensiones.
Si supera 2400 píxeles en su lado mayor o pesa más de 2 MB, la dibuja en un canvas
y genera WebP con calidad 0.86. Los GIF conservan su archivo original para no
perder la animación.

La interfaz muestra progreso por fases: preparación, carga privada y finalización.
El nombre visible continúa siendo el original, aunque el archivo almacenado se
optimice. El servidor sigue aplicando formato, tamaño, propiedad y cuota; la
optimización del cliente nunca sustituye esas validaciones.

## Cuota y limpieza segura

La sección de cuenta muestra el consumo respecto a una cuota inicial de 500 MB.
Cada carga comprueba de nuevo el total en el servidor.

El botón de limpieza exige confirmación y sólo considera archivos con más de 24
horas. Antes de borrarlos reúne referencias desde PostgreSQL y MongoDB: libros
actuales, todas sus revisiones, cápsulas, portadas y decoraciones de álbumes, y
stickers personalizados. Storage se procesa en lotes de 100. La operación no
borra páginas, revisiones ni relaciones que todavía se usan.

## Presentación pública

`/showcase` es la única nueva ruta pública. Explica el libro diario, el calendario
emocional, los recuerdos conectados y la arquitectura híbrida, con enlaces claros
para entrar o crear una cuenta. Las demás páginas y APIs privadas continúan
rechazando sesiones anónimas.

## Pruebas autenticadas opcionales

Playwright carga `.env.local`. Para activar el recorrido que inicia sesión, abre
el libro, añade un sticker, deshace, rehace y cambia el zoom, se configura una
cuenta exclusiva para automatización:

```dotenv
E2E_USER_EMAIL=cuenta-de-pruebas@ejemplo.com
E2E_USER_PASSWORD=una-clave-exclusiva
```

No se debe usar una cuenta personal ni escribir esos valores en `.env.example`.
Sin ellos, Playwright omite limpiamente las dos variantes de esa prueba.

## Verificación realizada

- `pnpm lint`: sin observaciones.
- `pnpm exec tsc --noEmit`: sin errores de tipos.
- `pnpm test:models`: 25 pruebas aprobadas.
- `pnpm test:e2e`: 8 pruebas públicas aprobadas y 2 autenticadas omitidas por no
  haber credenciales de automatización.
- `pnpm build`: compilación de producción correcta con Next.js 16.3.3.
- `pnpm audit --prod`: sin vulnerabilidades conocidas.
- Revisión visual a 1440 × 1000 y 390 × 844: sin desbordamiento horizontal ni
  errores en la consola.

## Qué queda fuera

Todavía no se despliega la aplicación. También queda para una etapa posterior la
prueba manual de permisos reales de cámara/micrófono, fotografías muy grandes y
uso prolongado con una cuenta de aceptación; esas comprobaciones requieren una
persona y dispositivos concretos.
