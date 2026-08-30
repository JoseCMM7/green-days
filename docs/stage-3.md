# Etapa 3: primera entrega funcional

Esta entrega convierte la maqueta y los modelos de datos en un recorrido real:

1. La persona crea una cuenta o inicia sesión con Supabase Auth.
2. Green Days crea o actualiza su perfil en PostgreSQL.
3. Las rutas privadas comprueban la sesión en el servidor.
4. Al abrir **Mi libro**, la API busca la entrada del día en PostgreSQL y su
   contenido visual en MongoDB; si no existe, crea ambas partes.
5. El editor permite escribir en dos páginas y colocar, mover, girar, agrandar o
   eliminar stickers.
6. El autoguardado envía el libro completo a la API. MongoDB guarda la nueva
   revisión y PostgreSQL registra el estado y el evento de sincronización.

## Configuración local pendiente

Copia `.env.example` como `.env.local` y conserva todas las variables que ya
configuraste. Para activar la autenticación agrega también:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

Supabase muestra ambos valores en **Connect > Framework > Next.js**. La clave
publicable está diseñada para usarse en el navegador; la contraseña de PostgreSQL
y `MONGODB_URI` nunca deben llevar el prefijo `NEXT_PUBLIC_`.

Después ejecuta:

```bash
pnpm dev
```

Abre `http://localhost:3000`, crea una cuenta y confirma el correo si esa opción
está activa en Supabase. La pestaña **Mi libro** lleva a `/journal/today`.

## Límites de esta primera entrega

El núcleo de texto y stickers ya se guarda de verdad. Las fotografías, audio,
dibujo libre, calendario emocional completo, cápsulas del tiempo, álbumes vivos y
personalización profunda permanecen para entregas posteriores de la etapa 3.

## Comprobaciones

```bash
pnpm lint
pnpm test:models
pnpm build
```

Las pruebas cubren el modelo del libro, su esquema y las reglas de revisión. La
compilación comprueba también las rutas y tipos de Next.js.
