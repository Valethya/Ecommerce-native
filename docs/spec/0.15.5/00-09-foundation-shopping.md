# 0–9 — Fundación, compra y reservas

## 0. Propósito del documento

Esta especificación define parámetros funcionales, límites, invariantes y decisiones arquitectónicas para la construcción de `ecommerce-native`.

La base se utilizará como punto de partida para proyectos independientes de ecommerce. Cada negocio recibe una instalación propia, configurada según su operación y adaptada posteriormente en experiencia visual. No es una plataforma de autoconfiguración ni un constructor de tiendas para clientes.

La implementación debe ajustarse a la especificación. Ninguna función, permiso o regla comercial se incorpora únicamente porque sea técnicamente posible.

### 0.1 Estados documentales

- **Aprobada:** decisión aceptada y vinculante.
- **Propuesta:** alternativa recomendada todavía pendiente de revisión.
- **Pendiente:** asunto identificado sin decisión final.
- **Reemplazada:** decisión que dejó de regir y conserva referencia a su sustituta.

### 0.2 Control de cambios

- Las decisiones aprobadas no se modifican silenciosamente.
- Todo cambio funcional debe indicar qué regla reemplaza y por qué.
- Las exclusiones son vinculantes; no son deuda implícita.
- Cada fase de implementación identifica qué secciones satisface.
- La base puede crecer, pero cualquier evolución respeta las autoridades y límites definidos.

---

## 1. Decisión de producto

**Estado: Aprobada**

Se mantienen dos bases independientes:

1. `ecommerce-native`: motor comercial autoconstruido y bajo control propio.
2. `ecommerce-shopify`: integración especializada donde Shopify es la autoridad comercial.

No se construye inicialmente un motor universal capaz de alternar entre ambas modalidades ni una librería de dominio compartida antes de que repetición real demuestre qué es genuinamente común.

Esta especificación regula exclusivamente `ecommerce-native`.

---

## 2. Principios rectores

**Estado: Aprobada**

1. Construir sólo lo necesario para la operación actual, dejando límites que permitan crecer sin rehacer el sistema.
2. Una instalación corresponde a una tienda y una base de datos propias.
3. El sistema es la única autoridad sobre catálogo, inventario, carritos, pedidos y pagos registrados.
4. El panel administrativo permite operar el ecommerce, no rediseñar su arquitectura.
5. Las decisiones estructurales se fijan durante la implementación de cada proyecto.
6. El navegador nunca es autoridad sobre precios, stock, descuentos, moneda, pagos ni totales.
7. Los datos históricos de una venta no cambian cuando se edita el catálogo.
8. Las capacidades futuras se incorporan como evolución deliberada, no como configuraciones ocultas o funciones incompletas.

---

## 3. Perfil de la primera versión

**Estado: Aprobada**

La primera versión está orientada a comercios independientes con:

- productos físicos;
- catálogo pequeño o mediano;
- una tienda por instalación;
- una moneda principal configurada por proyecto;
- ventas nacionales;
- un inventario unificado;
- una cantidad reducida de personas administradoras;
- variantes convencionales como talla, color, formato o material;
- descuentos simples;
- compra como invitado, sin cuenta de cliente;
- pago por transferencia bancaria, una pasarela configurada o ambos;
- retiro y/o despacho mediante reglas simples configuradas por proyecto.

---

## 4. Alcance funcional inicial

**Estado: Aprobada**

La base puede incluir, según la configuración técnica de cada proyecto:

- catálogo de productos físicos;
- variantes y precios;
- inventario y movimientos;
- carrito;
- checkout como invitado;
- reserva temporal de inventario;
- transferencia bancaria;
- una pasarela de pago seleccionada durante la implementación;
- pedidos y preparación;
- cancelación, reembolso y devolución completa;
- descuentos simples por código;
- despacho por zonas fijas y/o un punto de retiro;
- panel administrativo;
- correo transaccional y alertas operativas;
- auditoría transversal.

### 4.1 Exclusiones iniciales

No forman parte de la primera versión:

- marketplace;
- múltiples tiendas dentro de una instalación;
- múltiples monedas;
- venta internacional;
- múltiples bodegas;
- cuentas de clientes;
- suscripciones;
- programa de puntos;
- carritos compartidos;
- sincronización de carrito entre dispositivos;
- integraciones contables;
- constructor visual de tienda;
- cambio de motor, pasarela o arquitectura desde el panel administrativo.

