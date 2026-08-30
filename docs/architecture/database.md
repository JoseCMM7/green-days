# Arquitectura de datos de Green Days

## Decisión principal

Green Days usa persistencia políglota: cada base se ocupa de los datos para los que fue diseñada.

| Sistema | Responsabilidad | Ejemplos |
| --- | --- | --- |
| PostgreSQL (Supabase) | Datos relacionales, consultables y con reglas estrictas | usuarios, días, emociones, etiquetas, medios, cápsulas, álbumes y estados de sincronización |
| MongoDB Atlas | Contenido visual flexible y versionado | libro, páginas, textos, dibujos y ubicación exacta de stickers y fotografías |
| Supabase Storage | Archivos binarios privados | fotografías y grabaciones de audio |

Una entrada usa el mismo UUID en ambos sistemas:

```text
journal_entries.id (PostgreSQL) = entry_documents._id (MongoDB)
```

PostgreSQL sabe que existe una entrada el 30 de agosto, qué emociones tiene y a qué álbumes pertenece. MongoDB sabe cómo se ve y qué contiene cada página de su libro.

## El libro y sus coordenadas

Cada entrada de MongoDB es un `entry_document`. Contiene apariencia de portada y lomo, configuración de apertura 3D y un arreglo de páginas. Cada página usa un lienzo lógico de `1000 × 1400` unidades, independiente de los píxeles reales de la pantalla.

Un sticker guarda una geometría semejante a esta:

```json
{
  "x": 124,
  "y": 246,
  "width": 180,
  "height": 180,
  "rotation": -12,
  "zIndex": 4,
  "locked": false
}
```

La interfaz escala esas coordenadas proporcionalmente. Por eso la composición se mantiene al abrirla en un teléfono, una laptop o una pantalla grande. `zIndex` decide qué objeto se ve encima; `rotation` conserva el giro. El modelo acepta texto manuscrito, stickers, fotografías, audio y dibujos.

La animación 3D se ejecutará en React/CSS o con una librería gráfica en una etapa visual. La base guarda los parámetros persistentes de esa experiencia —material, colores, perspectiva, duración y estilo de apertura—, no los fotogramas de la animación.

## Modelo relacional

- `profiles`: perfil de la persona. Su `id` será el mismo UUID de Supabase Auth.
- `journal_entries`: un registro por persona y fecha, con el UUID compartido con MongoDB.
- `emotions` y `entry_emotions`: catálogo emocional y relación muchos-a-muchos, incluida la intensidad.
- `tags` y `entry_tags`: etiquetas personales reutilizables.
- `media_assets` y `entry_media`: metadatos y relaciones de fotos/audio; el archivo vive en Storage.
- `time_capsules` y `capsule_media`: fecha de apertura, estado y medios de una cápsula.
- `albums` y `album_entries`: colecciones ordenadas de entradas.
- `user_preferences`: tema del libro, recordatorios, movimiento reducido y recuerdos que pueden reaparecer.
- `outbox_events`: trabajo pendiente para mantener PostgreSQL y MongoDB sincronizados sin fingir una transacción distribuida.

No existe selector de idioma; la interfaz se diseña directamente en español.

## Colecciones de MongoDB

- `entry_documents`: versión actual de cada libro.
- `entry_versions`: versiones anteriores para historial y recuperación.
- `capsule_documents`: carta y presentación flexible de una cápsula.
- `album_presentations`: apariencia de los álbumes vivos.
- `custom_themes`: personalización profunda mediante tokens visuales.

Todos los documentos incluyen `schemaVersion`. Esto permite aceptar por un tiempo documentos antiguos, transformarlos al leerlos y migrarlos gradualmente.

## Validación y concurrencia

Zod valida los documentos antes de escribirlos. También comprueba que los elementos permanezcan dentro de la página. La propiedad `revision` implementa concurrencia optimista: una edición solo reemplaza la revisión que el editor abrió. Si otra sesión ya la cambió, la aplicación pedirá recargar en vez de sobrescribir silenciosamente.

Antes de reemplazar un libro se copia su estado actual a `entry_versions`. El índice único `(entryId, revision)` impide duplicados. Las versiones históricas tienen inicialmente una retención de un año, que podremos cambiar antes de producción.

## Flujo de sincronización

PostgreSQL y MongoDB no comparten una transacción ACID. Green Days usará el patrón Outbox:

1. Una operación escribe en PostgreSQL el cambio relacional y un `outbox_event` en la misma transacción.
2. Un proceso de sincronización toma el evento y valida el documento con Zod.
3. Escribe el contenido en MongoDB usando el UUID compartido y la revisión esperada.
4. Marca la entrada como `ready` y el evento como `processed`.
5. Si algo falla, conserva el evento, registra el error y reintenta; nunca aparenta que ambas escrituras fueron atómicas.

Los endpoints y el worker se implementarán junto con autenticación en la etapa 3, porque allí ya existirán usuarios reales y conexiones a ambos servicios.

## Por qué Drizzle

Drizzle representa tablas y consultas con TypeScript y genera SQL legible. No oculta PostgreSQL detrás de un modelo propietario: las llaves, índices, enums y migraciones siguen siendo SQL normal. Además, su driver `postgres-js` funciona con el Transaction Pooler de Supabase usando `prepare: false`.

Comparación práctica:

- Frente a Prisma, Drizzle tiene una capa de ejecución más pequeña y mantiene la consulta más cercana a SQL; Prisma ofrece un cliente generado y una abstracción más amplia.
- Frente a escribir SQL con `postgres` directamente, Drizzle comparte tipos entre el esquema, las consultas y las migraciones, reduciendo discrepancias manuales.
- Frente a Kysely, Drizzle también define el esquema y genera migraciones; Kysely se concentra principalmente en construir consultas tipadas.

Para MongoDB usamos el driver oficial y Zod. Su forma documental es deliberadamente distinta de las tablas y no necesitamos forzarla dentro de un ORM relacional.

## Cambios futuros

Sí, la base se puede modificar después de esta etapa; es lo normal. El procedimiento será:

- PostgreSQL: modificar el esquema TypeScript, ejecutar `pnpm db:generate`, revisar el SQL y después `pnpm db:migrate`.
- MongoDB: incrementar `schemaVersion`, aceptar temporalmente ambas formas y ejecutar una migración gradual.
- Cambios incompatibles: ampliar primero, migrar datos, actualizar la aplicación y retirar al final el campo viejo.

Las migraciones ya aplicadas no se editan: cada cambio crea una migración nueva y auditable.

## Configuración manual de servicios

1. Crear un proyecto en Supabase y guardar su contraseña de base de datos.
2. Copiar la URL del **Transaction Pooler** en `DATABASE_URL`.
3. Copiar la conexión directa o del **Session Pooler** en `DIRECT_URL`.
4. Crear un clúster en MongoDB Atlas, un usuario de base de datos y permitir la conexión desde el entorno de desarrollo.
5. Copiar la cadena de Atlas en `MONGODB_URI` y usar `MONGODB_DATABASE=green_days`.
6. Duplicar `.env.example` como `.env.local` y reemplazar solo allí los valores de ejemplo.
7. Ejecutar `pnpm db:migrate` para crear las tablas.
8. Ejecutar `pnpm mongo:indexes` para crear los índices de las colecciones.

`.env.local` está ignorado por Git. Las credenciales no deben copiarse al chat ni subirse al repositorio.
