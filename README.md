# Green Days

> Guarda la vida mientras sucede.

Green Days es un diario digital privado pensado para conservar pequeños momentos,
fotografías y emociones sin convertir la vida en una lista de productividad.

## Etapa actual

Las etapas 1 y 2 establecieron la base visual y de datos:

- Next.js con App Router y TypeScript.
- Tailwind CSS para los estilos.
- Primera pantalla estática y adaptable a móvil.
- Componentes separados para navegación, entrada diaria y calendario.
- Arquitectura híbrida con PostgreSQL/Drizzle y MongoDB/Zod.
- Modelo relacional para diario, emociones, medios, cápsulas y álbumes.
- Modelo documental para libros, páginas, texto, dibujos y stickers posicionables.
- Migración SQL inicial e índices de MongoDB reproducibles.

La primera entrega vertical de la etapa 3 ya conecta esas piezas:

- Registro, inicio y cierre de sesión con Supabase Auth.
- Perfiles de usuario sincronizados con PostgreSQL.
- Rutas privadas y políticas RLS para aislar los datos de cada persona.
- Libro diario 3D con dos páginas editables y stickers posicionables.
- Autoguardado en MongoDB con historial de revisiones.
- Registro relacional de cada entrada y eventos de sincronización en PostgreSQL.

Consulta la [arquitectura de datos](./docs/architecture/database.md) y la
[guía de la etapa 3](./docs/stage-3.md).

## Ejecutar localmente

```bash
pnpm install
pnpm dev
```

Después abre [http://localhost:3000](http://localhost:3000).

Para probar el registro y el diario necesitas completar primero las variables de
`.env.local` descritas en [`.env.example`](./.env.example).

## Comandos útiles

```bash
pnpm dev      # servidor de desarrollo
pnpm lint     # revisión estática del código
pnpm build    # compilación de producción
pnpm start    # ejecutar la compilación de producción
pnpm test:models   # validar el modelo documental del libro
pnpm db:generate  # generar SQL después de cambiar el esquema
pnpm db:migrate   # aplicar migraciones a Supabase
pnpm db:studio    # explorar PostgreSQL con Drizzle Studio
pnpm mongo:indexes # crear índices en MongoDB Atlas
```
