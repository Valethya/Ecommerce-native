# 10–13 — Pagos, pedidos y postventa

# 10. Transferencia bancaria

**Estado: Aprobada — flujo simple con confirmación administrativa**

## 10.1 Principio de simplicidad

La primera versión resuelve el caso común de una transferencia completa por el monto exacto.

Las diferencias de monto u otras discrepancias se resuelven directamente entre la administración y la persona compradora. El ecommerce bloquea los efectos ordinarios mientras la transferencia no haya sido confirmada como válida, pero **no modela ni automatiza el acuerdo económico usado para resolver la diferencia**.

La transferencia es un método configurado durante la implementación. Los datos bancarios no se editan desde el panel cotidiano.

## 10.2 Creación del pedido

Cuando la persona confirma checkout con transferencia:

1. se crea el pedido;
2. se reserva todo el inventario durante el plazo configurado, con 24 horas como valor predeterminado;
3. el pedido queda pendiente de pago;
4. se genera número público;
5. se muestran instrucciones bancarias;
6. se envían las mismas instrucciones al correo informado.

Las instrucciones incluyen titular, banco, tipo y número de cuenta, datos identificatorios necesarios, correo asociado cuando corresponda, monto exacto, número de pedido y vencimiento exacto.

El pedido conserva snapshot de las instrucciones entregadas. Cambiar la configuración bancaria después no reescribe pedidos anteriores.

## 10.3 Evidencia de pago

La primera versión no recibe comprobantes de transferencia.

Una captura o archivo no demuestra que el dinero llegó, puede falsificarse, añade superficie de almacenamiento y puede contener información sensible innecesaria.

La confirmación se basa en la comprobación directa del abono por el dueño o una persona autorizada. Como apoyo puede registrarse una referencia bancaria y una nota administrativa opcionales.

## 10.4 Confirmación administrativa

Sólo el dueño o una persona con permiso explícito para confirmar pagos puede ejecutar la acción.

Sin discrepancias, la confirmación ordinaria sólo procede cuando la transferencia:

- corresponde al pedido;
- puede identificarse suficientemente;
- coincide con monto y demás datos esperados.

Si existió discrepancia, 10.5 tiene precedencia: sólo después de revisión humana y de una determinación expresa de validez puede entrar al flujo ordinario o tardío. El sistema no reconstruye ni reevalúa el acuerdo económico previo.

Antes de confirmar, administración muestra pedido, comprador, monto esperado, vencimiento, productos reservados y advertencia sobre compromiso de inventario.

La confirmación ordinaria:

1. comprueba que el pedido continúa pendiente de pago;
2. comprueba que todas sus reservas vigentes siguen `active`;
3. registra actor, momento y referencia administrativa;
4. pasa la transferencia a `confirmed`;
5. compromete todas las reservas;
6. actualiza `paymentStatus = paid`;
7. mantiene `orderStatus = open`.

Es atómica e idempotente.

Para una transferencia discrepante, la confirmación manual es la autoridad humana de la excepción. El ecommerce no necesita conocer cómo se resolvió la diferencia económica; conserva que una persona autorizada revisó y confirmó la transferencia como válida.

La auditoría conserva actor, pedido, transferencia, acción, timestamp y contexto mínimo necesario; no almacena secretos ni datos bancarios innecesarios.

`paymentStatus = paid` pertenece a la dimensión financiera. La preparación sólo puede continuar si además cumple todas sus precondiciones de pedido e inventario.

Una confirmación no se deshace mediante un interruptor; un error posterior utiliza cancelación/reembolso formal.

## 10.5 Monto esperado y discrepancias

La primera versión solicita una única transferencia por el monto exacto.

No soporta como flujo normal:

- pagos parciales;
- varias transferencias por pedido;
- sobrepagos;
- compensaciones entre pedidos;
- saldos a favor.

Si el monto es inferior, superior o existe otra discrepancia, se trata como **excepción administrativa**, sin crear un nuevo estado de pago.

Mientras exista discrepancia:

- no se considera automáticamente pago válido;
- no se marca automáticamente `paid`;
- no se compromete inventario;
- no se habilita preparación;
- el sistema no considera resuelta la diferencia.

La administración contacta directamente al cliente y resuelve fuera del dominio automatizado. El ecommerce no incorpora solicitudes de saldo faltante, devolución automática de excedente, conciliación matemática, pagos parciales, múltiples transferencias, créditos, wallets, balances ni cuentas de cliente.