Estas exclusiones no impiden evolución posterior; declaran que no son parte del contrato inicial.

---

## 5. Configuración estructural y administración

**Estado: Aprobada**

### 5.1 Decisiones fijadas por proyecto

La implementación de cada negocio determina:

- método o métodos de pago habilitados;
- proveedor de pasarela, cuando corresponda;
- datos e instrucciones de transferencia;
- moneda;
- reglas de despacho y retiro;
- política de descuentos permitida;
- reglas técnicas que validan límites de compra;
- funciones administrativas disponibles;
- integraciones externas.

Estas decisiones estructurales no se modifican desde el panel cotidiano. Un cambio posterior constituye una intervención técnica evaluada como evolución del proyecto.

El dueño sí puede definir límites operativos de productos o variantes dentro de las reglas validadas por el sistema.

### 5.2 Operación permitida al cliente

Según las capacidades habilitadas, el panel puede permitir:

- crear, editar, publicar y archivar productos;
- administrar variantes;
- modificar imágenes, descripciones y precios;
- actualizar inventario;
- definir límites de compra;
- crear descuentos dentro de los tipos habilitados;
- ver y operar pedidos;
- preparar, despachar, cancelar o reembolsar cuando el flujo contratado lo permita.

El panel no permite instalar integraciones, cambiar métodos de pago, crear estados nuevos, editar arbitrariamente estados, ejecutar transiciones fuera de las máquinas autorizadas, alterar permisos estructurales ni reconfigurar el motor comercial.

La interfaz sólo solicita transiciones. El servidor valida autoridad, permiso, estado y precondiciones y ejecuta el efecto.

---

## 6. Módulos funcionales

| Módulo | Estado documental |
| --- | --- |
| Carrito | Aprobado — definición funcional cerrada |
| Checkout | Aprobado — estructura funcional general |
| Reserva de inventario | Aprobada — definición funcional general |
| Transferencia bancaria | Aprobada — flujo simple con confirmación administrativa |
| Pasarela de pago | Aprobada — contrato independiente y pago alojado |
| Pedidos | Aprobado — estructura inicial con estados separados |
| Cancelaciones, reembolsos y devoluciones | Aprobado — operaciones completas |
| Catálogo, productos y variantes | Aprobado — modelo comercial y administración inicial |
| Inventario | Aprobado — movimientos, ajustes y concurrencia |
| Descuentos | Aprobado — códigos simples con uso controlado |
| Despacho y retiro | Aprobado — zonas fijas, retiro único y operación manual |
| Panel administrativo | Aprobado — operación individual, permisos y sesiones seguras |
| Notificaciones | Aprobado — comunicaciones transaccionales y alertas operativas |
| Auditoría | Aprobada — evidencia transversal, integridad y responsabilidad |

---

# 7. Carrito

**Estado: Aprobado**

## 7.1 Propósito y autoridad

El carrito representa una intención de compra temporal.

El carrito:

- no es un pedido;
- no acredita una compra;
- no congela precios;
- no reserva inventario;
- no garantiza que una variante continúe disponible;
- no puede declarar por sí mismo un pago ni una obligación comercial.

El servidor es la única autoridad sobre contenido válido, precios vigentes, disponibilidad, descuentos, moneda y cálculos.

## 7.2 Capacidades

Un carrito activo permite:

- agregar una variante y cantidad;
- aumentar o disminuir cantidad;
- eliminar líneas;
- vaciar carrito;
- recuperar el carrito desde el mismo navegador;
- aplicar o retirar un código de descuento permitido;
- consultar subtotal, descuento y total estimado;
- avanzar al checkout cuando todas sus líneas sean válidas.

No incluye inicialmente sincronización entre dispositivos, recuperación por correo, fusión de carritos, carritos compartidos ni recuperación comercial de carritos abandonados.

## 7.3 Identidad y persistencia

- Un carrito invitado utiliza un identificador aleatorio, opaco y no predecible.
- El navegador conserva sólo la credencial necesaria; el servidor almacena el contenido autoritativo.
- El identificador no incorpora precios, permisos ni información comercial confiable.
- Una tienda mantiene como máximo un carrito activo por contexto de navegador.
- El carrito puede crearse de forma perezosa al incorporar la primera línea.
- Después de convertirlo en pedido, cualquier compra posterior utiliza un carrito nuevo.

