# 18–20 — Administración, notificaciones y auditoría

# 18. Panel administrativo

**Estado: Aprobado — operación individual, permisos y sesiones seguras**

## 18.1 Propósito

El panel es una herramienta operativa para una tienda independiente administrada por una cantidad reducida de personas. Permite ejecutar las capacidades habilitadas para esa instalación, pero no reconfigurar la arquitectura ni crear nuevas reglas comerciales.

Cada instalación tiene exactamente un `owner`. Puede existir un número pequeño de colaboradores administrativos con cuentas individuales y permisos predefinidos.

## 18.2 Autoridad

Toda autorización se valida en servidor.

Ocultar un botón, una ruta o una sección no constituye autorización. Ningún permiso puede habilitar funciones que la instalación no tenga contratadas/configuradas.

El panel nunca modifica directamente campos de estado sensibles: solicita comandos de dominio y el servidor valida precondiciones, permisos, idempotencia y concurrencia.

## 18.3 Identidad individual y responsabilidad

No se permiten cuentas compartidas. Cada persona usa su propia cuenta y toda acción administrativa se asocia a su identidad.

Cada evento conserva como mínimo:

- identificador inmutable del usuario;
- nombre y correo registrados al ejecutar la acción;
- fecha/hora exactas;
- sesión utilizada;
- acción;
- entidad afectada;
- valores anteriores/nuevos relevantes;
- motivo cuando es obligatorio;
- resultado completado, rechazado, fallido o incierto.

Suspender a un colaborador no borra su identidad histórica. Cambiar nombre/correo posteriormente no reescribe acciones pasadas.

Acciones automáticas se atribuyen a `system`. Webhooks/conciliaciones identifican proveedor o proceso. No existe actuación silenciosa en nombre de otra persona.

## 18.4 Permisos predefinidos

No existe constructor arbitrario de roles.

El dueño asigna capacidades predefinidas como:

- consultar/gestionar catálogo;
- consultar/gestionar inventario;
- consultar/operar pedidos;
- confirmar pagos por transferencia;
- cancelar y reembolsar;
- consultar/gestionar descuentos;
- consultar/gestionar entregas;
- configurar zonas/retiro dentro del alcance habilitado;
- consultar auditoría;
- gestionar colaboradores.

Una capacidad de gestión incluye consulta del mismo módulo, no de otros. Ningún colaborador puede elevar sus propios permisos.

## 18.5 Navegación y resumen operativo

La navegación muestra sólo secciones autorizadas:

- Resumen;
- Pedidos;
- Productos;
- Inventario;
- Descuentos;
- Entregas;
- Colaboradores;
- Actividad.

El resumen prioriza tareas pendientes, por ejemplo:

- transferencias por revisar;
- pedidos pagados sin preparar;
- pedidos listos para retiro;
- reembolsos pendientes;
- incidentes de entrega;
- variantes con stock bajo/agotado.

No se requiere analítica avanzada ni dashboard configurable en la primera versión.

## 18.6 Acceso por invitación

No existe registro público administrativo.

- El `owner` se crea mediante procedimiento inicial controlado.
- El dueño invita colaboradores desde el panel.
- Invitación individual, de un solo uso, con vencimiento de 24 horas.
- Aceptar verifica control del correo y permite configurar credenciales.
- Invitación vencida/revocada no se reutiliza.
- Ninguna cuenta accede a operación antes de completar activación.

## 18.7 Contraseña y segundo factor

Todas las cuentas administrativas utilizan credenciales robustas y **MFA obligatorio**.

La implementación debe:

- almacenar contraseñas sólo mediante hash moderno resistente a fuerza bruta;
- no registrar contraseñas, secretos MFA ni códigos de recuperación en texto reutilizable;
- generar códigos de recuperación de un solo uso y almacenarlos protegidos;
- limitar intentos repetidos;
- no revelar si un correo existe;
- auditar altas, fallos, recuperaciones y cambios sensibles.

El MFA no se desactiva para un colaborador por conveniencia operativa.

## 18.8 Sesiones y CSRF

Las sesiones administrativas son opacas y controladas por servidor.

La implementación define cookies y defensas compatibles con su arquitectura de dominios, incluyendo `HttpOnly`, `Secure` en producción, política `SameSite` adecuada, expiración y protección CSRF para operaciones mutables.

Cada persona puede consultar/cerrar sus sesiones activas. El dueño puede revocar todas las sesiones de un colaborador.

Cambiar contraseña, suspender cuenta o restablecer MFA revoca las sesiones que corresponda.

La implementación sigue como referencia los criterios de OWASP Session Management y CSRF Prevention.