Sólo después de una confirmación humana válida se aplican efectos ordinarios o se entra al flujo tardío.

## 10.6 Vencimiento ordinario

Al vencer el plazo sin una transferencia confirmada y sin incertidumbre financiera:

- se liberan las reservas activas;
- el pedido pasa a `expired`;
- el pago deja de estar pendiente según la máquina financiera aplicable;
- la preparación permanece bloqueada.

El vencimiento no borra el pedido ni habilita reutilizar reservas `released`.

## 10.7 Transferencia tardía

La mera existencia de dinero después del vencimiento **no** introduce automáticamente el pedido al flujo tardío.

Primero una persona autorizada revisa y confirma que la transferencia puede considerarse válida. Si existe discrepancia, se resuelve fuera del sistema antes de esa confirmación.

Una vez confirmada como hecho financiero:

- la transferencia queda `confirmed`;
- `paymentStatus = paid` registra el dinero recibido;
- las reservas liberadas no se reactivan;
- el inventario no queda comprometido por ese hecho;
- un pedido `expired` continúa `expired`/en revisión hasta completar la resolución tardía;
- la preparación continúa bloqueada.

La resolución tardía intenta adquirir, para el pedido original y su snapshot original:

1. inventario actual suficiente para **todas** las líneas;
2. capacidad promocional actual cuando el uso original fue liberado.

Si todas las precondiciones se obtienen atómicamente, se crean nuevos registros de reserva, se comprometen, se compromete el uso promocional requerido y el pedido `expired` puede volver explícitamente a `open`. La transición es idempotente y auditable.

Si alguna precondición no puede satisfacerse, el pedido no se cumple y se inicia devolución completa. No se eliminan líneas, no se sustituyen productos y no se recalcula ni reescribe el snapshot económico.

## 10.8 Trazabilidad

Toda creación, vencimiento, revisión, confirmación y resolución tardía conserva la identidad de la operación, actor/proceso, pedido, resultado y motivo/contexto mínimo necesario.

## 10.9 Invariantes

1. La transferencia solicitada corresponde al total exacto del pedido.
2. El comprobante no es autoridad.
3. Sólo una persona autorizada confirma la transferencia.
4. La confirmación repetida no duplica efectos.
5. Un pedido vencido no consume inventario liberado sólo porque apareció dinero posteriormente.
6. `released` nunca se reactiva.
7. El pedido histórico no cambia de productos, cantidades ni snapshot para resolver un pago tardío.
8. Un hecho financiero y el compromiso de inventario son autoridades separadas.
9. Una discrepancia no constituye por sí misma un pago válido.
10. Las discrepancias son excepciones administrativas resueltas directamente con la persona compradora.
11. El ecommerce no modela ni automatiza la solución económica de una discrepancia.
12. Sólo una transferencia confirmada por una persona autorizada puede producir efectos financieros locales.
13. No existe preparación sin confirmación administrativa válida y las demás precondiciones del pedido.
14. La resolución humana no introduce pagos parciales, múltiples transferencias, saldos, créditos ni wallets.
15. Una transferencia tardía sólo entra al flujo tardío después de revisión y confirmación administrativa válida.

---

# 11. Pasarela de pago

**Estado: Aprobada — contrato independiente y pago alojado**

## 11.1 Alcance inicial

Cada ecommerce puede integrar una pasarela seleccionada durante su implementación. El cliente no la cambia ni añade otra desde el panel.

La primera versión utiliza checkout alojado o tokenización segura del proveedor:

- el sistema no solicita directamente números completos de tarjeta ni códigos de seguridad;
- no almacena datos de tarjeta;
- las credenciales permanecen sólo en servidor;
- la persona continúa el pago en el entorno seguro del proveedor.

No se construye inicialmente formulario propio de tarjetas.

## 11.2 Creación del pago

En flujo ordinario, después de confirmar checkout:

1. se crea el pedido;
2. se reserva inventario;
3. se crea intento interno;
4. el servidor solicita sesión a la pasarela;
5. la persona continúa en URL segura;
6. el proveedor notifica resultado al servidor.

El navegador no construye ni elige montos, monedas, identificadores comerciales ni URLs arbitrarias de pago.

## 11.3 Autoridad del resultado