## 7.4 Líneas y cantidades

- Cada línea corresponde exactamente a una variante.
- Una variante no aparece duplicada en líneas distintas del mismo carrito; agregarla nuevamente ajusta cantidad.
- La cantidad es un entero positivo.
- La cantidad debe respetar el límite de compra configurado y la disponibilidad al momento de cada validación.
- El límite predeterminado por variante es 50 unidades, salvo configuración operativa válida distinta.

## 7.5 Disponibilidad

Agregar una variante al carrito **no reserva** inventario.

La disponibilidad se valida al agregar, modificar, recuperar y antes de confirmar checkout. La reserva inicial sólo se crea durante la confirmación final del checkout junto con el pedido.

Una reserva posterior sólo puede existir dentro de la resolución tardía explícita definida en la sección 9 y los flujos de pago tardío.

## 7.6 Totales y descuentos

Subtotal, descuento y total estimado se recalculan en servidor. El navegador puede mostrar resultados, pero nunca suministrarlos como autoridad para crear el pedido.

Modificar el carrito obliga a revalidar el descuento aplicado.

## 7.7 Ciclo de vida

Estados funcionales:

- `active`;
- `converted`;
- `expired`.

`converted` sólo se alcanza cuando existe un pedido durable creado correctamente. Es terminal.

Un carrito inactivo puede expirar después de 30 días. Su expiración no tiene efecto sobre inventario. Los datos temporales del carrito expirado pueden eliminarse posteriormente conforme a la política técnica de datos efímeros; no se utilizan para contactar comercialmente a la persona.

## 7.8 Concurrencia

Las mutaciones del carrito protegen contra escrituras desactualizadas mediante una versión o mecanismo equivalente. Una actualización antigua no sobrescribe silenciosamente un carrito más nuevo.

## 7.9 Invariantes

1. El navegador nunca es autoridad comercial.
2. El carrito no reserva ni descuenta stock.
3. Una cantidad nunca es negativa, cero ni supera límites validados.
4. El precio del carrito no queda congelado.
5. El checkout no puede confirmarse con líneas inválidas.
6. `converted` es terminal.
7. Una misma operación repetida no duplica líneas ni efectos.
8. Un carrito convertido no produce un segundo pedido.
9. Un fallo posterior de pago se resuelve desde el pedido; no convierte nuevamente el pedido en carrito.

---

# 8. Checkout

**Estado: Aprobado**

## 8.1 Propósito

El checkout es una entidad temporal separada del carrito y del pedido. Recoge los datos necesarios para intentar una compra sin convertir información personal en parte permanente del carrito.

Abrir o completar parcialmente un checkout no crea pedido, no convierte el carrito y no acredita compra.

## 8.2 Relación con el carrito

- El checkout pertenece a un carrito activo.
- No puede utilizar un carrito ajeno, convertido o expirado.
- Los cambios del carrito obligan a revalidar el checkout.
- Una persona puede recuperar el checkout activo asociado al mismo contexto autorizado.

## 8.3 Datos mínimos

Contacto:

- nombre;
- apellido;
- correo;
- teléfono.

No se exige cuenta, contraseña, fecha de nacimiento, identificación personal general ni consentimiento de marketing para comprar. Datos tributarios adicionales sólo se solicitan cuando el proyecto realmente los necesita para facturación.

Para despacho se solicita como mínimo nombre de quien recibe, región, comuna, calle, número, complemento opcional e indicaciones opcionales.

Para retiro se presenta el punto configurado y sus condiciones, sin solicitar dirección de despacho.

## 8.4 Pago y entrega

La persona sólo puede elegir entre métodos y modalidades habilitados estructuralmente para la instalación.

Elegir método de pago no crea pedido ni ejecuta cobro.

El servidor calcula elegibilidad y costo de despacho/retiro a partir de configuración vigente.

## 8.5 Revalidación final

Antes de crear el pedido, el servidor revalida como mínimo:

- carrito y versión vigentes;
- variantes activas;
- cantidades y límites;
- stock disponible;
- precios actuales;
- descuento y capacidad promocional;
- modalidad de entrega y costo;
- método de pago;
- datos obligatorios.

Si precio, disponibilidad, descuento o costo cambió, el checkout no se confirma silenciosamente: se muestra el nuevo resultado y la persona debe revisarlo y confirmar nuevamente.