## 18.9 Reautenticación y recuperación

Las acciones sensibles requieren identidad confirmada recientemente, con ventana máxima de **15 minutos**.

Como mínimo se exige reautenticación para:

- confirmar pagos;
- cancelar/reembolsar;
- modificar permisos;
- suspender colaboradores;
- restablecer MFA;
- corregir inventario;
- confirmar retiro sin código/evidencia normal.

Además:

- cambiar contraseña revoca demás sesiones;
- suspender cuenta revoca todas sus sesiones;
- restablecer MFA revoca sesiones y códigos anteriores;
- el dueño puede reiniciar acceso de un colaborador;
- recuperación del `owner` usa procedimiento técnico reforzado;
- errores de acceso no enumeran cuentas;
- intentos repetidos tienen limitación progresiva;
- login, fallos, recuperación y revocación quedan auditados.

## 18.10 Confirmación de acciones sensibles

Antes de una acción irreversible o de alto impacto se muestra:

- operación;
- pedido/producto/descuento/persona afectada;
- consecuencias en dinero, inventario y estados;
- posibilidad/imposibilidad de compensar;
- motivo cuando es obligatorio.

Requieren confirmación explícita, como mínimo:

- confirmar transferencia;
- cancelar pedido;
- iniciar/confirmar reembolso;
- corregir inventario;
- archivar producto;
- cambiar tarifas;
- suspender colaborador;
- modificar permisos;
- confirmar retiro sin código;
- resolver incidentes de entrega.

Las operaciones sensibles son idempotentes frente a doble clic/reintento.

## 18.11 Respuesta visual y errores

Una acción sensible no se muestra como exitosa antes de confirmación real del servidor.

La interfaz puede representar:

- `pending`;
- `succeeded`;
- `failed`;
- `unknown`.

Ante error conserva datos ingresados, explica qué falló y consulta estado vigente cuando el resultado es incierto. No oculta conflictos de concurrencia ni reintenta ciegamente.

Dinero, inventario, pedidos, entregas y permisos esperan confirmación real. Filtros/orden/navegación sin efecto comercial pueden actualizarse inmediatamente.

## 18.12 Actividad visible

Actividad puede filtrar por persona/actor, acción, módulo, entidad, fecha, resultado y motivo.

Cada evento muestra identidad conservada, tipo de actor, momento, sesión, acción, entidad, valores relevantes, motivo y resultado.

Los registros no se editan/eliminan desde el panel y se rigen por la auditoría transversal.

## 18.13 Concurrencia y cambios de permisos

Si dos personas editan el mismo recurso:

- servidor comprueba versión conocida;
- edición desactualizada se rechaza;
- se muestra información vigente;
- la persona revisa antes de reenviar.

Cambios de permisos se aplican inmediatamente:

- siguientes solicitudes usan permisos nuevos;
- retirar capacidad sensible puede revocar sesiones afectadas;
- suspender cuenta cierra sesiones;
- colaborador nunca eleva sus propios permisos;
- nadie suspende al único `owner`;
- permisos no superan funciones habilitadas para instalación.

## 18.14 Exclusiones iniciales

No se incluyen:

- registro público;
- cuentas compartidas;
- múltiples dueños;
- constructor de roles;
- aprobación por varias personas;
- login con redes sociales;
- SSO empresarial;
- passkeys;
- suplantación de usuarios;
- acceso técnico permanente;
- administración de múltiples tiendas desde una cuenta;
- aplicación móvil administrativa;
- acciones financieras masivas.

## 18.15 Invariantes

1. Cada persona usa cuenta individual.
2. Cada instalación tiene exactamente un `owner`.
3. No existe registro público administrativo.
4. Toda autorización se valida en servidor.
5. Ocultar acción en UI no autoriza.
6. MFA es obligatorio para todas las cuentas administrativas.
7. Toda acción identifica actor, sesión, momento y resultado.
8. Acciones automáticas nunca se atribuyen a una persona.
9. Actividad no se edita/elimina desde panel.
10. Suspender cuenta revoca sesiones.
11. Colaborador no eleva sus propios permisos.
12. Acciones sensibles requieren confirmación y autenticación reciente.
13. Motivos obligatorios no se omiten.
14. Respuesta incierta se consulta antes de reintentar.
15. Reintento no duplica efectos.
16. Edición desactualizada no sobrescribe información vigente.
17. Panel nunca muestra éxito sensible antes de confirmación servidor.
18. Dueño administra operación, no arquitectura.
19. Ningún permiso habilita funciones no contratadas.
20. No existe acceso silencioso en nombre de otra persona.
21. Suspender/renombrar cuenta no reescribe responsabilidad histórica.
22. Intervención técnica identifica actor real y queda auditada.

