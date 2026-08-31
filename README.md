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

La etapa 4 de recuerdos conectados está completa en desarrollo local:

- Emoción principal seleccionable y persistente en cada entrada.
- Calendario emocional real con navegación mensual y resumen del mes.
- Catálogo emocional compartido instalado mediante una migración de Drizzle.
- Cápsulas del tiempo selladas hasta una fecha elegida.
- Álbumes vivos manuales o automáticos por fecha y emoción.
- Personalización de paleta, papel, portada, tipografía y movimiento.

La etapa 5 de preparación local también está disponible, sin despliegue:

- Exportación y eliminación segura de los datos de la cuenta.
- Encabezados de seguridad, privacidad y observabilidad.
- Accesibilidad por teclado y recuperación global de errores.
- Pruebas adicionales para operaciones sensibles.

La etapa 6 comenzó con el editor creativo avanzado:

- Libros de hasta 40 páginas organizadas por pliegos.
- Dibujo libre persistente con color, grosor y deshacer.
- Coordenadas adaptables para ratón, lápiz y pantalla táctil.

Consulta la [arquitectura de datos](./docs/architecture/database.md) y la
[guía de la etapa 3](./docs/stage-3.md). El alcance y progreso actual de la
etapa siguiente están en la [guía de la etapa 4](./docs/stage-4.md).
La preparación previa al lanzamiento está documentada en la
[guía de la etapa 5](./docs/stage-5.md).
El progreso del editor creativo está en la [guía de la etapa 6](./docs/stage-6.md).

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
