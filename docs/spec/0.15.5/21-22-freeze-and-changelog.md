# 21–22 — Cierre documental y control de cambios

# 21. Cierre documental y decisiones restantes

**Estado: Congelación funcional completada — planificación técnica autorizada — implementación no iniciada**

La versión `0.15.5` aclara el tratamiento administrativo de diferencias en transferencias bancarias. No incorpora automatización financiera ni funcionalidad comercial nueva.

Tras revisión adversarial final, `0.15.5` queda **funcionalmente congelada** y constituye la fuente de verdad funcional para la planificación técnica de `ecommerce-native`.

## 21.1 Decisiones realmente pendientes

Permanecen abiertas únicamente decisiones dependientes de obligaciones legales y del contexto concreto de cada proyecto:

1. **Conservación de registros comerciales:** duración aplicable a pedidos, pagos, reservas y movimientos una vez terminada su necesidad operativa.
2. **Tratamiento posterior de datos personales:** reglas de eliminación, anonimización o conservación restringida cuando terminen los plazos comerciales y legales.

Estas decisiones no modifican los flujos operativos aprobados.

La política de cinco años de la sección 20 pertenece exclusivamente a eventos de auditoría y **no resuelve ni autoriza por sí sola la eliminación de registros comerciales**.

Mientras no exista una política de conservación comercial aprobada para el proyecto:

> **No se implementará ni ejecutará purga automática de pedidos, pagos, reservas o movimientos comerciales. El vencimiento de eventos de auditoría no constituye autorización para eliminar dichos registros.**

No quedan pendientes funcionales sobre:

- creación/vencimiento de reservas;
- recuperación y resolución tardía de pagos;
- efectos de inventario en cancelaciones/reembolsos;
- usos promocionales tardíos;
- correo;
- idempotencia de checkout;
- acceso público al pedido;
- transiciones administrativas;
- notificaciones;
- auditoría.

La **planificación técnica** queda autorizada a partir de esta congelación.

La implementación de código no quedó autorizada por el hito de congelación en sí; cada corte de implementación debe partir de un plan técnico aprobado para la fase correspondiente y respetar íntegramente esta especificación.

## 21.2 Control de cambios posterior

A partir de la congelación:

- una decisión técnica que respete `0.15.5` puede resolverse sin reabrir la especificación;
- cualquier cambio de comportamiento observable, reglas comerciales, estados, permisos, autoridades o exclusiones requiere reabrir formalmente la especificación y versionar el cambio;
- optimizaciones técnicas no pueden reinterpretar ni debilitar invariantes;
- no se crea una versión funcional nueva para cambios de formato, ubicación o reproducibilidad documental que no alteren reglas.

---

# 22. Registro de cambios

## Hito documental — congelación funcional — 28 de agosto de 2026

**Congelación de la especificación funcional `0.15.5` y autorización de planificación técnica. Sin cambios funcionales.**

- `0.15.5` queda fijada como fuente funcional para planificación.
- Se autoriza descomposición técnica por fases.
- Implementación de código permanece sujeta a aprobación de cada fase/corte.
- Política de conservación comercial continúa pendiente y no autoriza purga automática.
- No se modifica ninguna regla comercial, estado, transición, permiso, pago, reserva, descuento, notificación ni contrato de auditoría.

## 0.15.5 — 28 de agosto de 2026

**Aclaración del tratamiento administrativo de diferencias en transferencias bancarias, sin ampliar alcance funcional.**

- Bloqueo de efectos ordinarios ante faltantes, excedentes u otras discrepancias mientras no exista confirmación administrativa válida.
- Separación entre resolución humana directa con comprador y efectos que el ecommerce aplica después de confirmación.
- Revisión y confirmación administrativa obligatorias antes de que una transferencia discrepante o tardía entre al flujo normal/tardío.
- Reafirmación de exclusión de pagos parciales, múltiples transferencias, saldos, créditos, wallets y automatización de diferencias.

## 0.15.4 — 27 de agosto de 2026

**Corrección residual de coherencia entre creación de reservas, cobros ordinarios y resolución tardía. Sin funcionalidades nuevas.**

- Distinción entre reservas iniciales del checkout y reservas nuevas creadas exclusivamente en resolución tardía.
- Reservas activas como precondición de cobros ordinarios controlados por el ecommerce, sin impedir registro de hechos financieros externos ya ocurridos.
- `paid` corregido como valor de `paymentStatus`, nunca de `orderStatus`.

## 0.15.3 — 27 de agosto de 2026

**Convergencia entre pagos tardíos, inventario, ciclo de pedido y límites promocionales.**

- Pago tardío no reactiva reservas liberadas.
- Resolución tardía adquiere inventario y uso promocional actuales para todas las líneas o ninguna.
- `expired → open` sólo dentro de resolución tardía válida.
- Falta de inventario/cupo termina en devolución completa, sin alterar snapshot económico.

## 0.15.2 — 27 de agosto de 2026

- Separación explícita entre hecho financiero confirmado y compromiso de inventario.
- Pago externo confirmado se registra aunque reservas hayan sido liberadas.
- Preparación permanece bloqueada hasta resolución completa.
- Corrección de restauración de stock para exigir salida física previa autoritativa.

## 0.15.1 — 27 de agosto de 2026

- Endurecimiento de idempotencia y concurrencia entre reservas, pedidos y pagos.
- Clarificación de estados terminales de reservas.
- Protección contra efectos duplicados de eventos repetidos.

## 0.15.0 — 27 de agosto de 2026

**Auditoría transversal.**