Volver a una página visual de éxito o fracaso no confirma pago.

La autoridad sólo puede ser:

- webhook auténtico y verificado;
- consulta servidor-servidor al proveedor.

Antes de aceptar pago se valida proveedor, autenticidad, cuenta comercial, pedido, monto exacto, moneda, transacción y ausencia de otro pago ya aprobado para el mismo pedido.

## 11.4 Intentos

Un pedido conserva múltiples intentos históricos, pero sólo uno puede quedar aprobado y sólo uno puede estar activo a la vez.

Cada intento conserva pedido, proveedor, identificadores interno/proveedor, monto, moneda, estado, creación/vencimiento, eventos recibidos y resultado final conocido.

## 11.5 Estados del intento

| Estado | Significado |
| --- | --- |
| `pending` | El proveedor todavía puede resolverlo. |
| `approved` | El proveedor confirmó pago. |
| `rejected` | Rechazo definitivo. |
| `cancelled` | Sesión cancelada. |
| `expired` | Sesión perdió vigencia. |
| `unknown` | No hay información suficiente para decidir. |

Timeout, error de red o respuesta incompleta produce `unknown`; nunca rechazo automático.

## 11.6 Reintentos

Si un intento queda `rejected`, `cancelled` o `expired` y las reservas continúan activas:

- puede iniciarse un intento nuevo;
- se crea registro independiente;
- el anterior queda histórico;
- monto, moneda y pedido no cambian;
- nunca existen dos sesiones activas simultáneamente.

Cerrar la página no crea intento nuevo ni libera por sí solo inventario.

## 11.7 Webhooks y aprobaciones

Los eventos pueden llegar repetidos, desordenados, tarde o antes del retorno del navegador.

El procesamiento debe:

- verificar autenticidad;
- identificar unívocamente cada evento;
- ser idempotente;
- impedir regresión de un resultado financiero final por eventos antiguos;
- conservar auditoría necesaria;
- responder al proveedor sin depender del navegador;
- persistir efectos comerciales y auditoría atómicamente cuando compartan capacidad transaccional, o conservar una recepción durable que permita completar ambos de forma determinista.

Una falla local no puede representar como inexistente un hecho externo confirmado.

Después de validar proveedor, identidad, monto y moneda, se comprueba el estado de **todas** las reservas necesarias para decidir entre flujo ordinario y tardío. La ausencia de reservas activas no permite negar el hecho financiero externo.

### 11.7.1 Todas las reservas continúan `active`

1. comprobar que no existe otro pago aprobado;
2. intento → `approved`;
3. todas las reservas → `committed` atómicamente;
4. `paymentStatus = paid`;
5. `orderStatus = open`;
6. generar confirmación transaccional.

### 11.7.2 Alguna reserva ya está `released`

La resolución tardía tiene precedencia. La aprobación se registra como hecho financiero externo, pero **no** compromete automáticamente inventario ni habilita preparación.

## 11.8 Eventos repetidos y desordenados

La identidad idempotente del proveedor produce como máximo un conjunto de efectos locales. Un evento antiguo no puede degradar un estado final. Un evento ya procesado devuelve una respuesta consistente sin volver a ejecutar movimientos.

## 11.9 Conciliación de `unknown`

Cuando no hay certeza:

- se consulta servidor-servidor al proveedor;
- las reservas pueden mantenerse bajo retención excepcional acotada;
- existe un segundo vencimiento explícito;
- la retención no se renueva indefinidamente;
- al vencer sin resultado definitivo, se liberan reservas y el pedido queda en revisión;
- no se habilitan nuevos cobros hasta resolver la incertidumbre.

Si más tarde aparece una aprobación verdadera, se procesa como pago tardío.

## 11.10 Confirmación tardía

Al descubrir una aprobación después de haber liberado inventario:

1. se registra el hecho financiero y `paymentStatus = paid`;
2. no se reactivan reservas `released`;
3. no se habilita preparación automáticamente;
4. se intenta adquirir inventario actual para todas las líneas;
5. se intenta adquirir nuevo uso promocional si el anterior fue liberado;
6. si todo se obtiene, se crean reservas nuevas para el pedido original, se comprometen y la resolución puede reabrir `expired → open`;
7. si alguna precondición falla, corresponde devolución completa.

No existe cumplimiento parcial, sustitución de productos, reducción de líneas, crédito interno, compensación abierta ni recálculo del snapshot económico.

