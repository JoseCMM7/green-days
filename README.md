# Green Days

> Guarda la vida mientras sucede.

Green Days es un diario digital privado pensado para conservar pequeños momentos,
fotografías y emociones sin convertir la vida en una lista de productividad.

## Etapa actual

Las etapas 1 y 2 establecen la base visual y de datos:

- Next.js con App Router y TypeScript.
- Tailwind CSS para los estilos.
- Primera pantalla estática y adaptable a móvil.
- Componentes separados para navegación, entrada diaria y calendario.
- Arquitectura híbrida con PostgreSQL/Drizzle y MongoDB/Zod.
- Modelo relacional para diario, emociones, medios, cápsulas y álbumes.
- Modelo documental para libros, páginas, texto, dibujos y stickers posicionables.
- Migración SQL inicial e índices de MongoDB reproducibles.

La interfaz aún usa datos de demostración. Las conexiones reales, autenticación y guardado desde la UI comienzan en la etapa 3. Consulta la [arquitectura de datos](./docs/architecture/database.md).

## Ejecutar localmente

```bash
pnpm install
pnpm dev
```

Después abre [http://localhost:3000](http://localhost:3000).

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
