# Etapa 5: preparación sin despliegue

Esta etapa fortalece Green Days para seguir desarrollándolo y probarlo como un
producto real. El despliegue fue excluido intencionalmente: todavía habrá cambios
en el diario antes de publicar.

## Implementado

### Control de datos

- **Exportación privada:** `GET /api/account/export` reúne PostgreSQL y MongoDB
  en un archivo JSON versionado. La respuesta no se almacena en caché y requiere
  una sesión válida.
- **Eliminación confirmada:** la persona debe escribir `ELIMINAR`. Una función
  PostgreSQL `SECURITY DEFINER` comprueba `auth.uid()` y elimina únicamente la
  cuenta autenticada.
- **Limpieza documental:** MongoDB elimina libros, versiones, cápsulas, álbumes y
  temas del usuario. Un evento outbox registra si la limpieza queda pendiente.
- **Página de privacidad:** describe qué almacena cada tecnología y las opciones
  disponibles para la persona.

### Seguridad

- Content Security Policy y bloqueo de iframes.
- `nosniff`, política de referencia, aislamiento de ventana y permisos del
  navegador desactivados por defecto.
- HSTS se activa solamente en producción.
- La aplicación privada indica a buscadores que no debe indexarse.
- Los errores de servidor se registran sin copiar cookies, cabeceras ni consultas.

### Experiencia y accesibilidad

- Enlace para saltar directamente al contenido.
- Indicadores de foco visibles con teclado.
- Error global recuperable y página 404 propia.
- Interfaz de cuenta adaptable a móvil y mensajes anunciados con `aria-live`.
- Los estados específicos de carga y error del libro continúan activos.

### Verificación

- Pruebas unitarias para confirmación destructiva y nombres de exportación.
- Pruebas existentes del calendario y modelo documental.
- TypeScript, ESLint y compilación de producción.
- Revisión de encabezados HTTP y navegación con el navegador local.

## Deliberadamente pendiente

- Publicación en Vercel, dominio y variables de producción.
- Monitoreo externo: la instrumentación local está lista para conectar un
  proveedor cuando se elija uno.
- Fotografías y audio como ampliaciones futuras del editor.

No se debe desplegar hasta rotar cualquier contraseña que haya sido compartida
durante el desarrollo y completar una última revisión de las variables.