## 11.11 Contrato con proveedores

La lógica de pedidos e inventario no depende de una pasarela concreta. Cada adaptador implementa un contrato equivalente a:

```ts
interface PaymentGateway {
  createAttempt(input): Promise<GatewaySession>;
  getAttemptStatus(reference): Promise<GatewayStatus>;
  verifyWebhook(request): Promise<GatewayEvent>;
  expireAttempt(reference): Promise<void>;
}
```

Reemplazar una integración es intervención técnica y no convierte la pasarela en opción editable del panel.

## 11.12 Invariantes

1. Un proyecto usa una pasarela configurada durante implementación.
2. El navegador nunca confirma pagos.
3. El retorno visual no es autoridad.
4. Un pedido tiene como máximo un pago aprobado.
5. Sólo existe un intento activo por pedido.
6. `unknown` permanece incierto hasta conciliación.
7. Un evento repetido produce un solo efecto.
8. Monto y moneda deben coincidir exactamente.
9. Una aprobación tardía no consume automáticamente inventario liberado.
10. El sistema no almacena datos completos de tarjeta.
11. `unknown` no retiene inventario más allá del vencimiento extraordinario.
12. Un hecho confirmado por proveedor no se representa como inexistente por una falla local.
13. `released` nunca vuelve a `active` ni pasa a `committed`.
14. Toda aprobación descubierta después de liberar alguna reserva se rige por resolución tardía, sin importar canal de descubrimiento.
15. La resolución tardía tiene precedencia sobre compromiso normal.
16. `paymentStatus = paid` registra un hecho financiero y no implica por sí solo inventario ni preparación.
17. `expired → open` sólo ocurre dentro de resolución tardía autorizada con todas sus precondiciones.
18. Si la resolución tardía no satisface íntegramente inventario y uso promocional, termina en devolución completa sin mutar líneas ni snapshot.
19. Reservas activas son precondición para cobro ordinario controlado por el ecommerce, no para registrar un hecho externo ya ocurrido.
20. Registrar aprobación externa sin reservas activas deriva obligatoriamente a resolución tardía.

---

# 12. Pedidos

**Estado: Aprobado — estructura inicial con estados separados**

## 12.1 Propósito

El pedido es el registro durable de una intención de compra confirmada. Nace después de confirmación final de checkout y conserva la información comercial exacta de ese momento.

Coordina pagos, reservas y preparación, pero no sustituye la autoridad específica de esos módulos.

## 12.2 Separación de estados y autoridades

| Dimensión | Pregunta |
| --- | --- |
| Estado del pedido | ¿La operación sigue vigente o terminó? |
| Estado del pago | ¿El dinero está pendiente, confirmado, incierto, expirado o devuelto? |
| Reservas/inventario | ¿Las unidades están apartadas, comprometidas o disponibles? |
| Preparación | ¿Está pendiente, preparando, enviado o entregado? |
| Uso promocional | ¿El cupo está reservado, consumido o liberado? |

Ninguna dimensión se infiere exclusivamente de otra salvo transición explícita del dominio.

En particular, `paymentStatus = paid` **no demuestra** salida de inventario, pedido abierto, autorización de preparación ni uso promocional comprometido.

## 12.3 Información congelada

Al crearse, el pedido conserva como mínimo:

- identificadores estables de producto y variante;
- nombre y descripción comercial necesaria para identificar la compra;
- opciones seleccionadas;
- SKU histórico cuando corresponda;
- cantidad;
- precio unitario;
- descuento distribuido por línea;
- subtotal y total;
- modalidad y costo de entrega;
- instrucciones/configuración de pago necesarias para el pedido;
- datos de contacto y entrega necesarios;
- código/descuento y condiciones aplicadas;
- moneda;
- `sourceCheckoutId` o identidad idempotente de origen.

Editar catálogo, precio, nombre, SKU, descuento, zona o configuración después no reescribe este snapshot.

## 12.4 Estados del pedido

La máquina de pedido utiliza estados propios como `open`, `expired`, `cancelled` y `completed` según el flujo. `paid` nunca es un estado del pedido.

`expired → open` es una transición excepcional reservada a resolución tardía autorizada.

## 12.5 Estados financieros y de preparación

El resumen financiero se actualiza sólo por el módulo de pagos. La preparación mantiene su propia máquina y no se edita como campo arbitrario desde el panel.

