# Etapa 4: recuerdos conectados

La etapa 4 está completa en desarrollo local. Green Days ya conecta las entradas
del libro con cuatro formas de volver a ellas. No se realizó ningún despliegue.

## 1. Calendario emocional

- Vista mensual con entradas reales y emoción principal.
- Navegación entre meses, resumen y emoción más frecuente.
- PostgreSQL resuelve la consulta pequeña sin cargar documentos visuales.

## 2. Cápsulas del tiempo

- Se eligen título, mensaje, fecha, papel, sello y forma de apertura.
- PostgreSQL conserva propietario, fecha y estado (`sealed` o `unlocked`).
- MongoDB conserva el mensaje y su presentación.
- El servidor vuelve a verificar propietario y fecha antes de romper el sello.
- Una cápsula puede abrirse en su vista individual y eliminarse con confirmación.

## 3. Álbumes vivos

- Álbumes reales con descripción, color y diseño de recortes, película o libro.
- Las entradas pueden añadirse y quitarse manualmente.
- Una regla opcional por fecha y/o emoción incorpora nuevas entradas que
  coincidan cada vez que el álbum se visita.
- PostgreSQL guarda pertenencia, regla y orden; MongoDB guarda la presentación.

## 4. Personalización profunda

- Cuatro atmósferas prediseñadas y una mezcla de colores propia.
- Fondo, papel, tinta, acento, portada, lomo y tipografía configurables.
- Opción persistente para reducir movimiento.
- El tema se aplica a la navegación, páginas y componentes de toda la app.
- Los libros nuevos heredan portada, papel, tinta y tipografía del tema activo.

## Consistencia y seguridad

- Todas las acciones vuelven a autenticar al usuario en el servidor.
- Las búsquedas directas incluyen `userId`; las políticas RLS siguen protegiendo
  el acceso realizado con el cliente de Supabase.
- Las creaciones híbridas usan el outbox existente. Si MongoDB falla, se registra
  el error y se retira la fila relacional incompleta.
- Los documentos pasan por Zod antes de escribirse.
- La migración `stage4_living_album_rules` añade sólo el JSON opcional de reglas
  automáticas a `albums`, por lo que puede evolucionar después.

Fotografías y audio siguen siendo ampliaciones del editor; el dibujo libre ya
comenzó en la etapa 6. Ninguna bloquea los cuatro módulos de esta etapa.