---

# 19. Notificaciones

**Estado: Aprobado — comunicaciones transaccionales y alertas operativas**

## 19.1 Propósito y autoridad

El módulo informa hechos registrados por los dominios comerciales. Una notificación no crea, confirma, cancela ni modifica pedidos, pagos, inventario, descuentos, despachos o reembolsos.

Una falla, demora o incertidumbre de entrega:

- no revierte la operación;
- no modifica su resultado;
- no permite inferir que la operación comercial falló;
- se resuelve dentro del módulo de notificaciones.

## 19.2 Canales y configuración estructural

Canales iniciales:

- comprador: correo transaccional;
- administración: alertas dentro del panel y correos operativos opcionales.

Proveedor de correo, dominio remitente y credenciales se fijan durante implementación y no se reemplazan desde panel.

No se incluyen inicialmente SMS, WhatsApp, push ni canales pagados por uso.

## 19.3 Registro durable y procesamiento asíncrono

La intención de notificar se registra de forma durable junto con el hecho que la origina. La entrega se procesa después, asíncronamente.

El registro contiene como mínimo:

- tipo de evento;
- entidad/operación de origen;
- destinatario previsto;
- canal;
- plantilla y versión;
- estado de procesamiento;
- intentos;
- fechas;
- referencia proveedor cuando exista;
- resultado informado cuando exista.

No se pierde la intención porque el proveedor esté caído momentáneamente.

## 19.4 Eventos transaccionales

Las plantillas se disparan desde eventos comerciales ya persistidos, por ejemplo:

- pedido creado;
- instrucciones de transferencia;
- pago confirmado;
- cambio relevante de cumplimiento;
- pedido listo para retiro;
- despacho/entrega/retiro;
- cancelación;
- reembolso confirmado.

No se envía un mensaje de éxito basándose sólo en optimismo de UI.

## 19.5 Alertas administrativas

El panel puede alertar sobre tareas operativas como transferencias pendientes, pedidos por preparar, reembolsos, incidentes de entrega, stock bajo o fallas de notificación.

La alerta orienta, pero no sustituye la entidad autoritativa. Marcarla como vista no resuelve pedido/pago/inventario/incidente.

## 19.6 Destinatarios y preferencias administrativas

Preferencias se administran por cuenta individual y respetan permisos.

Una persona puede activar/desactivar correos operativos opcionales. Esto no oculta tareas ni estados dentro del panel.

Las comunicaciones críticas de seguridad no pueden desactivarse, incluyendo según corresponda:

- invitaciones administrativas;
- recuperación/cambio de contraseña;
- activación/recuperación/modificación de MFA;
- cambio de permisos;
- suspensión o revocación de sesiones.

Se dirigen a la cuenta afectada y al dueño cuando el evento requiere conocimiento del owner.

## 19.7 Validación y corrección de correo

Durante checkout:

- eliminar espacios accidentales y aplicar sólo normalizaciones seguras;
- validar estructura;
- mostrar claramente dirección antes de confirmar;
- permitir corregir antes de crear pedido;
- advertir errores evidentes de dominios comunes sin autocorregir.

No se exige repetir correo.

Si pedido ya existe con correo incorrecto:

1. pedido sigue existiendo y conserva estado comercial;
2. persona con permiso puede corregir con motivo obligatorio;
3. se conserva dirección original, corregida, actor, sesión y momento;
4. se revocan obligatoriamente credenciales públicas anteriores aplicables;
5. se emite nuevo acceso seguro;
6. notificaciones necesarias pueden reenviarse como registros nuevos vinculados a originales.

La corrección no reescribe el destinatario/resultados históricos de envíos anteriores.

## 19.8 Plantillas controladas y versionadas

Plantillas se configuran durante implementación. Dueño/colaboradores no editan desde panel estructura, variables, lógica condicional, proveedor ni dominio remitente.

Cada envío conserva identidad y versión de plantilla. Cambiar plantilla no reescribe mensajes históricos y un reenvío no aparenta ser el original.

Editor visual, nuevos idiomas o contenido libre constituyen ampliación futura explícita.

## 19.9 Información sensible y enlaces seguros

Mensajes contienen sólo información necesaria.

No incluyen:

- secretos internos;
- credenciales reutilizables sin protección;
- notas administrativas;
- datos de tarjeta;
- información bancaria innecesaria;
- códigos de retiro completos cuando puedan autorizar una entrega.

Cuando el comprador necesita gestionar/ver un pedido, se utiliza acceso seguro con credencial opaca, limitada, revocable y adecuada al riesgo.