La preparación sólo puede comenzar cuando, como mínimo:

- `orderStatus = open`;
- existe pago válido confirmado;
- todo el inventario requerido está comprometido.

## 12.6 Acceso público invitado

Comprar no exige cuenta.

El número público de pedido sirve para comunicación, **no es una credencial de autorización**. El acceso público utiliza una credencial opaca, impredecible, con alcance y revocación adecuados.

Corregir un correo o reemitir acceso revoca credenciales públicas anteriores aplicables.

## 12.7 Historial

Los pedidos no se eliminan desde administración. Sus snapshots y transiciones se preservan durante la política comercial aplicable.

## 12.8 Transiciones administrativas

El panel solicita acciones de dominio; no edita directamente valores de estado.

El servidor valida:

- identidad y permiso;
- estado actual;
- versión/concurrencia;
- precondiciones comerciales;
- idempotencia.

## 12.9 Expiración

Expirar un pedido pendiente libera recursos temporales según sus dominios, pero no lo borra. Un pago confirmado posteriormente se registra como hecho financiero y utiliza resolución tardía.

## 12.10 Preparación y cumplimiento

El estado de cumplimiento evoluciona mediante transiciones explícitas. Marcar envío, entrega o retiro requiere que el pedido se encuentre en condiciones compatibles y queda auditado.

## 12.11 Pago tardío sobre pedido expirado

Un pago tardío válido no reabre por sí solo el pedido.

El pedido permanece `expired`/en revisión hasta que resolución tardía asegure inventario y capacidad promocional íntegros. Sólo entonces puede ejecutarse `expired → open` de forma explícita, atómica, idempotente y auditable.

Si no puede satisfacerse, corresponde devolución completa y el pedido original conserva su snapshot.

## 12.12 Invariantes

1. Un checkout produce como máximo un pedido.
2. El pedido conserva snapshot comercial histórico.
3. `paid` pertenece sólo a la dimensión financiera.
4. Un pedido no se prepara sólo porque exista dinero recibido.
5. La preparación requiere inventario completamente comprometido.
6. El número público no autoriza acceso.
7. Un pedido no se elimina desde el panel.
8. Las transiciones administrativas son comandos de dominio, no edición arbitraria.
9. Un pago tardío no reabre automáticamente un pedido expirado.
10. Una resolución tardía fallida no modifica líneas ni snapshot; termina financieramente mediante devolución completa.

---

# 13. Cancelaciones, reembolsos y devoluciones

**Estado: Aprobado — operaciones completas**

## 13.1 Conceptos separados

- **Cancelación:** detiene pedido antes de entregarlo.
- **Reembolso:** devuelve dinero recibido.
- **Devolución:** registra regreso físico después de entrega/retiro.
- **Expiración:** termina plazo ordinario de pedido sin pago confirmado en ese momento.

No son estados intercambiables ni acciones equivalentes.

## 13.2 Alcance inicial

Se permite:

- cancelar pedidos completos;
- liberar reservas de pedidos no pagados;
- reintegrar antes del despacho únicamente unidades cuya salida física esté autoritativamente registrada para ese pedido;
- procesar o registrar reembolsos completos;
- registrar devoluciones completas administrativamente.

No se permite inicialmente:

- cancelación de líneas;
- devolución parcial;
- reembolso parcial;
- cambio de productos;
- crédito interno;
- solicitud automática de devolución por cliente;
- etiquetas/retiros de devolución automáticos;
- gestión de contracargos.

## 13.3 Cancelación antes del pago

Cuando existe certeza de que no fue pagado:

1. comprobar ausencia de pago confirmado y de `unknown` sujeto a conciliación;
2. liberar reservas `active`;
3. `orderStatus → cancelled`;
4. resumen financiero → `cancelled` según contrato financiero;
5. preparación → `cancelled`;
6. registrar motivo, actor y momento.

No existe reembolso porque no se recibió dinero.

Un `paymentStatus = unknown` no se cancela como impago hasta resolver incertidumbre.

## 13.4 Cancelación después del pago

Sólo antes de despacho, entrega o retiro.

La operación:

1. detiene preparación;
2. pedido → `cancelled`;
3. preparación → `cancelled`;
4. libera reservas todavía `active` sin aumentar stock físico;
5. si existieron salidas físicas autoritativas, las compensa exactamente una vez;
6. pago → `refund_pending`;
7. inicia/registra reembolso completo;
8. pago → `refunded` sólo después de confirmación válida.

