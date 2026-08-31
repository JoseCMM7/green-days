# Etapa 6: editor creativo avanzado

La etapa 6 está completa en desarrollo local. El diario ya funciona como un
libro creativo por día, con medios privados, composición libre e historial
recuperable. No se realizó ningún despliegue.

## Libro y navegación temporal

- Cada libro comienza con dos páginas y puede crecer hasta 40.
- Se puede escribir y dibujar con ratón, lápiz o pantalla táctil.
- El calendario abre el libro de cualquier día pasado; los controles permiten
  avanzar o retroceder sin crear entradas futuras.
- Los álbumes enlazan directamente con el libro original de cada recuerdo.

## Fotografías, stickers y audio

- Se pueden subir fotografías y archivos de audio o grabar una nota con el
  micrófono del navegador.
- Cada elemento conserva posición, tamaño, rotación, profundidad y bloqueo.
- Las fotografías ofrecen filtros cálido, vintage y monocromático.
- Los archivos viven en el bucket privado `journal-media` de Supabase Storage.
  Las políticas RLS sólo permiten acceder a la carpeta del usuario autenticado.
- PostgreSQL guarda metadatos y relaciones; MongoDB guarda la composición visual
  del libro. La API privada sirve los archivos sin exponer URLs públicas.

## Historial y recuperación

- Cada autoguardado crea una revisión del documento en MongoDB.
- El editor muestra fecha, número de revisión, páginas y un extracto.
- Una revisión anterior puede restaurarse sin destruir el estado actual: éste
  también queda en el historial antes de la restauración.

## Recuerdos conectados

- Desde una entrada se puede preparar una cápsula del tiempo vinculada a ese día.
- Cuando se consulta la cápsula aparece un acceso de regreso a su libro de origen.
- El calendario emocional, los álbumes, las cápsulas y el diario comparten los
  UUID relacionales de PostgreSQL.

## Tecnologías y seguridad

- React y Pointer Events para las interacciones del lienzo.
- SVG para trazos adaptables a cualquier tamaño de pantalla.
- MediaRecorder para grabación de audio con permiso explícito.
- Supabase Storage privado y políticas RLS para archivos binarios.
- Drizzle/PostgreSQL para propiedad y metadatos; MongoDB/Zod para el documento
  flexible y sus versiones.
- La eliminación de cuenta borra los objetos privados en la misma función
  transaccional que elimina al usuario.

## Verificación

- TypeScript y ESLint sin errores ni advertencias.
- 16 pruebas automatizadas superadas.
- Compilación optimizada de Next.js completada.
- Migración de Storage aplicada correctamente en Supabase.

La siguiente etapa eventual será preparar y ejecutar el lanzamiento. Se mantiene
fuera de alcance hasta decidir que el producto ya no necesita cambios importantes.