## 19.10 Estados y reintentos

El módulo distingue resultado local y del proveedor. Un intento puede quedar pendiente, enviado/aceptado por proveedor, fallido o `unknown` según capacidades de la integración.

`sent` sólo significa aceptación por el proveedor, no lectura por destinatario.

Los reintentos son limitados, deduplicados e idempotentes. Un resultado `unknown` se concilia antes de reenviar para evitar duplicados innecesarios.

## 19.11 Webhooks del proveedor

Si el proveedor informa rebotes/entrega u otros resultados:

- se verifica autenticidad;
- se identifica evento idempotentemente;
- se actualiza sólo el registro de notificación correspondiente;
- nunca se otorga autoridad comercial sobre pedido/pago/inventario.

## 19.12 Reenvío manual

Un reenvío no edita el envío original. Crea un nuevo registro relacionado y conserva actor/motivo cuando es acción administrativa.

## 19.13 Historial

Nunca se elimina, reemplaza ni cambia retrospectivamente el resultado del envío original desde el panel.

## 19.14 Auditoría y conservación

Son auditables:

- corrección destinatario;
- revocación/nueva emisión de enlace;
- reenvío manual;
- cambio de preferencias;
- cambios técnicos de plantilla/configuración;
- intervención manual sobre notificación fallida/incierta.

Registros de notificación no se editan/eliminan desde panel y su conservación/protección se rige por auditoría.

## 19.15 Exclusiones iniciales

No se incluyen:

- campañas de marketing;
- newsletters;
- automatizaciones promocionales;
- segmentación comercial;
- mensajes masivos;
- redacción libre desde panel;
- editor visual de plantillas;
- SMS/WhatsApp/push;
- métricas de apertura como prueba de lectura;
- centro de conversaciones bidireccionales.

Marketing o mensajería futura se integra como sistema independiente sin autoridad comercial.

## 19.16 Invariantes

1. Notificación informa un hecho; no lo crea/modifica.
2. Falla de entrega no revierte operación comercial.
3. Toda intención queda durable.
4. Un mismo evento no genera duplicados involuntarios.
5. Todo intento/resultado conserva trazabilidad.
6. `sent` sólo significa aceptación proveedor.
7. `unknown` se concilia antes de reenviar.
8. Webhooks de correo no tienen autoridad comercial.
9. Código de retiro no se envía como texto completo cuando autoriza entrega.
10. Mensajes no exponen notas internas ni credenciales.
11. Corregir correo no reescribe historial.
12. Corregir correo y reemitir acceso revoca credenciales anteriores aplicables.
13. Reenvío crea registro nuevo.
14. Acción manual identifica responsable.
15. Alertas críticas de seguridad no se desactivan.
16. Panel no ofrece mensajería libre/campañas.
17. Administración no reemplaza proveedor desde panel.
18. Marcar alerta vista no resuelve entidad relacionada.

---

# 20. Auditoría transversal

**Estado: Aprobada — evidencia común de responsabilidad, integridad y trazabilidad**

## 20.1 Propósito y límites

Auditoría permite determinar quién/qué realizó una acción, cuándo, sobre qué entidad, por qué y con qué resultado.

Documenta hechos, pero no sustituye autoridades del negocio. Pedidos, pagos, inventario, descuentos, cumplimiento y notificaciones conservan sus estados/registros autoritativos.

## 20.2 Eventos auditables

Se registran, según dominio:

- acciones administrativas sensibles;
- cambios de catálogo/inventario con relevancia operativa;
- confirmaciones de transferencia;
- cancelaciones, reembolsos y devoluciones;
- permisos, invitaciones, suspensiones y sesiones;
- cambios de descuentos/entrega;
- hechos automáticos relevantes;
- webhooks/conciliaciones de proveedores;
- correcciones/reenvíos de notificaciones;
- accesos/consultas especialmente sensibles;
- exportaciones de auditoría;
- intervenciones técnicas sobre una instalación.

No se convierte cada lectura rutinaria en un evento costoso si no aporta responsabilidad, salvo información especialmente sensible.

## 20.3 Tipos de actor

La auditoría distingue al menos:

- usuario administrativo identificado;
- `system` para automatizaciones;
- proveedor/proceso externo verificado;
- actor técnico/soporte identificado cuando interviene fuera de operación cotidiana.

Nunca se atribuye silenciosamente una acción técnica al dueño o a otro usuario.

## 20.4 Modelo mínimo de evento

Un evento conserva, según corresponda:

