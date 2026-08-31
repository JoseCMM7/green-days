# Etapa 4: recuerdos conectados

La etapa 4 transforma entradas aisladas en una historia que puede recorrerse. Se
construirá en cuatro bloques:

1. **Calendario emocional:** entradas por mes, emoción principal, colores y
   navegación entre meses.
2. **Cápsulas del tiempo:** recuerdos sellados hasta una fecha elegida.
3. **Álbumes vivos:** colecciones que reúnen entradas y archivos por tema,
   persona, lugar o periodo.
4. **Personalización profunda:** portadas, papel, tipografía y decoración del
   espacio personal.

## Primer bloque implementado

El calendario emocional ya dejó de usar datos de demostración:

- El libro permite elegir entre seis emociones principales.
- La emoción se guarda de forma relacional en PostgreSQL mediante `emotions` y
  `entry_emotions`.
- Una migración de Drizzle instala el catálogo compartido de emociones.
- `/api/calendar?month=AAAA-MM` devuelve exclusivamente los días del usuario
  autenticado y desactiva el caché compartido.
- `/calendar` carga el mes actual en el servidor y cambia de mes desde el cliente
  sin recargar toda la aplicación.
- La cuadrícula marca días con entrada, color emocional, día actual y selección.
- El panel lateral muestra momentos reales y la emoción más frecuente del mes.

MongoDB conserva el diseño del libro y PostgreSQL responde el calendario. Esta
separación evita recorrer documentos visuales grandes para obtener una vista
mensual pequeña.

## Próximos bloques de la etapa 4

El siguiente incremento será **Cápsulas del tiempo**. Después llegarán los
álbumes vivos y la personalización. Cada módulo se conectará a las tablas y
políticas RLS que ya existen, en lugar de depender de contenido ficticio.

## Etapa 5

La etapa 5 será la preparación para publicar Green Days como un producto sólido:

- accesibilidad y experiencia móvil completas;
- rendimiento, estados de error y observabilidad;
- pruebas de los recorridos críticos;
- exportación, respaldo y eliminación segura de datos;
- revisión de privacidad y seguridad;
- despliegue estable en Vercel con variables y dominios de producción.