## 8.6 Confirmación final, atomicidad e idempotencia

La confirmación explícita del checkout constituye una única operación lógica:

1. revalidar;
2. reservar inventario para todas las líneas o ninguna;
3. reservar el uso promocional cuando corresponda;
4. congelar productos, variantes, cantidades, precios, descuentos y costos relevantes;
5. crear exactamente un pedido durable;
6. marcar el carrito como `converted`;
7. marcar el checkout como `completed`.

Si falla una precondición, no debe quedar un pedido parcial ni reservas huérfanas.

Cada checkout confirmado posee una identidad idempotente (`sourceCheckoutId` o equivalente). Repetir la misma confirmación recupera el pedido ya creado y no crea otro pedido ni duplica reservas.

La creación inicial de reservas pertenece exclusivamente a este flujo. Una resolución tardía posterior puede crear **nuevos registros de reserva para el mismo pedido original**, nunca volver a ejecutar checkout ni crear un pedido sustituto.

## 8.7 Ciclo de vida y retención técnica

Estados:

- `active`;
- `completed`;
- `expired`.

Un checkout activo expira después de 24 horas sin actividad. Expirarlo no expira necesariamente el carrito; si el carrito sigue válido puede iniciarse otro checkout.

Después de completarse, el checkout se reduce a la información técnica mínima necesaria y no duplica indefinidamente datos personales o el snapshot comercial del pedido. Su registro temporal puede tener una retención técnica limitada; la identidad idempotente queda preservada en el pedido incluso después de eliminar el objeto temporal.

Eliminar el registro temporal nunca habilita crear otro pedido desde el mismo checkout histórico.

## 8.8 Invariantes

1. No existe pedido antes de la confirmación final explícita.
2. Un checkout produce como máximo un pedido durable.
3. El servidor recalcula todo dato comercial antes de confirmar.
4. La creación de pedido y reservas iniciales es todo-o-nada.
5. Un reintento no duplica pedido, reserva ni uso promocional.
6. El checkout no se convierte en autoridad histórica; el pedido conserva el snapshot comercial.
7. La expiración de checkout no modifica por sí sola inventario ni un pedido ya creado.

---

# 9. Reservas de inventario

**Estado: Aprobada**

## 9.1 Propósito

Las reservas separan stock físico, stock reservado y stock disponible para impedir sobreventa durante el periodo en que un pedido espera confirmación de pago.

`stockDisponible = stockFisico - stockReservado`.

## 9.2 Contextos válidos de creación

Existen sólo dos contextos:

### Creación inicial

Las reservas iniciales se crean durante la confirmación final del checkout, en la misma operación lógica que crea el pedido. Todas las líneas se reservan o ninguna.

### Resolución tardía

Las secciones 10.7 y 11.10 pueden crear un **nuevo conjunto de reservas para el mismo pedido durable** cuando las reservas originales ya fueron liberadas.

En este caso:

- no se crea un segundo pedido;
- no se vuelve a ejecutar checkout;
- se crean registros nuevos;
- nunca se reactiva, sobrescribe ni reutiliza una reserva `released`;
- cualquier reserva activa residual del conjunto anterior se libera como parte de la resolución controlada;
- se comprueba stock disponible actual;
- se obtienen todas las líneas o ninguna atómicamente;
- la misma resolución tardía es idempotente;
- no existe cumplimiento parcial.

No existe una operación administrativa genérica para recrear reservas.

## 9.3 Identidad

Cada reserva:

- pertenece a un pedido durable;
- corresponde a una variante y una cantidad positiva;
- conserva creación y vencimiento;
- no se transfiere ni reutiliza entre pedidos;
- conserva identidad e historial aunque termine liberada o comprometida.

Una reserva no pertenece únicamente a navegador, carrito o checkout.

## 9.4 Estados

| Estado | Significado |
| --- | --- |
| `active` | Unidades apartadas mientras el pedido espera resolución. |
| `committed` | El pago válido comprometió las unidades y existe la salida física autoritativa correspondiente. |
| `released` | Las unidades dejaron de estar reservadas. Estado terminal. |

`released` nunca vuelve a `active` ni pasa a `committed`.

La expiración se registra como causa de liberación, no como un cuarto estado de reserva.

Una reserva activa puede encontrarse bajo plazo ordinario o bajo una retención excepcional y acotada de conciliación de pago `unknown`. La retención excepcional posee un segundo vencimiento explícito y no puede renovarse indefinidamente.