- Separación de auditoría respecto de autoridades comerciales.
- Registro de acciones administrativas, hechos automáticos, actividad sensible, proveedores e intervenciones técnicas.
- Actores explícitos e identidad histórica.
- Eventos con correlación, diferencias relevantes, motivo y resultado.
- Acceso restringido y exportaciones temporales auditadas.
- Conservación predeterminada de cinco años sin eliminar registros comerciales.
- Persistencia obligatoria para acciones sensibles y tratamiento durable de hechos externos.
- Minimización y separación respecto de analítica/logs técnicos.
- Exclusión de suplantación silenciosa, edición manual de auditoría, blockchain y conservación indefinida por defecto.

## 0.14.0 — 24 de agosto de 2026

**Notificaciones transaccionales.**

- Correo para compradores y alertas operativas para administración.
- Resultado comercial independiente de entrega de comunicaciones.
- Registro durable, procesamiento asíncrono, deduplicación e idempotencia.
- Eventos de pedidos, pagos, cumplimiento y reembolsos.
- Preferencias individuales y seguridad no desactivable.
- Corrección auditada de correos y revocación de accesos anteriores.
- Plantillas controladas/versionadas.
- Minimización de información sensible.
- Estados explícitos, reintentos limitados y conciliación de incertidumbre.
- Exclusión de marketing, mensajería libre y comunicaciones masivas.

## 0.13.0 — 23 de agosto de 2026

**Panel administrativo e identidad.**

- Panel como herramienta operativa sin autoridad arquitectónica.
- Un dueño único y colaboradores con cuentas individuales.
- Permisos predefinidos sin constructor arbitrario de roles.
- Identidad/sesión/resultado obligatorios para responsabilidad.
- Invitaciones, MFA, sesiones opacas y reautenticación sensible.
- Resumen orientado a tareas y navegación por permisos.
- Tratamiento de respuestas inciertas y conflictos de concurrencia.
- Actividad visible e intervención técnica identificada.
- Exclusión de cuentas compartidas, suplantación, SSO y administración multitienda.

## 0.12.0 — 23 de agosto de 2026

**Despacho y retiro.**

- Una modalidad por pedido.
- Zonas geográficas con tarifa fija y un punto de retiro cuando corresponda.
- Costo y datos relevantes congelados en pedido.
- Cumplimiento mediante transiciones administrativas auditables.
- Exclusión de integraciones logísticas automáticas y entregas parciales.

## 0.11.0 — 22 de agosto de 2026

**Descuentos.**

- Códigos simples con cálculo autoritativo en servidor.
- Un código por pedido y distribución por líneas elegibles.
- Uso promocional reservado/comprometido/liberado con límite global.
- Revalidación antes de crear pedido y snapshot congelado.
- Exclusión de stacking, descuentos automáticos, fidelización, tarjetas regalo y pedidos gratuitos.

## 0.10.0 — 22 de agosto de 2026

**Inventario.**

- Un inventario por instalación.
- Separación de stock físico, reservado y disponible calculado.
- Movimientos físicos inmutables y ajustes compensatorios.
- Venta, cancelación y devolución vinculadas a movimientos autoritativos.
- Concurrencia/idempotencia para impedir sobreventa.
- Exclusión de bodegas, lotes, preventa, backorders y sincronización externa.

## 0.9.0 — 22 de agosto de 2026

**Catálogo.**

- Producto editorial y variante vendible.
- Todo producto posee al menos una variante.
- SKU opcional y único cuando existe.
- Identidad comercial de variantes no reutilizable después de uso.
- Publicación/archivo sin reescritura de historial.
- Opciones convencionales y límites deliberados de combinaciones.

## 0.8.0 — 21 de agosto de 2026

**Cancelaciones, reembolsos y devoluciones.**

- Operaciones completas a nivel de pedido.
- Separación entre cancelación, reembolso, devolución y expiración.
- Reintegro de stock sólo cuando existe salida física previa o devolución inspeccionada.
- Reembolsos con estados propios e incertidumbre explícita.
- Exclusión de operaciones parciales.

## 0.7.0 — 21 de agosto de 2026

**Pedidos.**

- Pedido durable con snapshot económico.
- Estados independientes para pedido, pago, inventario, preparación y promociones.
- Acceso invitado mediante credencial segura; número público no autoriza.
- Preparación condicionada a pedido abierto, pago válido e inventario comprometido.

## 0.6.0 — 21 de agosto de 2026

**Pasarela de pago.**

- Una integración configurada por proyecto.
- Pago alojado/tokenizado y servidor como autoridad.
- Intentos históricos, webhooks idempotentes y `unknown` explícito.
- Resolución tardía para aprobaciones descubiertas después de liberar reservas.

## 0.5.0 — 20 de agosto de 2026

**Transferencia bancaria.**

- Transferencia exacta y confirmación administrativa.
- Reserva temporal y vencimiento.
- Sin carga de comprobantes como prueba autoritativa.
- Tratamiento manual de excepciones.

## 0.4.0 — 20 de agosto de 2026

**Reservas de inventario.**

- Estados `active`, `committed`, `released`.
- Creación junto al pedido, atomicidad e idempotencia.
- Vencimientos distintos por método de pago.
- `released` terminal.

## 0.3.0 — 19 de agosto de 2026

**Checkout.**

- Checkout invitado separado del carrito.
- Revalidación final autoritativa.
- Creación idempotente de pedido y reservas.
- Snapshot comercial en pedido y retención limitada de checkout temporal.

## 0.2.0 — 19 de agosto de 2026

**Carrito.**

- Intención temporal sin reserva ni congelación de precio.
- Identidad opaca de navegador.
- Cálculos en servidor y concurrencia controlada.

## 0.1.0 — base inicial

- Decisión de producto `ecommerce-native` separada de `ecommerce-shopify`.
- Una instalación y base de datos por comercio.
- Servidor como autoridad comercial.
- Configuración estructural fijada por proyecto.
- Exclusión deliberada de capacidades no necesarias en la primera versión.