Cancelación y despacho compiten de forma atómica; si el despacho se registró primero, ya no se usa este flujo.

## 13.5 Efecto sobre inventario

- Liberar reserva `active` sólo reduce reservado; no incrementa stock físico.
- Una unidad sólo vuelve a stock físico cuando existe evidencia autoritativa de una salida previa para ese pedido.
- Toda devolución de stock compensa una salida concreta como máximo una vez.
- `paymentStatus` no es evidencia de movimiento físico.

## 13.6 Reembolso de transferencia

El reembolso se registra como operación financiera nueva. La devolución bancaria se ejecuta manualmente fuera del ecommerce y una persona con permiso específico confirma después su realización.

La confirmación queda auditada. El pago sólo pasa a `refunded` cuando la devolución ha sido confirmada conforme al flujo.

## 13.7 Reembolso mediante pasarela

Cuando proveedor lo permite:

1. crear registro de reembolso;
2. solicitar devolución completa;
3. validar respuesta;
4. confirmar mediante webhook auténtico o consulta servidor-servidor;
5. actualizar `paymentStatus = refunded` sólo después de resultado válido.

Estados del reembolso:

| Estado | Significado |
| --- | --- |
| `pending` | Solicitado. |
| `succeeded` | Proveedor confirmó devolución. |
| `failed` | Rechazo definitivo. |
| `unknown` | Resultado incierto. |

Timeout o incertidumbre no se interpretan como fracaso ni provocan un segundo reembolso automático.

Si el reembolso resuelve pago tardío sin inventario/promoción suficiente, el pedido original no se reabre ni cambia snapshot. Si estaba `expired`, permanece `expired`; si aún estaba `open`, la cancelación autorizada puede llevarlo a `cancelled`.

## 13.8 Después del despacho o entrega

Un pedido `shipped`, `delivered` o `picked_up` no se cancela como si nunca hubiera salido.

Cuando el negocio acepta regreso físico:

- se registra devolución administrativa completa;
- el stock vuelve sólo después de recibir e inspeccionar físicamente;
- una persona autorizada decide si es vendible;
- unidades no vendibles se registran mediante ajuste de inventario;
- el reembolso sigue la política configurada.

El pedido puede permanecer `completed` porque entrega/retiro ocurrió; `refunded` describe separadamente el dinero.

## 13.9 Permisos

Se distinguen capacidades para:

- cancelar pedidos no pagados;
- cancelar pedidos pagados;
- ejecutar reembolsos;
- confirmar reembolsos manuales;
- registrar devoluciones;
- ajustar inventario no vendible.

El dueño puede tener todas, pero no se conceden automáticamente a quien sólo prepara pedidos.

## 13.10 Auditoría

Cada acción registra pedido, actor, fecha, motivo, estado anterior/nuevo, unidades liberadas/reintegradas, monto reembolsado, proveedor/referencia cuando corresponda y resultado.

Motivos iniciales: solicitud del comprador, pedido duplicado, problema de inventario, problema de pago, decisión del negocio u otro con nota obligatoria.

## 13.11 Invariantes

1. Un pedido se cancela una sola vez.
2. Una unidad vuelve al inventario una sola vez por salida autoritativa.
3. Un reembolso exitoso no se repite.
4. Cancelar no borra el pago original.
5. Todo reembolso crea registro financiero nuevo y auditable; no implica por sí solo movimiento de inventario.
6. Un pedido despachado no usa cancelación previa al despacho.
7. Un resultado incierto permanece incierto hasta conciliación.
8. Toda acción sensible exige permiso y auditoría.
9. La primera versión opera sobre pedido completo.
10. Una devolución física no reintegra stock antes de inspección.
11. `paymentStatus = paid` no implica inventario comprometido.
12. Ninguna unidad se reintegra sin evidencia de salida previa.
13. Toda devolución de stock compensa una salida concreta y no se infiere del estado financiero.
14. Liberar reserva `active` nunca incrementa stock físico.
15. Una salida autoritativa se compensa como máximo una vez.
16. Un pago tardío sin inventario comprometido puede resolverse financieramente, pero nunca crea stock.
17. Un pedido `unknown` financieramente no se cancela como impago hasta resolver incertidumbre.