## 9.5 Compromiso normal

Si todas las reservas del conjunto vigente continúan `active` cuando se confirma válidamente el pago:

- pasan a `committed` de forma atómica;
- se registra la salida física correspondiente;
- el stock reservado disminuye;
- la disponibilidad permanece coherente;
- el mismo pago o evento repetido no vuelve a descontar.

Si alguna reserva original ya está `released`, el compromiso normal no puede utilizar ese conjunto. La resolución tardía tiene precedencia.

Cuando una resolución tardía obtiene un nuevo conjunto, ese conjunto pasa a ser el vigente; los registros originales permanecen históricos.

## 9.6 Transferencia bancaria

Plazo ordinario predeterminado: **24 horas**, configurable por proyecto dentro del contrato aprobado.

## 9.7 Pasarela

Plazo ordinario predeterminado: **30 minutos** para el intento de pago, sujeto a la integración concreta y a la conciliación definida en la sección 11.

## 9.8 Transiciones y resultados inciertos

Comprometer y liberar son operaciones atómicas e idempotentes.

Un pago `unknown` puede mantener temporalmente reservas mediante una retención excepcional con vencimiento explícito. Al vencer sin resultado definitivo, las reservas se liberan y el pedido permanece en revisión; no se habilitan nuevos cobros hasta resolver la incertidumbre financiera.

## 9.9 Cobros ordinarios y hechos externos

Un cobro ordinario iniciado o controlado por el ecommerce sólo se inicia o completa cuando existen reservas activas para todas las líneas.

Esta precondición **no impide registrar un hecho financiero externo ya ocurrido**. Si un proveedor o revisión posterior confirma un pago cuando las reservas ya no están activas, se registra el hecho financiero y se deriva obligatoriamente a resolución tardía, sin comprometer inventario ni habilitar preparación automáticamente.

## 9.10 Trazabilidad

Todo compromiso o liberación identifica pedido, variante, cantidad, causa, actor/proceso y operación correlacionada. Los registros terminales se conservan conforme a la política comercial aplicable y no se reescriben para aparentar continuidad.

## 9.11 Invariantes

1. Toda reserva activa pertenece a un pedido durable.
2. Una reserva corresponde a una sola variante y una cantidad positiva.
3. La suma reservada nunca supera el stock físico válido.
4. Un pedido reserva todas sus líneas o ninguna.
5. Una reserva termina como `committed` o `released`.
6. Una transición repetida no produce un segundo efecto.
7. El stock disponible no puede ser negativo.
8. Un pedido sólo puede iniciar un nuevo cobro, autorizar un nuevo intento o completar ordinariamente un pago si mantiene reservas activas para todas sus líneas.
9. Un pago tardío no consume automáticamente unidades ya liberadas.
10. Todo compromiso o liberación genera trazabilidad.
11. Una retención por conciliación tiene segundo vencimiento explícito y no puede renovarse indefinidamente.
12. Al vencer la retención excepcional sin resultado definitivo, las reservas se liberan y el pedido permanece en revisión sin habilitar nuevos cobros.
13. `released` es terminal.
14. La creación inicial pertenece al checkout; la creación posterior sólo está permitida dentro de resolución tardía autorizada.
15. Una resolución tardía nunca crea un segundo pedido para sustituir al original.
16. Las nuevas reservas tardías son registros nuevos asociados al pedido original y se obtienen para todas las líneas o ninguna.
17. Registrar un pago externo ya ocurrido no exige reservas activas, pero nunca compromete inventario ni habilita preparación por sí solo.
18. No existe una operación administrativa genérica para recrear reservas.

## 9.12 Contratos relacionados y decisión restante

- Los ajustes físicos que podrían afectar unidades reservadas se rigen por la sección 15.5.
- Los pagos tardíos se resuelven según 10.7 y 11.10.
- La conciliación común se define en 11.9; cada adaptador concreta sólo el protocolo técnico de su proveedor.
- La devolución de unidades después de cancelaciones o reembolsos se rige por 13.5 y 15.7.

Continúa abierta únicamente la política transversal de conservación comercial aplicable a pedidos, pagos, reservas y movimientos. Los cinco años de auditoría no autorizan a eliminarlos automáticamente.

Esta decisión pendiente no altera transiciones, prohibición de sobreventa ni comportamiento operativo.