- ID inmutable;
- timestamp UTC;
- actor y tipo de actor;
- snapshot mínimo de identidad histórica;
- sesión/operación/correlación;
- acción;
- módulo;
- tipo e ID de entidad;
- valores anteriores/nuevos relevantes o diff mínimo;
- motivo;
- resultado (`succeeded`, `rejected`, `failed`, `unknown` o equivalente);
- proveedor/referencia externa cuando corresponda;
- identidad idempotente del evento de origen.

## 20.5 Minimización y secretos

Auditoría no almacena por comodidad:

- contraseñas;
- secretos MFA;
- tokens reutilizables;
- números completos de tarjeta;
- códigos de seguridad;
- credenciales bancarias innecesarias;
- cuerpos completos de request cuando contienen datos sensibles.

Se registra sólo contexto necesario para responsabilidad, investigación y reconstrucción de efectos.

## 20.6 Persistencia de acciones sensibles

Una acción sensible que contractualmente requiere auditoría no se considera correctamente completada si su evento obligatorio no puede persistirse.

Cuando hecho externo ya ocurrió, una falla local de auditoría no puede negar ese hecho: se utiliza recepción durable/recuperación determinista para completar efectos y evidencia sin falsificar el estado financiero externo.

## 20.7 Integridad

Los eventos no se editan/eliminan desde panel.

La implementación utiliza privilegios restringidos, respaldos y controles de integridad razonables. La primera versión no promete inmutabilidad criptográfica absoluta frente a una persona con control total de toda la infraestructura.

## 20.8 Consulta y exportación

Consultar auditoría requiere capacidad explícita. Se filtra por actor, acción, módulo, entidad, fecha, resultado/motivo cuando corresponda.

Exportar requiere:

- permiso específico;
- autenticación reciente;
- alcance temporal/controlado;
- registro de la propia exportación.

La exportación no se convierte en un archivo público permanente.

## 20.9 Conservación

Los eventos de auditoría se conservan **cinco años de forma predeterminada**, sujeto a ajuste legal/contractual del proyecto.

Ese plazo aplica a eventos de auditoría. **Su vencimiento no elimina pedidos, pagos, reservas, movimientos ni otros registros comerciales relacionados.**

Cualquier eliminación futura por retención se ejecuta mediante proceso controlado y deja evidencia operativa.

## 20.10 Analítica y registros técnicos

Auditoría, analítica y logs técnicos son conceptos separados.

- Auditoría: responsabilidad y evidencia de acciones.
- Analítica: métricas agregadas/operativas.
- Logs técnicos: diagnóstico de ejecución.

No se usa un log técnico volátil como sustituto de un evento de auditoría obligatorio.

## 20.11 Hechos externos y recepción durable

Webhooks/eventos externos pueden llegar repetidos, tarde o desordenados.

Un hecho externo confirmado no se representa como inexistente por una falla local.

Los efectos locales y auditoría se aplican atómicamente cuando es posible o se sustentan en una recepción durable que permita completar procesamiento determinísticamente.

Un evento parcialmente aplicado no se marca como procesado. La identidad idempotente del proveedor produce como máximo un conjunto de efectos locales.

## 20.12 Invariantes

1. Auditoría no reemplaza autoridad de dominio.
2. Toda acción sensible definida como auditable produce evidencia.
3. La identidad histórica del actor se conserva.
4. Acciones automáticas/proveedor identifican su actor real.
5. No existe suplantación silenciosa.
6. Eventos no se editan/eliminan desde panel.
7. Secretos y credenciales reutilizables no se registran.
8. Se minimiza PII/contexto técnico innecesario.
9. Fechas se almacenan en UTC.
10. Una acción sensible que exige auditoría no declara éxito local si no puede persistir su evidencia, salvo tratamiento durable explícito de hechos externos ya ocurridos.
11. Consultar información especialmente sensible y exportar auditoría también genera evento.
12. Toda exportación requiere permiso, autenticación reciente y acceso temporal/controlado.
13. Eventos se conservan cinco años por defecto.
14. Vencimiento de auditoría no elimina registros comerciales relacionados.
15. Eliminación por retención se ejecuta mediante proceso controlado y deja evidencia.
16. `unknown` nunca se presenta como éxito.
17. Eventos repetidos de proveedores se procesan idempotentemente.
18. Auditoría, analítica y logs técnicos permanecen separados.
19. Primera versión no promete inmutabilidad absoluta frente a quien controla toda infraestructura.
20. Hecho externo confirmado no se representa como inexistente por falla local.
21. Efectos locales de hecho externo se aplican con auditoría o se recuperan determinísticamente desde recepción durable.
22. Evento externo parcialmente aplicado no se considera procesado.
23. Identidad idempotente de proveedor produce como máximo un conjunto de efectos locales.