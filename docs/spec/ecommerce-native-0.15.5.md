# Ecommerce Native — Especificación funcional viva

**Estado general:** Especificación funcional consolidada — aclaración administrativa de transferencias  
**Versión documental:** 0.15.5  
**Última actualización:** 28 de agosto de 2026  
**Fase actual:** Definición previa a implementación  
**Implementación autorizada:** No

---

## 0. Propósito del documento

Este documento define los parámetros funcionales, límites, invariantes y decisiones arquitectónicas que regirán la construcción de la base `ecommerce-native`.

La base se utilizará como punto de partida para proyectos independientes de ecommerce. Cada negocio recibirá una instalación propia, configurada según su operación y posteriormente adaptada en experiencia visual. No será una plataforma de autoconfiguración ni un constructor de tiendas para clientes.

La implementación deberá ajustarse a esta especificación. Ninguna función, permiso o regla comercial se incorporará únicamente porque resulte técnicamente posible.

### 0.1 Estados documentales

- **Aprobada:** decisión aceptada y vinculante para la implementación.
- **Propuesta:** alternativa recomendada que todavía debe revisarse.
- **Pendiente:** asunto identificado que aún no tiene una decisión.
- **Reemplazada:** decisión que dejó de regir; debe conservar referencia a la nueva decisión.

### 0.2 Control de cambios

- Las decisiones aprobadas no se modificarán silenciosamente.
- Todo cambio funcional deberá indicar qué regla reemplaza y por qué.
- Las exclusiones son vinculantes: no son tareas implícitas ni deuda automática.
- Cada fase de implementación deberá identificar las secciones de esta especificación que satisface.
- La base podrá crecer, pero el crecimiento deberá respetar las autoridades y límites definidos.

---

## 1. Decisión de producto

**Estado: Aprobada**

Se mantendrán dos bases independientes:

1. `ecommerce-native`: motor comercial autoconstruido y bajo control propio.
2. `ecommerce-shopify`: integración especializada donde Shopify es la autoridad comercial.

No se construirá inicialmente un motor universal capaz de alternar entre ambas modalidades. Tampoco se extraerá una librería compartida de dominio antes de que la repetición real demuestre qué elementos son genuinamente comunes.

Este documento regula exclusivamente `ecommerce-native`.

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
8. Las capacidades futuras se incorporarán como evolución deliberada, no como configuraciones ocultas o funciones incompletas.

---

## 3. Negocio objetivo de la primera versión

**Estado: Aprobada**

La primera base está dirigida a emprendimientos cuya operación comercial sea sencilla, aunque pueda crecer en volumen o valor de compra.

Características esperadas:

- Productos físicos.
- Catálogo pequeño o mediano.
- Una tienda por instalación.
- Una moneda principal.
- Operación principalmente nacional.
- Inventario unificado.
- Una cantidad reducida de personas administradoras.
- Variantes convencionales como talla, color, formato o peso.
- Descuentos simples.
- Compra como invitado.
- Transferencia bancaria, una pasarela de pago o ambas, según la configuración entregada.
- Retiro y/o despacho mediante reglas previamente configuradas.

El criterio de adecuación no será únicamente el volumen de ventas. Un negocio de poco volumen puede requerir una operación compleja; un negocio de mayor volumen puede seguir siendo adecuado si conserva reglas simples.

---

## 4. Alcance transversal inicial

**Estado: Aprobada**

La base contemplará, por fases:

- Catálogo de productos físicos.
- Variantes.
- Precios.
- Inventario y movimientos de stock.
- Carrito.
- Checkout como invitado.
- Transferencia bancaria.
- Integración con una pasarela seleccionada por proyecto.
- Pedidos y estados de preparación.
- Retiro y despacho mediante reglas configuradas.
- Descuentos dentro de una política limitada.
- Panel administrativo operativo.
- Notificaciones transaccionales.
- Registro auditable de operaciones importantes.

### 4.1 Exclusiones iniciales

**Estado: Aprobada**

- Marketplace.
- Múltiples tiendas dentro de una instalación.
- Múltiples monedas.
- Venta internacional.
- Múltiples bodegas.
- Cuentas de clientes.
- Suscripciones.
- Programa de puntos.
- Carritos compartidos.
- Sincronización de carrito entre dispositivos.
- Integraciones contables.
- Constructor visual de tienda.
- Cambio de motor, pasarela o arquitectura desde el panel administrativo.

Estas exclusiones no impiden una evolución posterior; indican que no formarán parte de la primera versión.

---

## 5. Configuración estructural y administración

**Estado: Aprobada**

### 5.1 Decisiones fijadas por proyecto

La implementación de cada negocio determinará:

- Método o métodos de pago habilitados.
- Proveedor de la pasarela, cuando corresponda.
- Datos e instrucciones para transferencia.
- Moneda.
- Reglas de despacho y retiro.
- Política de descuentos permitida.
- Reglas técnicas que validan los límites de compra.
- Funciones administrativas disponibles.
- Integraciones externas.

El cliente no podrá modificar estas decisiones estructurales desde su panel. Esto no impide que el dueño defina el límite operativo de cada producto o variante dentro de las reglas validadas por el sistema. Un cambio estructural posterior será una intervención técnica evaluada e implementada como evolución del proyecto.

### 5.2 Operación permitida al cliente

Según las capacidades entregadas, el panel podrá permitir:

- Crear, editar, publicar y archivar productos.
- Administrar variantes.
- Modificar imágenes, descripciones y precios.
- Actualizar inventario.
- Definir límites de compra por producto o variante.
- Crear descuentos dentro de reglas habilitadas.
- Ver y operar pedidos.
- Preparar, despachar, cancelar o reembolsar pedidos cuando el flujo contratado lo permita.

El panel no permitirá instalar integraciones, cambiar métodos de pago, modificar arbitrariamente el valor de los estados, crear estados nuevos, ejecutar transiciones fuera de las máquinas de estados autorizadas, modificar permisos estructurales ni reconfigurar el motor comercial.

Sí podrá solicitar las transiciones comerciales expresamente habilitadas por cada dominio cuando la persona tenga permiso y se cumplan las precondiciones. El servidor validará y ejecutará la transición; la interfaz nunca será autoridad sobre el estado.

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

**Estado: Aprobado — primera definición**

## 7.1 Propósito y autoridad

El carrito representa una intención de compra temporal.

El carrito:

- No es un pedido.
- No acredita una compra.
- No congela precios.
- No reserva inventario.
- No garantiza que una variante continúe disponible.
- No puede declarar por sí mismo un pago ni una obligación comercial.

El servidor es la única autoridad sobre el contenido válido, precios vigentes, disponibilidad, descuentos, moneda y cálculos.

## 7.2 Capacidades

Un carrito activo permitirá:

- Agregar una variante y una cantidad.
- Aumentar o disminuir la cantidad de una línea.
- Eliminar una línea.
- Vaciar el carrito.
- Recuperar el carrito desde el mismo navegador.
- Aplicar o retirar un código de descuento permitido.
- Consultar subtotal, descuento y total estimado.
- Avanzar al checkout cuando todas sus líneas sean válidas.

No incluirá inicialmente:

- Sincronización entre dispositivos.
- Recuperación por correo.
- Fusión entre carritos.
- Carritos compartidos.
- Recuperación comercial de carritos abandonados.

## 7.3 Identidad y persistencia

- El carrito de una persona invitada se identificará mediante un token aleatorio, opaco y no predecible.
- El navegador conservará únicamente el identificador necesario; el servidor almacenará el contenido autoritativo.
- El identificador no incluirá precios, permisos ni información comercial confiable.
- Cada navegador tendrá un carrito activo por tienda.
- El carrito se creará de manera perezosa al realizar la primera operación que lo necesite; visitar la tienda no exige crear un registro vacío.
- Después de completar una compra, las nuevas operaciones utilizarán un carrito nuevo.
- Un carrito expirará tras **30 días sin actividad**.
- La expiración del carrito no modifica inventario porque el carrito nunca lo reservó.
- Un carrito expirado se conservará internamente durante **90 días** y después se eliminará.
- Las métricas anónimas y agregadas sobre abandono podrán conservarse sin mantener el carrito completo.
- La retención de un carrito expirado no se utilizará para contactar a la persona compradora.

## 7.4 Líneas y variantes

- Cada línea representa exactamente una variante comercial.
- Una variante sólo puede aparecer una vez en el carrito.
- Agregar nuevamente la misma variante incrementa su cantidad en vez de crear una línea duplicada.
- Variantes distintas del mismo producto permanecen en líneas separadas.
- La cantidad debe ser un número entero positivo.
- La cantidad no puede superar el stock disponible al momento de la validación.
- También deberá respetar el límite de compra definido por el dueño para el producto o variante.
- Cuando el dueño no defina un límite particular, se aplicará un valor predeterminado de **50 unidades por variante**.
- El dueño podrá modificar el límite desde el panel administrativo como parte de la operación del catálogo.
- El límite de compra nunca permite superar el stock disponible.

## 7.5 Inventario

- Agregar una variante al carrito no reserva stock.
- La disponibilidad se comprueba al agregar, recuperar o modificar una línea.
- El stock se volverá a validar antes de iniciar el checkout.
- Nunca se permitirá una cantidad superior a la disponibilidad validada.
- Si el inventario cambia, la línea permanecerá visible con un conflicto explícito.
- El sistema no continuará al checkout mientras exista una línea inválida.
- La reserva inicial de inventario se rige por la confirmación atómica del checkout y el módulo de reservas definidos en las secciones 8.8 y 9. La única creación posterior permitida corresponde a la resolución tardía excepcional de la sección 9.2.

## 7.6 Precio y cálculos

- El navegador no puede establecer precios, descuentos, moneda ni totales.
- El carrito obtiene el precio vigente desde el catálogo autoritativo.
- El precio no se congela mientras el elemento permanezca en el carrito.
- Al recuperar o modificar el carrito, sus cálculos se actualizan con la información vigente.
- Cuando un precio cambie, la respuesta deberá permitir informar el cambio de forma explícita.
- El carrito mostrará subtotal, descuento y total estimado.
- El despacho no se incluirá hasta disponer de la información y método necesarios en checkout.
- Los valores definitivos se congelarán en el pedido, no en el carrito.

## 7.7 Productos no disponibles

Cuando una variante quede sin stock, archivada, despublicada, eliminada o fuera de su periodo de venta:

- La línea no desaparecerá silenciosamente.
- Se marcará como no disponible o inválida.
- No podrá comprarse ni contribuir al total comprable.
- La persona deberá eliminarla o ajustar su cantidad antes de continuar.

Editar o eliminar posteriormente un producto nunca modificará los datos históricos de pedidos ya creados.

## 7.8 Descuentos en el carrito

- Se permitirá un código de descuento por carrito.
- No se combinarán códigos en la primera versión.
- El código podrá agregarse o retirarse.
- Se validará al aplicarlo, cada vez que cambie el carrito y nuevamente al comenzar el checkout.
- Si el código caduca o deja de cumplir sus condiciones, se excluirá del cálculo y se informará el motivo de forma comprensible.
- Los tipos y límites de descuento disponibles serán parte de la configuración estructural de cada proyecto.

## 7.9 Estados

| Estado | Significado |
| --- | --- |
| `active` | Puede consultarse y modificarse. |
| `converted` | Originó correctamente un pedido durable y ya no puede reutilizarse. |
| `expired` | Superó su vigencia y ya no puede modificarse. |

El carrito pasa de `active` a `converted` únicamente cuando se crea correctamente un pedido durable. Abrir el checkout, completar datos o calcular el despacho no convierte el carrito. Si el pago posterior falla, la recuperación continuará desde el pedido pendiente y no mediante la reactivación del carrito original.

`abandoned` no será un estado comercial. El abandono podrá inferirse posteriormente para analítica sin alterar el ciclo de vida del carrito.

## 7.10 Concurrencia e idempotencia

- Las modificaciones del carrito serán atómicas.
- Cada operación devolverá el carrito completo y actualizado.
- Repetir accidentalmente una misma solicitud no deberá duplicar una adición.
- El servidor impedirá que actualizaciones concurrentes produzcan cantidades o cálculos imposibles.
- Cada carrito tendrá una versión que aumentará después de cada modificación aceptada.
- Cada solicitud de modificación indicará la última versión conocida por el navegador.
- Si la versión recibida coincide con la vigente, el servidor aplicará la operación y devolverá la nueva versión.
- Si el navegador intenta modificar una versión obsoleta, el servidor no aplicará la escritura ni sobrescribirá cambios posteriores.
- Ante un conflicto, el servidor devolverá el carrito vigente para que la interfaz se actualice según la última versión conocida por el sistema.
- Una acción rechazada por conflicto sólo podrá intentarse nuevamente de forma explícita sobre la versión actualizada; no se reproducirá automáticamente si pudiera cambiar la intención de compra.

## 7.11 Invariantes

1. Un carrito pertenece a una sola tienda.
2. Un carrito utiliza una sola moneda, fijada por el proyecto.
3. Una variante aparece como máximo una vez.
4. Toda cantidad válida es un entero positivo dentro de los límites permitidos.
5. Un carrito no reserva ni descuenta stock.
6. Un carrito no congela precios.
7. Un carrito con líneas inválidas no puede avanzar al checkout.
8. Un carrito convertido o expirado no puede modificarse ni reactivarse.
9. El cliente no puede imponer información comercial autoritativa.
10. Una operación repetida con la misma identidad idempotente produce un único efecto.

## 7.12 Decisiones cerradas del carrito

- El límite predeterminado es de **50 unidades por variante**, pero el dueño puede definir otro límite desde la administración del producto o variante.
- El carrito se convierte únicamente después de crear correctamente un pedido durable.
- Las actualizaciones concurrentes utilizan control optimista de versiones y nunca sobrescriben silenciosamente una versión más reciente.
- Los carritos activos expiran tras 30 días sin actividad; los carritos expirados se conservan 90 días y luego se eliminan.

Con estas decisiones, la definición funcional del carrito queda cerrada. Los detalles de implementación deberán conservar este comportamiento.

---

## 8. Checkout

**Estado: Aprobado — estructura funcional general**

## 8.1 Propósito y autoridad

El checkout es un proceso temporal que transforma un carrito válido en un pedido después de una confirmación explícita.

El checkout:

- No es un carrito.
- No es un pedido.
- No acredita una compra.
- No confirma un pago.
- No reserva inventario mientras la persona completa sus datos.
- No puede imponer precios, descuentos, despacho ni totales.

El servidor es la única autoridad para validar el carrito, calcular costos y determinar si la compra puede confirmarse.

## 8.2 Relación con carrito y pedido

- Cada checkout pertenece a un solo carrito activo.
- Sólo puede existir un checkout activo por carrito.
- Si la persona regresa mientras continúa vigente, recuperará el mismo checkout.
- El checkout no puede utilizarse con otro carrito.
- Mientras se completan datos, el carrito continúa activo y puede modificarse.
- Abrir o completar parcialmente el checkout no crea un pedido ni convierte el carrito.
- Si el carrito cambia, el checkout deberá volver a validar sus cálculos y decisiones dependientes.
- El carrito se convierte únicamente cuando el checkout crea correctamente un pedido durable.

## 8.3 Persistencia y expiración

- El checkout será una entidad temporal separada del carrito.
- Esta separación evita conservar nombre, teléfono y dirección dentro de un carrito de larga duración.
- El checkout permitirá recuperar el proceso después de actualizar o cerrar accidentalmente la página.
- Expirará tras **24 horas sin actividad**.
- Un checkout expirado se eliminará junto con sus datos temporales.
- La expiración del checkout no expira ni convierte el carrito.
- Un carrito todavía activo podrá iniciar un checkout nuevo después de la expiración del anterior.

## 8.4 Datos mínimos de contacto

El checkout solicitará:

- Nombre.
- Apellido.
- Correo electrónico.
- Teléfono.

No creará una cuenta de cliente. Al crearse el pedido, los datos confirmados quedarán congelados dentro de ese pedido.

No se solicitarán inicialmente:

- Contraseña.
- Fecha de nacimiento.
- Documento de identidad obligatorio.
- Registro de cuenta.
- Suscripción automática a comunicaciones comerciales.
- Dirección de facturación separada.

Los datos tributarios adicionales sólo se incorporarán cuando un proyecto implemente un flujo de facturación que realmente los requiera.

## 8.5 Entrega o retiro

La persona podrá seleccionar únicamente las modalidades habilitadas para el proyecto:

- Despacho.
- Retiro.

### Despacho

Cuando se seleccione despacho, se solicitará:

- Nombre de quien recibe.
- Región.
- Comuna.
- Calle.
- Número.
- Departamento, casa u oficina, opcional.
- Indicaciones adicionales, opcionales.

El costo y disponibilidad del despacho serán calculados por el servidor.

### Retiro

Cuando se seleccione retiro:

- Se mostrará el punto configurado para el proyecto.
- No se solicitará una dirección de despacho.
- La persona deberá confirmar que comprende las condiciones de retiro.

## 8.6 Selección de pago

El checkout mostrará solamente los métodos habilitados al implementar el proyecto:

- Transferencia bancaria.
- Pasarela de pago.
- Ambas opciones, cuando el proyecto lo contemple.

Seleccionar un método de pago no crea por sí mismo el pedido. La ejecución, confirmación y recuperación se rigen por transferencia bancaria en la sección 10 y por pasarela en la sección 11.

## 8.7 Revisión final

Antes de permitir la confirmación, el servidor volverá a comprobar:

- Que el carrito continúa activo.
- Que corresponde a la última versión conocida.
- Que todas las variantes siguen disponibles.
- Que las cantidades respetan stock y límites de compra.
- Que los precios continúan vigentes.
- Que el descuento sigue siendo válido.
- Que la opción de entrega continúa disponible.
- Que el costo de entrega es correcto.
- Que el método de pago está habilitado.
- Que todos los datos obligatorios son válidos.

Si alguno de estos elementos cambia, no se creará el pedido. El checkout presentará el estado recalculado y exigirá una nueva revisión y confirmación explícita.

## 8.8 Confirmación y atomicidad

La creación del pedido comenzará únicamente cuando la persona confirme explícitamente que desea realizar la compra.

No se creará un pedido al:

- Abrir el checkout.
- Ingresar datos de contacto.
- Ingresar una dirección.
- Calcular el despacho.
- Seleccionar retiro.
- Seleccionar un método de pago.

Después de la confirmación, el servidor deberá ejecutar una única operación lógica:

1. Revalidar el checkout y el carrito.
2. Reservar el inventario.
3. Congelar productos, variantes, cantidades, precios, descuentos y costos aplicables.
4. Crear el pedido.
5. Marcar el carrito como `converted`.
6. Marcar el checkout como `completed`.

Si alguno de estos pasos falla, no deberá quedar un pedido parcial ni una reserva de inventario huérfana.

Esta operación define exclusivamente la creación inicial del pedido y sus reservas. No impide que una resolución tardía autorizada cree posteriormente registros nuevos de reserva para el mismo pedido durable conforme a la sección 9.2; esa excepción no reutiliza el checkout ni crea otro pedido.

La confirmación será idempotente. Repetirla por doble clic, mala conexión o reintento devolverá el mismo resultado y nunca creará dos pedidos.

### 8.8.1 Evidencia técnica posterior a la conversión

La creación del pedido utilizará el identificador del checkout como origen único. El pedido conservará un `sourceCheckoutId` inmutable sujeto a unicidad dentro de la instalación. Volver a confirmar el mismo checkout deberá recuperar el pedido ya creado y no podrá insertar otro.

Para reconocer reintentos y recuperar la respuesta cuando ésta se pierda, el checkout completado se reducirá a un registro técnico mínimo con:

- Identificador del checkout.
- Identificador del pedido creado.
- Estado de conversión o completitud.
- Huella no reversible de la clave de idempotencia, cuando se utilice una clave separada.
- Fecha de confirmación, última repetición reconocida y vencimiento técnico.
- Resultado técnico estrictamente necesario para reconstruir o recuperar la respuesta.

El registro no conservará una segunda copia completa de nombre, correo, teléfono, dirección, líneas, precios ni otros datos personales o comerciales ya congelados en el pedido.

La retención predeterminada de este registro técnico será de **treinta días desde la conversión** y podrá fijarse durante la implementación del proyecto. Después se eliminará de forma controlada. El `sourceCheckoutId` mínimo permanecerá asociado al pedido durante la conservación del propio pedido para sostener la unicidad; no contiene por sí solo datos personales ni autoriza acceso.

Una solicitud recibida después de eliminar el registro temporal nunca recreará el checkout ni generará otro pedido. El servidor recuperará el pedido por su origen único cuando todavía corresponda responder o rechazará el checkout como ya consumido.

## 8.9 Estados

| Estado | Significado |
| --- | --- |
| `active` | Puede completarse, modificarse y validarse. |
| `completed` | Creó correctamente un pedido durable. |
| `expired` | Superó 24 horas sin actividad y ya no puede utilizarse. |

Que un checkout tenga todos sus datos completos será una condición derivada mediante validación, no un estado adicional.

## 8.10 Invariantes

1. Un checkout pertenece a una sola tienda, un solo carrito y una sola moneda.
2. Sólo existe un checkout activo por carrito.
3. Un checkout no reserva stock antes de la confirmación final.
4. Un checkout no crea un pedido antes de la confirmación explícita.
5. Un checkout completado corresponde a un único pedido.
6. Una confirmación repetida no puede producir pedidos duplicados.
7. Un checkout expirado no puede reactivarse.
8. Un cambio relevante exige recalcular y confirmar nuevamente.
9. Los datos enviados por el navegador no son autoridad comercial.
10. El carrito sólo se convierte después de la creación correcta del pedido.

## 8.11 Contratos relacionados cerrados

- La reserva inicial se crea en la confirmación final mediante la operación definida en las secciones 8.8 y 9.2. Las reservas posteriores sólo pueden crearse dentro de la excepción de resolución tardía definida en la sección 9.2.
- La duración ordinaria depende del método: transferencia en la sección 9.6 y pasarela en la sección 9.7.
- Los pagos fallidos, interrumpidos o inciertos se recuperan según las secciones 11.6, 11.8 y 11.9.
- La evidencia técnica posterior a un checkout completado se define en la sección 8.8.1.
- El correo se normaliza, valida y corrige según la sección 19.7; la dirección utiliza los valores controlados y validaciones de la sección 17.4.

Las reglas concretas de formato telefónico que adopte cada proyecto serán validaciones técnicas de entrada, no una decisión comercial abierta. No podrán convertir el navegador en autoridad ni debilitar el snapshot del pedido.

---

## 9. Reserva de inventario

**Estado: Aprobada — definición funcional general**

## 9.1 Propósito y cantidades

La reserva de inventario impide que dos pedidos prometan las mismas unidades durante un proceso de pago pendiente.

Para cada variante se distinguirán:

- **Stock físico:** unidades registradas físicamente.
- **Stock reservado:** unidades apartadas por pedidos pendientes vigentes.
- **Stock disponible:** stock físico menos stock reservado.

El catálogo, el carrito y el checkout utilizarán el stock disponible como referencia comercial.

## 9.2 Contextos autorizados de creación

### Creación inicial del pedido

En el flujo ordinario:

- El carrito y el checkout activo no reservan inventario.
- Las reservas iniciales se crean únicamente después de la confirmación final del checkout.
- Forman parte de la misma operación lógica que crea el pedido.
- Antes de reservar, se vuelven a validar todas las variantes y cantidades.
- La operación es todo-o-nada: si una sola línea no puede reservarse, no se reserva ninguna y no se crea el pedido.
- Un conflicto de disponibilidad mantiene el carrito activo y exige una nueva revisión.

### Excepción de resolución tardía

Los flujos expresamente autorizados en las secciones 10.7 y 11.10 podrán crear un conjunto nuevo de reservas para un pedido durable ya existente cuando al menos una de las reservas necesarias originales haya sido liberada.

Esta excepción:

- No crea un segundo pedido ni vuelve a ejecutar el checkout.
- Asocia las nuevas reservas al pedido original.
- Crea registros nuevos; no reactiva, sobrescribe ni reutiliza reservas `released`.
- Mantiene `released` como estado terminal.
- Libera dentro de la misma resolución cualquier reserva original que todavía permanezca `active`, conforme al flujo tardío aplicable, antes de establecer el conjunto nuevo.
- Comprueba el stock disponible actual.
- Obtiene reservas para todas las líneas o ninguna mediante una operación atómica.
- Forma parte de la misma resolución tardía idempotente.
- No permite cumplimiento parcial si falta una sola unidad.

La creación posterior de reservas no estará disponible como operación administrativa genérica ni podrá utilizarse fuera de una resolución tardía autorizada.

## 9.3 Autoridad y propiedad

Cada reserva:

- Pertenece a un único pedido durable.
- Identifica una variante y una cantidad positiva.
- Registra fecha de creación y vencimiento.
- No puede transferirse a otro pedido.
- No puede reutilizarse para varios pedidos.
- No puede duplicarse por repetir una confirmación.
- Conserva su resultado y motivo para auditoría.

Las reservas nuevas de una resolución tardía conservarán su propia identidad y estarán vinculadas al mismo pedido que las reservas originales, manteniendo la historia de ambos conjuntos sin reemplazar registros.

No existirán reservas vinculadas únicamente a un navegador, carrito o checkout sin un pedido que las justifique.

## 9.4 Estados

| Estado | Significado |
| --- | --- |
| `active` | Las unidades están apartadas para un pedido pendiente. |
| `committed` | El pago fue confirmado y las unidades se descontaron del stock físico. |
| `released` | Las unidades dejaron de estar apartadas y volvieron a estar disponibles. Es terminal. |

La expiración será un motivo de liberación, no un cuarto estado.

Una reserva `active` distinguirá además su régimen temporal:

- **Plazo ordinario:** retención normal correspondiente al método de pago.
- **Retención excepcional de conciliación:** retención acotada aplicada únicamente cuando el plazo ordinario termina y el resultado del proveedor continúa `unknown` después de consultarlo.

La retención excepcional no crea un estado nuevo de reserva. Registrará como mínimo el motivo `payment_reconciliation`, el vencimiento ordinario y un segundo vencimiento explícito de conciliación.

Motivos de liberación previstos:

- Plazo agotado.
- Pago cancelado.
- Pedido cancelado antes del pago.
- Fallo definitivo de la pasarela.
- Liberación administrativa autorizada.

## 9.5 Compromiso de inventario

Cuando se confirma el pago y todas las reservas del conjunto vigente para esa transición continúan `active`:

- Se descuenta la cantidad del stock físico.
- Se reduce en la misma cantidad el stock reservado.
- La disponibilidad no cambia como consecuencia de esa transición, porque las unidades ya estaban fuera de venta.
- Se registra un movimiento de inventario auditable.
- La misma reserva no puede comprometerse dos veces.

Si alguna reserva necesaria del conjunto original ya está `released`, esta regla general no puede utilizar ese conjunto. Tiene precedencia el flujo de resolución tardía de la sección 10.7 para transferencias o de la sección 11.10 para pasarelas. Dentro de esa resolución, los registros nuevos constituyen el conjunto vigente que podrá comprometerse; las reservas originales `released` permanecen sólo como historia y nunca participan de la nueva transición.

## 9.6 Reservas para transferencia bancaria

- La duración predeterminada será de **24 horas** desde la creación del pedido.
- El plazo podrá configurarse durante la implementación de cada proyecto.
- El dueño no modificará el plazo estructural desde el panel cotidiano.
- No se permitirán extensiones manuales en la primera versión.
- Si el pago se confirma antes del vencimiento, la reserva pasa a `committed`.
- Si el plazo termina sin confirmación, el pedido expira y la reserva pasa a `released`.
- Una transferencia tardía no reactiva automáticamente el pedido ni la reserva.
- Los pagos tardíos se resolverán manualmente después de comprobar nuevamente la disponibilidad.

## 9.7 Reservas para pasarela de pago

- La duración predeterminada será de **30 minutos**.
- Cuando la pasarela defina una vigencia propia, la reserva deberá coordinarse con esa sesión.
- Un rechazo recuperable no liberará la reserva mientras el pedido permita otro intento válido dentro del plazo.
- Un rechazo definitivo o la cancelación efectiva de la sesión permitirá liberar la reserva.
- Cerrar la página no libera por sí solo la reserva.
- Antes de liberar por vencimiento, el sistema deberá comprobar o reconciliar el estado del pago con el proveedor.
- Si al vencer el plazo ordinario el resultado continúa `unknown`, la reserva podrá seguir técnicamente `active` sólo bajo retención excepcional de conciliación.
- Esta retención tendrá **dos horas como valor predeterminado**, se fijará por proyecto o proveedor durante la implementación y nunca podrá superar veinticuatro horas.
- Durante esa retención el pedido permanecerá marcado para revisión, no podrá iniciar otro intento de cobro y conservará un `reconciliationExpiresAt` explícito.
- La retención excepcional no podrá extenderse manualmente ni renovarse en cadena en la primera versión.

## 9.8 Concurrencia entre vencimiento y pago

La transición de una reserva será atómica:

- Si la confirmación del pago ocurre primero mientras la reserva continúa `active`, pasa a `committed`.
- Si una liberación válida ocurre primero, la reserva pasa a `released`.
- Una reserva comprometida nunca puede liberarse.
- Una reserva `released` nunca puede volver a `active` ni pasar a `committed`.

Si una confirmación de pago llega después de la liberación, no se descontará inventario de manera automática. Se tratará como una excepción: deberá comprobarse la disponibilidad y resolverse el pago de forma segura.

Cuando se agote la retención excepcional, el sistema realizará una última consulta al proveedor. Si el resultado continúa `unknown`:

1. La reserva pasa atómicamente a `released` con motivo de vencimiento de conciliación.
2. El stock reservado disminuye y las unidades vuelven a estar disponibles.
3. El intento conserva `unknown` y el pedido permanece en revisión; no se representa como rechazo ni como impago confirmado.
4. El pedido deja de estar habilitado para nuevos intentos de pago mientras no se resuelva el resultado incierto.
5. Una aprobación posterior se procesa como confirmación tardía después de liberación, según la sección 11.10.

La aprobación tardía deberá registrar que el proveedor confirmó el cobro. No reactivará la reserva liberada, no volverá a descontar stock y no comprometerá unidades sin comprobar disponibilidad mediante el flujo controlado existente.

## 9.9 Prohibición de sobreventa

La primera versión no permitirá:

- Stock disponible negativo.
- Sobreventa.
- Pedidos habilitados por el ecommerce para iniciar un nuevo cobro, autorizar un nuevo intento o completar el flujo ordinario de pago sin reservas activas para todas sus líneas.
- Reservas parciales de un pedido.
- Preventa.
- Backorders.
- Utilizar la misma reserva para varios pedidos.

Ante dos confirmaciones simultáneas para la última unidad, sólo una podrá crear pedido y reserva. La otra recibirá un conflicto de disponibilidad.

La precondición de reservas activas protege los cobros ordinarios iniciados o controlados por el ecommerce. No impide registrar un hecho financiero externo que ya ocurrió después de liberar las reservas. En ese caso se registra el resultado autoritativo, no se compromete inventario ni se habilita preparación automáticamente y tiene precedencia obligatoria la resolución tardía de las secciones 10.7 u 11.10.

## 9.10 Liberación segura

El proceso que libera reservas vencidas deberá:

- Verificar que la reserva continúa `active`.
- Identificar si corresponde al vencimiento ordinario o al vencimiento excepcional de conciliación.
- Consultar al proveedor antes de liberar una reserva de pasarela.
- Comprobar que no existe un pago confirmado.
- Pasar a retención excepcional sólo cuando el plazo ordinario terminó y el resultado continúa `unknown`.
- Liberar obligatoriamente cuando vence la retención excepcional y la última conciliación continúa sin resultado definitivo.
- Liberar cada reserva una sola vez.
- Registrar fecha y motivo.
- Actualizar la disponibilidad.
- Ser idempotente y seguro aunque se ejecute repetidamente.

## 9.11 Invariantes

1. Toda reserva activa pertenece a un pedido durable.
2. Una reserva corresponde a una sola variante y una cantidad positiva.
3. La suma reservada nunca puede superar el stock físico válido.
4. Un pedido reserva todas sus líneas o ninguna.
5. Una reserva sólo puede terminar como `committed` o `released`.
6. Una transición repetida no produce un segundo efecto.
7. El stock disponible no puede ser negativo.
8. Un pedido sólo puede ser habilitado por el ecommerce para iniciar un nuevo cobro, autorizar un nuevo intento o completar ordinariamente un pago si mantiene reservas activas para todas sus líneas.
9. Un pago tardío no puede consumir automáticamente unidades ya liberadas.
10. Todo compromiso o liberación genera trazabilidad.
11. Una retención por conciliación tiene un segundo vencimiento explícito y no puede renovarse indefinidamente.
12. Al vencer la retención excepcional sin resultado definitivo, las reservas se liberan y el pedido permanece en revisión sin habilitar nuevos cobros.
13. `released` es terminal: nunca puede volver a `active` ni pasar a `committed`.
14. La creación inicial de reservas pertenece al checkout; la creación posterior sólo está permitida como excepción explícita dentro de una resolución tardía autorizada.
15. Una resolución tardía nunca crea un segundo pedido para sustituir al original.
16. Las nuevas reservas de una resolución tardía son registros nuevos asociados al pedido original y se obtienen para todas sus líneas o ninguna.
17. Registrar un pago externo ya ocurrido no exige reservas activas, pero nunca compromete inventario ni habilita preparación por sí solo.
18. No existe una operación administrativa genérica para recrear reservas.

## 9.12 Contratos relacionados y decisión restante

- Los ajustes físicos que podrían afectar unidades reservadas se rigen por la sección 15.5.
- Los pagos tardíos se resuelven según las secciones 10.7 y 11.10.
- La conciliación común se define en la sección 11.9; cada adaptador concreta únicamente el protocolo técnico exigido por su proveedor.
- La devolución de unidades después de cancelaciones o reembolsos se rige por las secciones 13.5 y 15.7.

Continúa abierta únicamente la **política transversal de conservación de los registros comerciales** de pedidos, pagos y reservas. Falta fijar su duración legal y operacional por jurisdicción y tipo de proyecto. Los cinco años de la sección 20.9 se aplican a eventos de auditoría y no autorizan a eliminar automáticamente estos registros comerciales.

Esta decisión de conservación no altera las transiciones, la prohibición de sobreventa ni el comportamiento operativo definido.

---

## 10. Transferencia bancaria

**Estado: Aprobada — flujo simple con confirmación administrativa**

## 10.1 Principio de simplicidad

La primera versión resolverá el flujo común de una transferencia completa por el monto exacto. No se incorporará complejidad para automatizar excepciones que todavía no forman parte de la operación habitual.

Las diferencias de monto u otras discrepancias se resolverán directamente entre la persona administradora y la persona compradora. El ecommerce sólo bloqueará los efectos ordinarios mientras la transferencia no haya sido confirmada como válida; no modelará ni automatizará la solución económica acordada fuera del sistema.

La transferencia bancaria será un método configurado al implementar cada proyecto. Los datos bancarios no serán editables desde el panel cotidiano.

## 10.2 Creación del pedido

Cuando la persona confirma un checkout con transferencia:

1. Se crea el pedido.
2. Se reserva todo el inventario durante el plazo configurado, con 24 horas como valor predeterminado.
3. El pedido queda pendiente de pago.
4. Se genera un número público de pedido.
5. Se muestran las instrucciones bancarias.
6. Se envían las mismas instrucciones al correo informado.

Las instrucciones incluirán:

- Titular de la cuenta.
- Banco.
- Tipo de cuenta.
- Número de cuenta.
- Datos identificatorios necesarios.
- Correo asociado, cuando corresponda.
- Monto exacto.
- Número de pedido como referencia.
- Fecha y hora exactas del vencimiento.

El pedido conservará una copia de las instrucciones entregadas. Un cambio posterior de la configuración bancaria no modificará pedidos anteriores.

## 10.3 Evidencia de pago

La primera versión no permitirá cargar comprobantes de transferencia.

Una captura o archivo:

- No demuestra que el dinero llegó a la cuenta.
- Puede falsificarse.
- Añade almacenamiento y validación de archivos.
- Puede contener información sensible innecesaria.

La confirmación se basará en la comprobación directa del abono por parte del dueño o de una persona autorizada. Como apoyo, podrá registrarse una referencia bancaria y una nota administrativa opcionales.

## 10.4 Confirmación administrativa

Sólo el dueño o una persona con permiso explícito para confirmar pagos podrá realizar esta acción.

Sin discrepancias, la confirmación ordinaria directa sólo procede cuando la transferencia corresponde al pedido, puede identificarse suficientemente y coincide con el monto y los demás datos esperados. Si existió una discrepancia, la excepción específica de la sección 10.5 tiene precedencia: la transferencia sólo podrá entrar posteriormente en el flujo ordinario o tardío cuando una persona autorizada haya revisado la situación y determine expresamente que puede considerarse válida. El sistema no reevalúa ni reconstruye el acuerdo económico previo.

Antes de confirmar, la administración mostrará:

- Pedido.
- Comprador.
- Monto esperado.
- Fecha de vencimiento.
- Productos reservados.
- Advertencia de que la acción comprometerá inventario.

La confirmación deberá:

1. Comprobar que el pedido continúa pendiente de pago.
2. Comprobar que todas sus reservas siguen activas.
3. Registrar quién confirmó, cuándo y qué referencia indicó.
4. Pasar el registro de transferencia a `confirmed`.
5. Comprometer todas las reservas.
6. Actualizar el resumen financiero a `paymentStatus = paid`.
7. Mantener `orderStatus = open`.

La operación será atómica e idempotente. Repetirla no volverá a descontar inventario.

Para una transferencia previamente discrepante, la confirmación manual constituye la autoridad humana de la excepción. El sistema no necesita conocer ni reconstruir cómo se resolvió la diferencia económica; sólo conservará que una persona autorizada revisó la situación y confirmó la transferencia como válida.

La auditoría de esa confirmación conservará el actor, el pedido, la transferencia, la acción, el timestamp y el contexto administrativo estrictamente necesario conforme a la sección 20. No registrará secretos ni información bancaria innecesaria.

Una vez confirmada esta operación, la preparación podrá continuar únicamente si cumple además todas sus precondiciones normales. `paid` pertenece a la dimensión financiera y nunca constituye un estado del pedido.

La confirmación no podrá deshacerse mediante un interruptor. Un error posterior utilizará el flujo formal de cancelación o devolución.

## 10.5 Monto esperado

La primera versión solicitará una única transferencia por el monto exacto del pedido.

No soportará como flujo normal:

- Pagos parciales.
- Varias transferencias para un pedido.
- Sobrepagos.
- Compensaciones entre pedidos.
- Saldos a favor.

Cuando el monto recibido sea inferior, superior o presente cualquier otra discrepancia que impida considerarlo inmediatamente válido, la transferencia se tratará como una **excepción administrativa**. Esta clasificación no agrega un estado nuevo a la máquina de pagos.

Mientras exista la discrepancia:

- La transferencia no se confirma automáticamente como pago válido.
- El pedido no cambia automáticamente a `paymentStatus = paid`.
- No se compromete inventario por causa de esa transferencia.
- No se habilita preparación.
- El sistema no considera resuelta la diferencia.

La persona administradora detectará o revisará la discrepancia, contactará directamente a la persona compradora, resolverá la situación fuera del dominio automatizado y decidirá cuándo la transferencia puede considerarse válida. El sistema se limita a reportar o conservar la discrepancia necesaria para bloquear la confirmación ordinaria y a esperar esa decisión humana.

Quedan fuera del dominio automatizado solicitar un monto faltante, devolver un excedente, acordar una nueva transferencia, coordinar una devolución bancaria o cualquier otra forma concreta de resolver la diferencia. El ecommerce no registra ni reconstruye esa solución económica y no incorpora pagos parciales, múltiples transferencias, saldos a favor, créditos internos, *wallets*, compensaciones automáticas, devoluciones parciales, conciliación matemática de diferencias ni cuentas corrientes de clientes.

Sólo después de que una persona autorizada la confirme expresamente como válida, la transferencia podrá producir los efectos del flujo ordinario o, si ya venció, ingresar al flujo tardío de la sección 10.7. Esa confirmación registra la decisión administrativa; no convierte la resolución económica externa en una funcionalidad del ecommerce.

## 10.6 Vencimiento

Al cumplirse el plazo sin una confirmación válida:

- El registro de transferencia y el resumen financiero pasan a `expired`.
- El pedido pasa a `orderStatus = expired`.
- Las reservas se liberan.
- El pedido deja de aceptar una confirmación ordinaria.
- La vista pública informa que ya no puede pagarse normalmente.
- Se genera una notificación transaccional de expiración.

La confirmación y la expiración competirán de forma atómica. Sólo una transición podrá completarse.

## 10.7 Transferencia tardía

Una transferencia recibida después del vencimiento no reactivará la reserva antigua.

La mera existencia o recepción del dinero no permite que una transferencia tardía ingrese al flujo de resolución tardía. Primero deberá ser revisada y confirmada como válida por una persona administradora autorizada. Si tuvo un faltante, excedente u otra discrepancia, su resolución concreta ocurrirá directamente con la persona compradora y permanecerá fuera del dominio automatizado.

Sólo cuando esa revisión administrativa confirme que la transferencia puede considerarse válida, el registro de transferencia pasa a `confirmed` y el resumen financiero se actualiza a `paymentStatus = paid`, aunque el inventario todavía no esté comprometido. Si el pedido ya estaba `expired`, permanecerá `expired` y marcado para revisión tardía hasta completar todas las precondiciones de resolución; este estado no habilita preparación.

La resolución administrativa controlada deberá:

1. Comprobar nuevamente la disponibilidad de todas las unidades.
2. Obtener, cuando corresponda, un nuevo uso de la promoción según la sección 16.8.
3. Crear nuevas reservas para todas las líneas o ninguna.
4. Comprometer inmediatamente las nuevas reservas y el nuevo uso promocional requerido.
5. Ejecutar de forma explícita la transición excepcional `expired → open`.
6. Registrar que se aceptó una transferencia tardía, quién la resolvió y cuándo.

Los pasos que adquieren y comprometen inventario y uso promocional, reabren el pedido y registran la auditoría obligatoria deberán ser idempotentes y ejecutarse atómicamente cuando resulte técnicamente posible o ser recuperables de manera determinista. La resolución interna no se considerará completada sin su auditoría durable y se rechazará antes de aplicar efectos cuando esa evidencia obligatoria no pueda persistirse. Esto no permite negar el hecho bancario ya ocurrido, que se conservará o recuperará conforme a la sección 20.11. La transición `expired → open` sólo será válida dentro de esta resolución tardía y después de satisfacer todas sus precondiciones; no constituye una reactivación administrativa genérica.

Si falta una sola unidad o no puede adquirirse un nuevo uso promocional exigido, el pedido no se reabrirá ni podrá prepararse. Se iniciará la devolución completa del dinero conforme a la sección 13, sin sustituir productos, cambiar cantidades, editar líneas, crear cumplimiento parcial, aplicar crédito interno ni alterar el snapshot económico. Una venta distinta deberá realizarse mediante otro pedido independiente y queda fuera de este flujo.

## 10.8 Estados del pago por transferencia

| Estado | Significado |
| --- | --- |
| `pending` | Espera comprobación bancaria dentro del plazo. |
| `confirmed` | El abono fue verificado administrativamente. |
| `expired` | El plazo terminó sin confirmación válida. |

Los montos incorrectos se tratarán como excepciones administrativas y no como nuevos estados permanentes en la primera versión.

## 10.9 Invariantes

1. El comprador no puede confirmar su propio pago.
2. Un comprobante o declaración no confirma una transferencia.
3. Una confirmación ordinaria requiere reservas activas para todas las líneas.
4. La confirmación repetida produce un solo efecto.
5. Las instrucciones bancarias quedan congeladas en el pedido.
6. Una transferencia tardía exige una comprobación nueva y atómica de stock.
7. Una reserva liberada no se reutiliza.
8. Un monto incorrecto no se confirma silenciosamente.
9. Toda confirmación, expiración y resolución tardía queda auditada.
10. No existen pagos parciales como flujo normal de la primera versión.
11. Un pedido `expired` sólo vuelve a `open` dentro de una resolución tardía autorizada, idempotente y con todas sus precondiciones satisfechas.
12. Confirmar dinero recibido no implica que el inventario esté comprometido ni habilita preparación por sí solo.
13. Una transferencia con diferencia de monto u otra discrepancia no constituye por sí sola un pago válido del pedido.
14. Las discrepancias son excepciones administrativas que la persona administradora resuelve directamente con la persona compradora.
15. El ecommerce no modela ni automatiza la resolución económica de un faltante, excedente u otra discrepancia.
16. Sólo una transferencia confirmada como válida por una persona autorizada puede producir efectos financieros sobre el pedido.
17. Mientras no exista una confirmación administrativa válida, la transferencia no habilita preparación.
18. La resolución humana de una discrepancia no introduce pagos parciales, múltiples transferencias, saldos, créditos ni *wallets* como funcionalidades del sistema.
19. Una transferencia tardía sólo entra al flujo tardío después de su revisión y confirmación administrativa válida.

---

## 11. Pasarela de pago

**Estado: Aprobada — contrato independiente y pago alojado**

## 11.1 Alcance inicial

Cada ecommerce podrá integrar una pasarela seleccionada durante su implementación. El cliente no podrá cambiarla ni añadir otra desde el panel administrativo.

La primera versión utilizará un checkout alojado o una tokenización segura proporcionada por el proveedor:

- El sistema no solicitará directamente números completos de tarjeta ni códigos de seguridad.
- No almacenará datos de tarjeta.
- Las credenciales permanecerán únicamente en el servidor.
- La persona continuará el pago en el entorno seguro entregado por el proveedor.

No se construirá inicialmente un formulario propio para capturar tarjetas.

## 11.2 Creación del pago

En el flujo ordinario, después de confirmar el checkout:

1. Se crea el pedido pendiente.
2. Se reserva el inventario.
3. Se crea un intento de pago interno.
4. El servidor solicita una sesión a la pasarela.
5. La persona continúa en la URL segura recibida.
6. La pasarela notifica el resultado al servidor.

El navegador no construirá ni elegirá montos, monedas, identificadores comerciales ni direcciones arbitrarias de pago.

## 11.3 Autoridad del resultado

Volver a una página de éxito o fracaso no confirma el pago.

La confirmación sólo podrá provenir de:

- Un webhook auténtico y verificado.
- Una consulta directa del servidor a la pasarela.

Antes de aceptar un pago, se comprobarán:

- Proveedor esperado.
- Firma o autenticidad del evento.
- Cuenta comercial correspondiente.
- Pedido relacionado.
- Monto exacto.
- Moneda.
- Identificador de transacción.
- Ausencia de un pago aprobado previamente para el mismo pedido.

## 11.4 Intentos de pago

Un pedido puede conservar varios intentos históricos, pero sólo uno puede quedar aprobado.

Cada intento registrará:

- Pedido.
- Proveedor.
- Identificador interno.
- Identificador del proveedor.
- Monto y moneda.
- Estado.
- Fecha de creación y expiración.
- Eventos recibidos.
- Resultado final conocido.

Sólo podrá existir un intento activo a la vez por pedido.

## 11.5 Estados del intento

| Estado | Significado |
| --- | --- |
| `pending` | La pasarela todavía puede resolver el intento. |
| `approved` | El proveedor confirmó el pago. |
| `rejected` | El proveedor rechazó definitivamente el intento. |
| `cancelled` | La sesión fue cancelada. |
| `expired` | La sesión perdió vigencia. |
| `unknown` | No existe información suficiente para decidir. |

Un timeout, error de red o respuesta incompleta producirá `unknown`; nunca se interpretará automáticamente como rechazo.

## 11.6 Reintentos

Si un intento queda `rejected`, `cancelled` o `expired` y la reserva continúa activa:

- La persona podrá iniciar un intento nuevo.
- Se creará un registro independiente.
- El intento anterior permanecerá histórico.
- El monto, moneda y pedido no cambiarán.
- Nunca habrá dos sesiones activas simultáneamente.

Cerrar la página no crea un intento nuevo ni libera automáticamente el inventario.

## 11.7 Webhooks y procesamiento de aprobaciones

Los eventos del proveedor podrán llegar repetidos, desordenados, con retraso o antes de que la persona regrese al ecommerce.

El procesamiento deberá:

- Verificar autenticidad según el proveedor.
- Identificar de forma única cada evento.
- Ser idempotente.
- Impedir que un evento antiguo haga retroceder un resultado financiero final. La transición excepcional del pedido `expired → open` no es una reversión directa causada por el evento: sólo puede ejecutarla la resolución tardía de la sección 11.10 después de satisfacer sus precondiciones.
- Conservar la información necesaria para auditoría.
- Responder al proveedor sin depender de que la persona mantenga abierta la página.
- Persistir de manera atómica los efectos comerciales locales y su auditoría cuando compartan una misma capacidad transaccional, o conservar una recepción durable que permita completar ambos de forma determinista.

Un webhook verificado informa un hecho externo que puede haber ocurrido antes de que el ecommerce lo reciba. Una falla local no puede convertir falsamente una aprobación, rechazo o devolución del proveedor en un hecho inexistente. Su recepción y procesamiento seguirán la distinción de la sección 20.11.

Ante una aprobación válida, primero se comprobará el estado de **todas** las reservas necesarias. Esta comprobación ocurre después de validar proveedor, identidad, monto y moneda, y antes de aplicar efectos sobre pedido o inventario. Su propósito es decidir entre el flujo ordinario y la resolución tardía; la ausencia de reservas activas no permite negar ni omitir el hecho financiero externo ya confirmado.

### 11.7.1 Caso A — todas las reservas necesarias continúan `active`

Se aplica el flujo normal:

1. Se comprueba que no exista otro pago aprobado.
2. El intento pasa a `approved`.
3. Todas las reservas pasan atómicamente a `committed`.
4. El resumen financiero se actualiza a `paymentStatus = paid`.
5. El pedido permanece `orderStatus = open`.
6. Se genera la confirmación transaccional.

### 11.7.2 Caso B — alguna reserva necesaria ya está `released`

La regla específica de confirmación tardía tiene precedencia sobre el flujo normal. Esta aprobación es un hecho financiero externo ya ocurrido, no un nuevo cobro ordinario autorizado por el ecommerce:

1. Se registra el intento como `approved` y el dinero confirmado por el proveedor.
2. Ninguna reserva `released` vuelve a `active` ni pasa a `committed`.
3. No se descuenta inventario mediante una reserva liberada ni se recrea implícitamente la reserva anterior.
4. No se compromete parcialmente el conjunto de reservas originales.
5. El pedido pasa obligatoriamente al flujo de confirmación tardía de la sección 11.10.
6. Sólo después de comprobar disponibilidad actual podrán crearse nuevas reservas para todas las líneas o ninguna.
7. Si no existe stock suficiente, se aplica la resolución definida en la sección 11.10.

Esta precedencia depende exclusivamente del estado de las reservas, no del canal que permitió descubrir la aprobación. Se aplica de la misma forma ante webhook, consulta directa, *polling*, conciliación o revisión manual del proveedor.

## 11.8 Resultados inciertos

Si la conexión se interrumpe o la pasarela no responde después de solicitar una sesión:

- No se asumirá éxito ni fracaso.
- No se creará inmediatamente otro intento.
- El intento quedará `unknown`.
- El resumen de pago del pedido pasará a `unknown`.
- El servidor consultará al proveedor utilizando referencias e idempotencia.
- Mientras no exista certeza y continúe el plazo ordinario, no se cobrará nuevamente ni se liberará inventario precipitadamente.
- Si vence el plazo ordinario, se aplicará exclusivamente la retención excepcional y acotada de conciliación definida en las secciones 9.4 y 9.7.

## 11.9 Expiración y conciliación

Al acercarse el vencimiento de la reserva:

1. Se consulta el estado del intento activo.
2. Si está aprobado, se aplica la precedencia definida en la sección 11.7: flujo normal cuando todas las reservas siguen `active` y confirmación tardía cuando alguna está `released`.
3. Si está definitivamente rechazado, cancelado o expirado, se libera la reserva.
4. Si continúa `unknown` al vencer el plazo ordinario, el pedido pasa a revisión y la reserva entra en retención excepcional de conciliación con un segundo vencimiento explícito.
5. Antes del segundo vencimiento se vuelve a consultar al proveedor.
6. Si continúa `unknown`, se libera la reserva, el inventario vuelve a estar disponible y tanto el intento como el resumen de pago del pedido conservan `unknown` para conciliación posterior.

Un caso incierto no se convertirá automáticamente en impago. Liberar el inventario al agotarse el plazo extraordinario tampoco afirma que el proveedor no cobró. Una persona autorizada podrá verificar el resultado en el panel del proveedor y ejecutar una resolución administrativa auditada.

La retención extraordinaria no podrá renovarse indefinidamente. Después de liberar, el pedido no admitirá otro intento de cobro mientras continúe sin resolverse el intento anterior.

## 11.10 Confirmación tardía

Este flujo se aplica a toda aprobación descubierta después de que alguna reserva necesaria haya sido liberada, sin importar si se conoció mediante webhook, consulta directa, *polling*, conciliación o revisión manual del proveedor. Tiene precedencia sobre cualquier regla general de aprobación.

Ante esa aprobación:

- Se registra el intento como `approved`, el identificador del proveedor y el dinero efectivamente recibido.
- El resumen financiero se actualiza a `paymentStatus = paid`, porque refleja el hecho financiero confirmado.
- No se descuenta inventario automáticamente.
- El pedido pasa a revisión. Si ya estaba `expired`, permanece `expired` durante esta revisión; si estaba `open`, permanece `open`. Si ya estaba `cancelled`, conserva `cancelled` y no es elegible para reapertura.
- La preparación permanece bloqueada hasta que la resolución controlada consiga comprometer inventario suficiente para todas las líneas.
- Se comprueba nuevamente la disponibilidad.
- Si existe stock para todas las líneas y se satisfacen las demás precondiciones, podrá comprometerse mediante una resolución controlada.
- Si el uso promocional original fue liberado, también deberá adquirirse un nuevo uso conforme a la sección 16.8; el uso liberado no se reutilizará.
- Si no existe inventario completo o no puede adquirirse el nuevo uso promocional requerido, corresponderá la devolución completa del dinero.

Si el pedido ya estaba `cancelled`, no se intentará adquirir inventario ni uso promocional para cumplirlo: se liberará cualquier reserva `active` remanente y se iniciará directamente la devolución completa. El pago externo se registrará sin reactivar ni mutar el pedido cancelado.

La resolución controlada creará y comprometerá un conjunto nuevo de reservas para todas las líneas o ninguna. Cualquier reserva original que todavía permanezca `active` se liberará dentro de la misma operación atómica antes de sustituir el conjunto; no se comprometerá parcialmente mediante el flujo normal. Nunca se reutilizará una reserva `released` ni se aplicará un decremento ciego de inventario.

Cuando el pedido esté `expired`, la transición excepcional `expired → open` se ejecutará sólo después de obtener y comprometer el inventario completo y, cuando corresponda, el nuevo uso promocional. La adquisición y compromiso de esas autoridades, la reapertura y su auditoría formarán una operación idempotente, atómica cuando resulte técnicamente posible o recuperable de manera determinista. La obligación de auditoría y la distinción entre el hecho externo y la resolución local seguirán la sección 20.11. El canal por el que se descubrió el pago no altera esta regla.

Si falla cualquiera de las precondiciones, el pedido `expired` no se reabrirá; un pedido que todavía estaba `open` pasará a `cancelled` mediante el flujo autorizado. En ambos casos se iniciará un reembolso completo, la preparación seguirá bloqueada y el pedido original conservará productos, cantidades y snapshot económico sin sustituciones, reducciones de líneas, cumplimiento parcial, créditos internos ni compensaciones abiertas. Cualquier venta distinta deberá originar un pedido independiente fuera de este flujo.

## 11.11 Contrato con proveedores

La lógica de pedidos e inventario no dependerá directamente de una pasarela concreta. Cada integración implementará un contrato equivalente a:

```ts
interface PaymentGateway {
  createAttempt(input): Promise<GatewaySession>;
  getAttemptStatus(reference): Promise<GatewayStatus>;
  verifyWebhook(request): Promise<GatewayEvent>;
  expireAttempt(reference): Promise<void>;
}
```

Este contrato permite reemplazar o añadir técnicamente una integración sin convertir la pasarela en una opción modificable desde el panel.

## 11.12 Invariantes

1. Un proyecto utiliza una pasarela configurada durante su implementación.
2. El navegador nunca confirma pagos.
3. El retorno visual desde el proveedor no es autoridad.
4. Un pedido puede tener como máximo un pago aprobado.
5. Sólo existe un intento activo por pedido.
6. Un resultado incierto permanece incierto hasta su conciliación.
7. Un evento repetido produce un solo efecto.
8. Monto y moneda deben coincidir exactamente con el pedido.
9. Una aprobación tardía no consume automáticamente inventario liberado.
10. El sistema no almacena datos completos de tarjeta.
11. Un resultado `unknown` no puede retener inventario más allá del vencimiento extraordinario de conciliación.
12. Un hecho confirmado por el proveedor no se representa como inexistente por una falla local de auditoría o procesamiento.
13. Una reserva `released` nunca vuelve a `active` ni pasa a `committed`.
14. Toda aprobación descubierta después de liberar alguna reserva se rige por confirmación tardía, independientemente del canal de descubrimiento.
15. La confirmación tardía tiene precedencia sobre el compromiso normal de reservas.
16. `paymentStatus = paid` registra el hecho financiero y no implica por sí solo compromiso de inventario ni autorización de preparación.
17. Un pedido `expired` sólo vuelve a `open` dentro de una resolución tardía autorizada que haya asegurado todas sus precondiciones.
18. Una resolución tardía que no pueda satisfacer íntegramente inventario y uso promocional requerido termina en devolución completa, sin mutar las líneas ni el snapshot económico.
19. Las reservas activas son precondición para iniciar o completar un cobro ordinario controlado por el ecommerce, no para registrar un hecho financiero externo ya ocurrido.
20. Registrar una aprobación externa sin reservas activas deriva obligatoriamente a resolución tardía y no compromete inventario ni habilita preparación automáticamente.

---

## 12. Pedidos

**Estado: Aprobado — estructura inicial con estados separados**

## 12.1 Propósito

El pedido es el registro durable de una intención de compra confirmada. Nace después de la confirmación final del checkout y conserva la información comercial exacta de ese momento.

El pedido coordina pagos, reservas y preparación, pero no reemplaza la autoridad específica de esos módulos.

## 12.2 Separación de estados y autoridades

El sistema mantendrá autoridades independientes. Ninguna se inferirá exclusivamente desde otra salvo cuando una transición del dominio lo establezca de forma expresa:

| Dimensión | Pregunta que responde |
| --- | --- |
| Estado del pedido | ¿La operación sigue vigente o terminó? |
| Estado del pago | ¿El dinero está pendiente, confirmado, incierto, expirado o devuelto? |
| Reservas e inventario | ¿Las unidades están apartadas, fueron descontadas o siguen disponibles? |
| Estado de preparación | ¿Los productos están pendientes, preparándose, enviados o entregados? |
| Uso promocional | ¿El cupo está reservado, consumido o liberado? |

Esta separación evita crear estados combinados difíciles de mantener. El estado resumido de pago sólo será actualizado por el módulo de pagos; no será un campo editable directamente desde el panel. En particular, `paymentStatus = paid` no demuestra que exista una salida de inventario, que el pedido esté abierto, que la preparación pueda comenzar ni que un uso promocional haya sido comprometido.

## 12.3 Información congelada

Al crearse, el pedido conservará:

- Identificador interno.
- Identificador inmutable del checkout de origen, sujeto a unicidad.
- Número público de pedido.
- Fecha y hora.
- Moneda.
- Nombre, correo y teléfono de contacto.
- Dirección de despacho o punto de retiro.
- Método y costo de entrega.
- Método de pago seleccionado.
- Producto y variante de cada línea.
- SKU registrado al comprar.
- Opciones de variante.
- Cantidad.
- Precio unitario.
- Descuento asignado.
- Subtotal, descuento total, entrega y total final.
- Instrucciones bancarias entregadas, cuando corresponda.
- Referencias a reservas e intentos de pago.

Modificar, archivar o eliminar posteriormente un producto no alterará los datos históricos del pedido.

## 12.4 Estado del pedido

| Estado | Significado |
| --- | --- |
| `open` | La operación continúa vigente. |
| `completed` | Fue entregado o retirado. |
| `cancelled` | Fue cancelado correctamente. |
| `expired` | El plazo ordinario terminó sin completar el pedido. Sólo la resolución tardía excepcional definida en las secciones 10.7 y 11.10 puede reabrirlo. |

Las situaciones que requieren revisión se representarán mediante una alerta o marca con motivo, no mediante combinaciones ilimitadas de estados. Un pedido con `paymentStatus = unknown` permanece `open` y marcado para conciliación; no pasa a `expired` mientras el resultado financiero continúe incierto.

Cuando un pago tardío válido se confirma para un pedido ya `expired`, el pedido permanece `expired` y marcado para revisión mientras se resuelven inventario y, si corresponde, capacidad promocional. No podrá prepararse en ese estado. Sólo después de asegurar y comprometer íntegramente esas precondiciones podrá ejecutarse la transición excepcional, explícita, idempotente y auditable `expired → open`. Si alguna precondición falla, no se reabre y corresponde devolución completa.

La regla es independiente del canal de descubrimiento: webhook, conciliación, consulta directa o *polling* del proveedor, revisión manual autorizada o validación administrativa de una transferencia siguen las mismas precondiciones de resolución tardía.

## 12.5 Estado resumido del pago

| Estado | Significado |
| --- | --- |
| `pending` | Espera una transferencia o el resultado ordinario de una pasarela sin incertidumbre conocida. |
| `unknown` | El sistema no puede determinar todavía el resultado financiero definitivo y requiere conciliación con el proveedor. |
| `paid` | El pago fue confirmado. |
| `cancelled` | El pedido terminó antes de recibir un pago. |
| `expired` | El plazo terminó sin un pago válido. |
| `refund_pending` | Existe una devolución en proceso. |
| `refunded` | El dinero fue devuelto completamente. |

No se incluirán devoluciones parciales en la primera versión.

`paid` es exclusivamente un valor de `paymentStatus`; no pertenece a `orderStatus`. Cuando esta especificación utilice en prosa la expresión «pedido pagado», significará únicamente «pedido cuyo `paymentStatus = paid`» y nunca un estado técnico adicional del pedido.

Los registros de transferencia e intentos de pasarela conservan el detalle autoritativo. El pedido expone este estado como resumen coherente para operación y consulta.

`unknown`:

- No significa pago aprobado.
- No significa pago rechazado.
- No equivale a `expired` ni autoriza declarar impago definitivo.
- No autoriza preparación, despacho, entrega ni retiro.
- No autoriza iniciar automáticamente un segundo cobro.
- Puede resolverse posteriormente hacia `paid`, `cancelled` o `expired`, según el hecho confirmado. Sólo volverá a `pending` después de resolver definitivamente el intento incierto y crear explícitamente un nuevo intento válido conforme a la sección 11.6. Si después corresponde un reembolso, se utilizarán los estados de reembolso ya definidos.
- Debe permanecer coherente con el intento de pago incierto que lo origina.

El resumen pasa de `pending` a `unknown` cuando el intento autoritativo entra en incertidumbre. Sólo un resultado autenticado del proveedor o una conciliación válida podrá sacarlo de `unknown`; el resumen no se editará directamente desde el panel.

## 12.6 Estado de preparación

| Estado | Significado |
| --- | --- |
| `unfulfilled` | Todavía no comienza la preparación. |
| `preparing` | El pedido está siendo preparado. |
| `ready_for_pickup` | Está disponible para retiro. |
| `shipped` | Fue entregado al transporte. |
| `delivered` | Llegó a destino. |
| `picked_up` | Fue retirado. |
| `cancelled` | No será preparado. |

## 12.7 Reglas de transición

- Un pedido pendiente de pago no puede comenzar a prepararse.
- Un pedido con pago `unknown` no puede iniciar preparación ni ejecutar nuevas transiciones de cumplimiento.
- Un pago `unknown` sólo puede avanzar mediante conciliación; no habilita automáticamente otro intento de cobro.
- Confirmar el pago habilita la preparación sólo cuando el inventario del pedido quedó comprometido mediante el flujo normal o la resolución controlada de una confirmación tardía.
- Una aprobación tardía con inventario todavía sin resolver mantiene bloqueada la preparación aunque el resumen financiero sea `paid`.
- Un pedido configurado para retiro no puede pasar a `shipped`.
- Un pedido configurado para despacho no puede pasar a `ready_for_pickup` ni `picked_up`.
- `delivered` y `picked_up` permiten completar el pedido.
- Un pedido `expired` no puede prepararse. La resolución tardía sólo habilita el flujo normal después de completar expresamente `expired → open` con inventario íntegramente comprometido.
- Un pedido cancelado no puede retomar la preparación.
- Una transición repetida no produce efectos adicionales.
- Toda transición registra actor, fecha, estado anterior, estado nuevo y motivo cuando corresponda.

## 12.8 Administración

Según sus permisos, la administración podrá:

- Consultar pedidos y sus detalles.
- Filtrar por pago, preparación, entrega y fechas.
- Iniciar preparación de pedidos con `paymentStatus = paid` cuyo inventario completo ya esté comprometido, cuyo `orderStatus = open` y cuya transición sea válida.
- Marcar un pedido listo para retiro.
- Registrar despacho y, opcionalmente, referencia de seguimiento.
- Marcar entrega o retiro.
- Agregar notas internas.
- Ejecutar acciones de cancelación o devolución sólo cuando su permiso y el estado lo permitan.

Los pedidos no podrán eliminarse desde el panel. Las correcciones se realizarán mediante acciones registradas, no reescribiendo silenciosamente el historial.

## 12.9 Acceso de la persona compradora

Como no existirán cuentas inicialmente, se entregará un enlace seguro asociado exclusivamente al pedido.

La persona podrá:

- Consultar su estado.
- Revisar productos, cantidades y total.
- Consultar instrucciones de pago vigentes.
- Consultar información de despacho o retiro.
- Reintentar un pago cuando el pedido y la reserva lo permitan.

Inicialmente no podrá:

- Editar productos o cantidades.
- Cambiar la dirección después de confirmar.
- Cambiar libremente el método de pago.
- Cancelar el pedido directamente.
- Acceder a otros pedidos mediante números consecutivos.

El número público del pedido es sólo una referencia legible y **no autoriza acceso**. Conocerlo, enumerarlo o combinarlo con un correo no permitirá consultar el pedido.

El enlace utilizará una credencial que cumplirá este contrato mínimo:

- Será opaca, aleatoria y tendrá al menos 128 bits de entropía efectiva.
- Estará vinculada a un único pedido y no servirá para consultar ningún otro.
- Será revocable y reemplazable.
- Emitir una credencial nueva invalidará inmediatamente la anterior.
- Su vigencia predeterminada se extenderá mientras el pedido permanezca abierto y hasta noventa días después de que alcance `completed`, `cancelled` o `expired`. Si posteriormente ocurre un reembolso dentro de una gestión válida, el vencimiento podrá fijarse a noventa días desde esa última transición financiera comunicada.
- Una credencial vencida o revocada no podrá recuperar acceso ni reactivar el pedido.
- Si después del vencimiento se requiere acceso por una gestión válida, se emitirá una credencial nueva mediante un procedimiento controlado; no se reactivará la anterior.

El servidor almacenará únicamente un hash resistente u otra representación de verificación equivalente. La credencial reutilizable completa sólo existirá durante su emisión y entrega; no se conservará en texto plano cuando ya no sea necesario.

La credencial completa:

- No aparecerá en logs, auditoría ni analítica.
- Será ocultada de errores, trazas y referencias técnicas.
- No será visible para personas administradoras. Una necesidad técnica se resolverá mediante revocación y reemisión, no revelando la credencial vigente.

El acceso tendrá limitación de intentos y respuestas que no permitan distinguir credenciales inexistentes, vencidas o revocadas de forma útil para fuerza bruta. Estas protecciones no crean una cuenta ni un inicio de sesión para compradores.

Cuando se corrija el correo de la persona compradora y se reemita el acceso, el sistema deberá revocar todas las credenciales públicas anteriores aplicables antes de activar la nueva. Las credenciales revocadas dejarán de autorizar acceso inmediatamente. La acción administrativa, su actor y la reemisión quedarán auditados sin registrar ningún secreto completo.

### 12.9.1 Transporte y canje seguro

El mecanismo utilizado para transportar y canjear una credencial pública minimizará el tiempo durante el cual el secreto reutilizable permanece expuesto e impedirá que se persista o propague innecesariamente durante la navegación web.

La credencial reutilizable completa no deberá terminar innecesariamente en:

- Historial persistente del navegador.
- Encabezados `Referer`.
- Logs de aplicación, servidor o proxy.
- Herramientas de observabilidad o analítica.
- Solicitudes a recursos, dominios o servicios de terceros.
- Mensajes de error o páginas de diagnóstico.
- Trazas.
- Auditoría.

Si el acceso inicial transporta un secreto mediante una URL, deberá canjearlo o retirarlo de la ubicación navegable antes de cargar recursos de terceros o continuar la navegación. El secreto reutilizable no deberá permanecer en URLs posteriores ni copiarse a enlaces internos.

La implementación podrá utilizar canje, tokenización, una sesión temporal, una redirección limpia u otro mecanismo equivalente. Esta especificación exige el resultado de seguridad, pero no impone anticipadamente una arquitectura concreta.

Este mecanismo no creará cuentas de compradores, OAuth, login tradicional ni un sistema de identidad de clientes.

## 12.10 Auditoría e integridad

- Un pedido nunca se actualiza a partir del catálogo vigente.
- Los cambios comerciales importantes se registran como eventos.
- Las transiciones deberán ser válidas para el estado actual.
- Las operaciones administrativas serán idempotentes cuando puedan repetirse por error.
- Los datos sensibles no se expondrán mediante el número público.
- Los intentos de pago, reservas y movimientos de inventario conservarán referencias al pedido.

## 12.11 Invariantes

1. Un pedido pertenece a una sola tienda y utiliza una sola moneda.
2. Un checkout completado crea como máximo un pedido.
3. Los datos comprados permanecen congelados.
4. El pago sólo cambia mediante el dominio de pagos.
5. La preparación sólo comienza con pedido `open`, pago confirmado y compromiso completo del inventario.
6. Las modalidades de despacho y retiro tienen transiciones incompatibles entre sí.
7. Un pedido terminal no se reactiva silenciosamente; `expired → open` sólo existe dentro de la resolución tardía autorizada.
8. Un número público no concede autorización.
9. Los pedidos no se eliminan desde administración.
10. Toda transición relevante queda auditada.
11. Cada checkout de origen puede estar asociado como máximo a un pedido.
12. Una credencial revocada, vencida o reemplazada no concede acceso.
13. Emitir una credencial nueva invalida la anterior.
14. La representación reutilizable completa de la credencial no se almacena innecesariamente ni aparece en logs, auditoría o analítica.
15. `paymentStatus = unknown` expresa incertidumbre financiera y no equivale a pago, rechazo ni expiración.
16. Un pedido con `paymentStatus = unknown` no puede prepararse ni iniciar automáticamente otro cobro.
17. El resumen de pago `unknown` permanece coherente con el intento incierto y sólo cambia por un resultado autoritativo o una conciliación válida.
18. El transporte y canje de una credencial pública impide que el secreto reutilizable se persista o propague innecesariamente mediante URLs, historial, `Referer`, logs, observabilidad, analítica, terceros, errores, trazas o auditoría.
19. Una aprobación tardía no habilita preparación mientras el inventario completo del pedido no haya sido comprometido mediante la resolución controlada.
20. Pago, pedido, reservas e inventario, preparación y uso promocional son autoridades independientes.
21. `paymentStatus = paid` no implica que el inventario haya sido comprometido.
22. Un pedido `expired` sólo vuelve a `open` mediante una resolución tardía expresamente autorizada, idempotente y auditada.
23. `paid` nunca es un valor de `orderStatus`; identifica exclusivamente el resumen financiero del pedido.

## 12.12 Contratos relacionados y decisión restante

- Las cancelaciones, devoluciones de dinero y efectos de inventario se rigen por la sección 13.
- Los cambios excepcionales de dirección o destinatario se rigen por la sección 17.10.
- Las integraciones automáticas con transportistas permanecen expresamente fuera del alcance inicial según la sección 17.14; no constituyen una decisión pendiente de esta versión.

Continúa abierta únicamente la **política transversal de conservación histórica y tratamiento posterior de datos personales en registros comerciales**. Falta fijar plazos y reglas de eliminación o anonimización según las obligaciones aplicables a cada proyecto. Esta decisión no autoriza eliminar pedidos desde el panel ni afecta su snapshot mientras deban conservarse.

La estructura inicial deberá conservar la separación entre pago, pedido, reservas e inventario, preparación y uso promocional.

---

## 13. Cancelaciones, reembolsos y devoluciones

**Estado: Aprobado — operaciones completas**

## 13.1 Conceptos separados

- **Cancelación:** detiene un pedido antes de entregarlo.
- **Reembolso:** devuelve el dinero recibido.
- **Devolución:** registra el regreso físico de productos después de su entrega o retiro.
- **Expiración:** termina el plazo ordinario de un pedido que no tenía un pago confirmado en ese momento; una resolución tardía posterior se rige exclusivamente por las secciones 10.7 y 11.10.

Estas operaciones no serán estados intercambiables ni acciones equivalentes.

## 13.2 Alcance inicial

La primera versión permitirá:

- Cancelar pedidos completos.
- Liberar reservas de pedidos no pagados.
- Reintegrar antes del despacho únicamente unidades cuya salida de stock físico esté autoritativamente registrada para ese pedido.
- Procesar o registrar reembolsos completos.
- Registrar devoluciones completas de manera administrativa.

No permitirá inicialmente:

- Cancelar líneas individuales.
- Devolver sólo algunos productos.
- Reembolsar parcialmente.
- Cambiar productos.
- Generar crédito interno.
- Solicitar devoluciones automáticamente desde la vista del comprador.
- Automatizar etiquetas o retiros de devolución.
- Gestionar contracargos.

## 13.3 Cancelación antes del pago

Cuando el pedido sigue pendiente y existe certeza de que no fue pagado:

1. Se comprueba que no existe un pago confirmado ni un resultado `unknown` todavía sujeto a conciliación.
2. Se liberan todas sus reservas activas.
3. El pedido pasa a `cancelled`.
4. El estado resumido del pago pasa a `cancelled`.
5. La preparación pasa a `cancelled`.
6. Se registra el motivo, actor y momento.

No existe reembolso porque nunca se recibió dinero. La expiración automática seguirá siendo un flujo distinto de la cancelación administrativa.

Un pedido con `paymentStatus = unknown` no podrá cancelarse como impago. Primero deberá resolverse la incertidumbre conforme a la sección 11.9; esta restricción evita liberar usos promocionales o cerrar el pedido sobre una premisa financiera no confirmada.

## 13.4 Cancelación después del pago

Un pedido pagado sólo podrá cancelarse si todavía no fue despachado, entregado ni retirado.

La operación deberá:

1. Detener la preparación.
2. Pasar el pedido a `cancelled`.
3. Pasar la preparación a `cancelled`.
4. Liberar las reservas que todavía estén `active` sin incrementar stock físico y, sólo si existen salidas autoritativas de inventario para el pedido, compensar exactamente esas salidas mediante movimientos de reintegro.
5. Pasar el pago a `refund_pending`.
6. Iniciar o registrar el reembolso completo.
7. Pasar el pago a `refunded` después de una confirmación válida.

La cancelación y el despacho competirán de forma atómica. Si el despacho se registró primero, ya no podrá utilizarse el flujo de cancelación previa al despacho.

## 13.5 Efecto sobre inventario

Los efectos se decidirán exclusivamente desde la autoridad de reservas y movimientos de inventario, nunca desde `paymentStatus`.

### Reserva `active`

Si una unidad continúa sólo reservada:

- La reserva pasa a `released`.
- Disminuye el stock reservado.
- No cambia el stock físico, porque la unidad nunca fue descontada.
- Aumenta el stock disponible.

### Reserva `committed` o salida autoritativa registrada

Si existe evidencia autoritativa de una salida de stock físico para ese pedido:

- Se reintegran exclusivamente las unidades asociadas a esa salida concreta.
- Se registra un movimiento compensatorio vinculado al movimiento original y al pedido.
- La compensación es idempotente y sólo puede aplicarse una vez por salida.
- No se modifica el stock reservado ya reducido por el compromiso.

### Pago confirmado sin inventario comprometido

Si el dinero está confirmado pero no existe una salida autoritativa de inventario:

- Puede continuar la cancelación o devolución financiera completa que corresponda.
- Se liberan las reservas `active` que todavía existan.
- No se incrementa el stock físico.
- No se crean unidades inexistentes.

Cada unidad podrá volver al inventario una sola vez y sólo como compensación de una salida previa concreta. Un producto dañado o no vendible se corregirá mediante un ajuste de inventario separado.

## 13.6 Reembolso por transferencia

El sistema no puede ejecutar automáticamente una devolución bancaria.

El flujo será:

1. El pedido queda `cancelled` cuando se utiliza una cancelación ordinaria. Si se devuelve un pago tardío de un pedido que permaneció `expired` por no satisfacer sus precondiciones, el pedido conserva `expired` y la dimensión financiera avanza de forma independiente.
2. El pago pasa a `refund_pending`.
3. Una persona autorizada realiza la devolución desde el banco.
4. Registra fecha, monto, referencia y nota.
5. El pago pasa a `refunded`.

La confirmación manual del reembolso exige un permiso específico y queda auditada.

## 13.7 Reembolso mediante pasarela

Cuando el proveedor lo permita:

1. Se crea un registro de reembolso.
2. El servidor solicita la devolución completa.
3. Se valida la respuesta del proveedor.
4. El webhook o una consulta directa confirma el resultado.
5. El estado resumido del pago se actualiza a `refunded` sólo después de una confirmación válida.

Estados del reembolso:

| Estado | Significado |
| --- | --- |
| `pending` | La devolución fue solicitada. |
| `succeeded` | El proveedor confirmó la devolución. |
| `failed` | El proveedor la rechazó definitivamente. |
| `unknown` | No existe certeza sobre el resultado. |

Un timeout o resultado incierto no se considerará fracaso y no provocará un segundo reembolso automático.

Cuando el reembolso resuelva un pago tardío que no pudo satisfacer inventario completo o capacidad promocional, el pedido original no se reabrirá ni cambiará productos, cantidades o snapshot económico. Si estaba `expired`, permanecerá `expired`; si todavía estaba `open`, la cancelación autorizada lo llevará a `cancelled`.

## 13.8 Después del despacho o entrega

Un pedido `shipped`, `delivered` o `picked_up` ya no puede cancelarse como si nunca hubiera salido.

Cuando el negocio acepte el regreso físico:

- Se registra una devolución administrativa completa.
- El stock vuelve únicamente después de recibir y revisar físicamente los productos.
- Una persona autorizada determina si los productos están en condiciones de volver a venderse.
- Las unidades no aptas se registran mediante un ajuste de inventario.
- El reembolso se procesa según la política configurada para el negocio.

El pedido puede permanecer `completed` porque la entrega efectivamente ocurrió. El estado `refunded` expresa de forma independiente qué ocurrió con el dinero.

## 13.9 Permisos

Se distinguirán las capacidades para:

- Cancelar pedidos no pagados.
- Cancelar pedidos pagados.
- Ejecutar reembolsos.
- Confirmar reembolsos manuales.
- Registrar devoluciones.
- Ajustar inventario no vendible.

El dueño podrá recibir todas las capacidades, pero no se otorgarán automáticamente a cualquier persona que prepare pedidos.

## 13.10 Auditoría

Cada acción registrará:

- Pedido.
- Actor.
- Fecha.
- Motivo.
- Estado anterior y nuevo.
- Unidades liberadas o reintegradas.
- Monto reembolsado.
- Proveedor y referencia, cuando corresponda.
- Resultado conocido.

Motivos iniciales:

- Solicitud del comprador.
- Pedido duplicado.
- Problema de inventario.
- Problema de pago.
- Decisión del negocio.
- Otro, con nota obligatoria.

## 13.11 Invariantes

1. Un pedido se cancela una sola vez.
2. Una unidad vuelve al inventario una sola vez.
3. Un reembolso exitoso no puede repetirse.
4. Cancelar no borra el pago original.
5. Todo reembolso crea un registro financiero nuevo y auditable; no implica por sí mismo un movimiento de inventario.
6. Un pedido despachado no puede cancelarse mediante el flujo previo al despacho.
7. Un resultado incierto permanece incierto hasta conciliarse.
8. Toda acción sensible exige permiso y queda auditada.
9. La primera versión opera sobre el pedido completo.
10. Una devolución física no reintegra stock antes de revisar los productos.
11. `paymentStatus = paid` no implica que el inventario haya sido comprometido.
12. Ninguna unidad se reintegra al stock físico sin evidencia autoritativa de que fue descontada previamente para ese pedido.
13. Toda devolución de stock compensa una salida previa concreta y no se infiere únicamente desde el estado financiero.
14. Liberar una reserva `active` nunca incrementa stock físico.
15. Una salida autoritativa se compensa como máximo una vez.
16. Un pago tardío sin inventario comprometido puede resolverse financieramente, pero nunca crea stock.
17. Un pedido con `paymentStatus = unknown` no se cancela mediante el flujo previo al pago hasta resolver la incertidumbre financiera.

---

## 14. Catálogo, productos y variantes

**Estado: Aprobado**

### 14.1 Propósito y separación de responsabilidades

El catálogo representa los productos físicos que el negocio puede publicar y vender. Se separan dos conceptos:

- El **producto** organiza la información comercial y editorial: nombre, descripción, imágenes, colecciones, URL y estado de publicación.
- La **variante** representa la unidad vendible: combinación de opciones, SKU, precio, inventario, disponibilidad y límite de compra.

Toda línea de carrito y de pedido referencia una variante. El producto por sí solo nunca constituye una unidad vendible.

Todo producto tendrá al menos una variante interna. Cuando el producto no presente elecciones comerciales, esa variante será predeterminada y no necesitará mostrarse como una opción en la experiencia pública. No existirán modelos transaccionales distintos para productos simples y productos con opciones.

### 14.2 Información del producto

Cada producto deberá conservar como mínimo:

- Identificador interno inmutable.
- Nombre.
- Descripción.
- `slug` único dentro de la tienda.
- Galería ordenada e imagen principal.
- Colecciones asociadas.
- Estado de publicación.
- Posición manual dentro de cada colección cuando corresponda.
- Fechas de creación y modificación.

El nombre y la descripción pertenecen al producto. La información que afecte exactamente qué unidad se compra pertenece a la variante.

### 14.3 Información de la variante

Cada variante deberá conservar como mínimo:

- Identificador interno inmutable.
- Valores de opción que forman su combinación.
- SKU opcional.
- Precio vigente.
- Stock físico, stock reservado y stock disponible calculado.
- Límite máximo de compra.
- Estado activo o inactivo.
- Imagen asociada opcional.
- Fechas de creación y modificación.

El límite de compra predeterminado será de **50 unidades por variante**. El dueño podrá modificarlo desde el panel para cada producto o variante, pero ninguna compra podrá superar el stock disponible.

### 14.4 Opciones y combinaciones

El dueño podrá definir nombres de opción adecuados al negocio, como talla, color, material, formato o capacidad.

La primera versión permitirá:

- Hasta tres tipos de opción por producto.
- Hasta cien variantes activas por producto.
- Valores únicos dentro de cada tipo de opción.
- Una sola variante para cada combinación exacta.

No se permitirán en esta versión campos de personalización libre respondidos por la persona compradora, configuradores visuales, fórmulas de precio ni generación automática de productos a medida. Esas capacidades deberán incorporarse como módulos específicos cuando un proyecto real las necesite.

### 14.5 Precio

El precio pertenece exclusivamente a la variante.

- Si todas las variantes cuestan lo mismo, cada una conserva ese mismo valor.
- Si existen precios diferentes, el catálogo podrá calcular y mostrar un rango o un valor mínimo.
- El precio deberá ser mayor que cero para que la variante participe en un producto publicado.
- El servidor es la autoridad del precio vigente.
- El carrito no congela el precio.
- El pedido conserva una copia histórica del precio confirmado.

No se mantendrá simultáneamente un precio autoritativo en el producto y otro en la variante.

### 14.6 Imágenes

Cada producto tendrá una galería ordenada:

- Se exige al menos una imagen para publicar.
- Se permitirán hasta doce imágenes por producto en la primera versión.
- Una imagen se designará como principal.
- El dueño podrá subir, ordenar, reemplazar y eliminar imágenes desde el panel.
- Una variante podrá referenciar opcionalmente una imagen de la galería.
- Si la variante no tiene imagen asociada, se utilizará la imagen principal del producto.

El sistema será responsable de validar y optimizar los archivos para los formatos y tamaños definidos por la implementación. El dueño no administrará decisiones técnicas de almacenamiento, transformación o entrega de imágenes.

### 14.7 Colecciones

Se utilizará un único concepto de organización denominado **colección**.

- Un producto podrá pertenecer a varias colecciones.
- Las colecciones serán planas y no tendrán subcolecciones.
- El dueño podrá crearlas, ordenarlas, activarlas y archivarlas.
- Un producto podrá publicarse sin pertenecer a una colección.
- La posición de un producto podrá definirse manualmente dentro de cada colección.

No habrá inicialmente colecciones automáticas basadas en reglas, jerarquías de categorías, etiquetas libres con comportamiento comercial ni navegación configurable desde el panel.

### 14.8 Identificadores, `slug` y SKU

- Los identificadores internos de producto y variante son inmutables.
- El `slug` del producto será único dentro de la tienda y podrá editarse.
- El SKU será opcional, pero deberá ser único dentro de la tienda cuando esté definido.
- Ni el `slug` ni el SKU constituirán la identidad técnica del producto o de la variante.
- Cambiar un nombre, un `slug` o una URL no modificará pedidos históricos.

Las redirecciones públicas necesarias después de modificar un `slug` pertenecen a la implementación del sitio y no cambian la identidad del producto.

### 14.9 Estados y disponibilidad

Los productos tendrán tres estados:

- `draft`: editable y no visible públicamente.
- `active`: publicado en el catálogo.
- `archived`: retirado de nuevas ventas, pero conservado para la historia comercial.

Las variantes podrán estar activas o inactivas.

`active`, `available` y `sold_out` representan conceptos distintos:

- `active` indica que el producto o la variante está habilitado para publicación.
- `available` indica que una variante activa tiene stock disponible y puede comprarse.
- `sold_out` es una condición calculada cuando una variante activa no tiene stock disponible.

Un producto activo podrá permanecer visible aunque todas sus variantes estén agotadas. Archivar un producto retirará todas sus variantes de nuevas compras. Restaurar un producto archivado lo devolverá a `draft` y exigirá una nueva validación antes de publicarlo.

### 14.10 Requisitos para publicar

Un producto sólo podrá pasar a `active` cuando tenga:

- Nombre válido.
- `slug` único.
- Al menos una imagen.
- Al menos una variante activa.
- Precio mayor que cero en cada variante activa.
- Límite de compra válido en cada variante activa.
- Combinaciones de opciones válidas y no duplicadas.

No será obligatorio tener stock para publicar. Si posteriormente se desactiva la última variante activa, el producto dejará de ser comprable hasta que se habilite una variante válida, aunque su información podrá conservarse para administración.

### 14.11 Consulta pública, orden y filtros

El catálogo público sólo entregará productos activos, variantes activas, colecciones activas e información necesaria para presentar y comprar.

La primera versión incluirá:

- Orden manual de productos dentro de cada colección.
- Paginación desde el servidor.
- Búsqueda básica por nombre.
- Filtro por colección.
- Filtros derivados de las opciones de variantes, como talla o color.
- Filtro opcional por disponibilidad.

No se incorporarán inicialmente un motor externo de búsqueda, reglas automáticas de posicionamiento, etiquetas arbitrarias con lógica pública ni un constructor de navegación. Las necesidades especiales de descubrimiento se definirán por proyecto.

### 14.12 Edición e historia

El dueño podrá modificar desde el panel:

- Nombre, descripción e imágenes.
- Colecciones y orden.
- Precio.
- Stock físico, sujeto a las reglas del módulo de inventario.
- Límite de compra.
- Publicación y disponibilidad administrativa.

Los cambios se reflejarán en el catálogo y en la siguiente validación del carrito, pero nunca reescribirán pedidos ya creados.

No se permitirá eliminar permanentemente productos o variantes desde el panel. Se archivarán o desactivarán.

Una variante que ya haya participado en un pedido no podrá reutilizarse para representar una combinación comercial distinta. Por ejemplo, una variante `Roja / M` no podrá transformarse en `Azul / L`: deberá crearse una variante nueva y desactivarse la anterior. El pedido conservará además su copia histórica independiente.

### 14.13 Auditoría

Se registrarán como mínimo:

- Creación y archivado de productos.
- Publicación y retiro de publicación.
- Creación, activación y desactivación de variantes.
- Cambios de precio.
- Cambios de SKU.
- Cambios de límites de compra.
- Ajustes de inventario mediante el mecanismo que defina su módulo.

Cada evento deberá identificar actor, momento, entidad afectada, valor anterior, valor nuevo y motivo cuando la operación lo exija.

### 14.14 Invariantes

1. Toda unidad vendible es una variante.
2. Todo producto tiene al menos una variante interna.
3. Cada combinación de opciones es única dentro de su producto.
4. Un SKU definido es único dentro de la tienda.
5. El precio autoritativo pertenece a la variante y se valida en servidor.
6. El stock pertenece a la variante y el stock disponible es calculado.
7. Un producto publicado satisface todas las condiciones de publicación.
8. Un producto o una variante archivada no participa en nuevas compras.
9. Una edición de catálogo no modifica pedidos históricos.
10. Una variante con historia comercial no cambia de identidad semántica.
11. El panel archiva o desactiva; no elimina permanentemente productos ni variantes.
12. La ausencia de stock no impide publicar, pero sí impide comprar.

---

## 15. Inventario

**Estado: Aprobado**

### 15.1 Propósito y alcance

El módulo de inventario mantiene una representación coherente y auditable de las unidades físicas, reservadas y disponibles de cada variante. Su objetivo es impedir la sobreventa, proteger los pedidos vigentes y explicar todo cambio de existencias.

La primera versión tendrá un único inventario por instalación:

- Una tienda.
- Un solo conjunto de existencias.
- Stock administrado exclusivamente por variante.
- Sin bodegas, sucursales ni ubicaciones separadas.

No se incorporarán inicialmente transferencias entre ubicaciones, lotes, números de serie, fechas de vencimiento, inventario por proveedor, preventa ni backorders.

### 15.2 Cantidades y autoridades

Para cada variante se mantendrán:

- **Stock físico:** unidades registradas físicamente.
- **Stock reservado:** unidades apartadas por pedidos pendientes con reservas activas.
- **Stock disponible:** stock físico menos stock reservado.

El stock físico cambia mediante movimientos de inventario. El stock reservado cambia exclusivamente mediante las transiciones del módulo de reservas. El stock disponible es calculado y no constituye un campo editable.

Las unidades vendidas no permanecerán como una cuarta cantidad en la variante. Su historia se conservará en pedidos, reservas comprometidas y movimientos.

### 15.3 Relación con las reservas

- Crear una reserva aumenta el stock reservado y reduce el disponible, pero no modifica el físico.
- Liberar una reserva reduce el reservado y aumenta el disponible, pero no modifica el físico.
- Comprometer una reserva después de confirmar el pago reduce simultáneamente el físico y el reservado en la misma cantidad.
- El disponible no cambia al comprometer, porque las unidades ya estaban fuera de venta.
- Una reserva comprometida o liberada no puede volver a producir efectos.

El estado financiero `paid` no es evidencia de compromiso de inventario. La autoridad para demostrar una salida física será la reserva `committed` junto con el movimiento de inventario correspondiente.

El dueño no podrá modificar directamente el stock reservado desde el panel.

### 15.4 Movimientos de inventario

Todo cambio del stock físico deberá producir un movimiento inmutable. Cada movimiento registrará como mínimo:

- Identificador único.
- Variante.
- Cantidad anterior.
- Diferencia aplicada.
- Cantidad resultante.
- Tipo y motivo.
- Actor o proceso responsable.
- Fecha.
- Pedido, reserva o devolución relacionada cuando corresponda.
- Nota administrativa cuando sea obligatoria.
- Clave de idempotencia o referencia única del evento de origen cuando corresponda.

Los movimientos no se editarán ni eliminarán. Un error se resolverá mediante un movimiento compensatorio que referencie la operación incorrecta.

### 15.5 Operaciones administrativas

El dueño dispondrá de dos acciones sencillas:

1. **Recibir unidades:** suma una cantidad positiva por reposición.
2. **Corregir conteo físico:** declara cuántas unidades existen realmente y el sistema calcula la diferencia.

Toda corrección de conteo exigirá un motivo:

- Conteo físico.
- Daño.
- Pérdida.
- Error de registro.
- Devolución aceptada.
- Otro, con nota obligatoria.

El resultado de una operación administrativa nunca podrá ser negativo ni quedar por debajo del stock reservado. Si una variante tiene cinco unidades reservadas, no podrá corregirse su stock físico a tres sin resolver antes los pedidos afectados.

El panel podrá presentar una cantidad editable como parte de la operación, pero el servidor no realizará una escritura directa: validará la solicitud y generará el movimiento correspondiente.

### 15.6 Movimientos automáticos

El sistema generará movimientos cuando ocurra un hecho comercial que cambie unidades físicas:

- **Compromiso de reserva después del pago:** disminución por venta únicamente al pasar una reserva válida a `committed`.
- **Cancelación antes del despacho:** reintegro exclusivo de las unidades con una salida autoritativa previa para ese pedido; las reservas `active` sólo se liberan.
- **Devolución recibida, inspeccionada y aprobada:** reintegro de las unidades aceptadas.
- **Movimiento compensatorio:** corrección explícita de un efecto anterior sin borrar su historia.

Crear o liberar una reserva no genera un movimiento físico, aunque conserva trazabilidad dentro del registro de reservas.

Cada movimiento automático estará vinculado al evento comercial que lo originó y sólo podrá aplicarse una vez.

### 15.7 Devoluciones y unidades no vendibles

Una devolución posterior a la entrega no aumentará el stock automáticamente. Primero deberá confirmarse que:

1. Los productos fueron recibidos.
2. Fueron inspeccionados.
3. Pueden volver a venderse.

Si toda la devolución está en condiciones, se reintegrarán todas sus unidades mediante un movimiento vinculado al pedido.

Si existen unidades dañadas o no vendibles, no se reintegrará automáticamente la devolución completa. Las unidades aptas podrán incorporarse mediante una operación administrativa relacionada con la devolución. El reembolso completo y el reintegro físico siguen siendo hechos separados.

### 15.8 Indicadores de disponibilidad

Cada variante podrá definir un umbral administrativo de stock bajo. Se calcularán:

- `available`: stock disponible mayor que el umbral.
- `low_stock`: stock disponible mayor que cero e igual o inferior al umbral.
- `out_of_stock`: stock disponible igual a cero.

Estas condiciones son calculadas y no editables. No publican ni archivan productos automáticamente. El umbral podrá establecerse en cero para desactivar la condición de stock bajo.

El panel podrá mostrar estos indicadores. Las alertas automáticas se rigen por el módulo de notificaciones definido en la sección 19.

### 15.9 Concurrencia e idempotencia

Toda operación que cambie inventario deberá ser atómica:

- Una reserva sólo se crea si todas las variantes del pedido continúan disponibles.
- El movimiento y la actualización del stock físico forman una misma operación lógica.
- Cada evento comercial tendrá una referencia única que impida aplicar su efecto dos veces.
- Dos ajustes administrativos no podrán sobrescribirse silenciosamente.
- Una corrección basada en una cantidad desactualizada será rechazada y devolverá el valor vigente para revisión.
- Un reintento técnico no duplicará una recepción, venta, cancelación, devolución o compensación.

Las operaciones sobre pedidos de varias líneas conservarán las reglas atómicas definidas para reservas, pagos y cancelaciones.

### 15.10 Permisos

Se distinguirán dos capacidades administrativas:

- **Consultar inventario:** ver cantidades, reservas e historial.
- **Gestionar inventario:** recibir unidades y corregir conteos.

Sólo usuarios administrativos autorizados podrán gestionar inventario. La persona compradora nunca tendrá acceso a estas operaciones.

No habrá inicialmente aprobaciones por una segunda persona, permisos por producto o colección, límites cuantitativos por operador ni edición de movimientos históricos. El módulo del panel definirá los roles concretos sin debilitar esta separación.

### 15.11 Consulta e historial

El panel mostrará por variante:

- Producto y combinación.
- SKU cuando exista.
- Stock físico.
- Stock reservado.
- Stock disponible.
- Umbral configurado.
- Condición de disponibilidad calculada.

El historial será paginado y podrá filtrarse por producto o variante, tipo de movimiento, pedido relacionado, actor y rango de fechas. Cada registro mostrará el valor anterior, la diferencia y el valor resultante.

El stock físico actual deberá poder explicarse mediante el stock inicial registrado y la suma de sus movimientos posteriores.

### 15.12 Productos archivados y pedidos vigentes

Archivar un producto o desactivar una variante:

- Impide nuevas compras.
- No elimina ni reinicia su inventario.
- No modifica pedidos existentes.
- No libera reservas activas.
- No impide completar el pago de un pedido ya confirmado y correctamente reservado.
- No impide registrar una cancelación, devolución o reintegro posterior.

Si el dueño necesita impedir que un pedido pendiente continúe, deberá cancelarlo explícitamente. Archivar el producto no funcionará como una cancelación indirecta.

### 15.13 Exclusiones iniciales

La primera versión no incluirá:

- Múltiples bodegas o ubicaciones.
- Transferencias internas.
- Importación o exportación masiva de ajustes.
- Sincronización con inventarios externos.
- Ajustes mediante archivos.
- Lotes, series o vencimientos.
- Reservas administrativas sin pedido.
- Stock negativo, preventa o backorders.
- Aprobaciones de ajustes por varias personas.

El panel operará variante por variante. Si la operación real supera este modelo, el módulo se ampliará de forma explícita.

### 15.14 Invariantes

1. El inventario pertenece siempre a una variante.
2. Existe un único inventario por instalación en la primera versión.
3. El stock físico nunca puede ser negativo.
4. El stock reservado nunca puede ser negativo.
5. El stock disponible es siempre stock físico menos stock reservado.
6. El stock disponible nunca puede ser negativo.
7. El stock físico nunca puede quedar por debajo del reservado.
8. El stock reservado sólo cambia mediante reservas transaccionales.
9. Todo cambio de stock físico genera un movimiento inmutable.
10. Un evento comercial produce como máximo un movimiento por efecto esperado.
11. Confirmar un pago reduce simultáneamente stock físico y reservado sólo al comprometer reservas válidas dentro del flujo normal o de la resolución controlada de una confirmación tardía.
12. Liberar una reserva no modifica el stock físico.
13. Una devolución no reintegra unidades antes de su recepción e inspección.
14. Un movimiento incorrecto se compensa; nunca se borra ni reescribe.
15. Archivar productos o variantes no altera pedidos ni reservas existentes.
16. Toda operación administrativa identifica actor, motivo y momento.
17. Las correcciones concurrentes nunca se resuelven mediante sobrescritura silenciosa.
18. El inventario actual debe ser coherente con sus movimientos y reservas vigentes.
19. `paymentStatus = paid` no constituye evidencia suficiente de una salida de inventario.
20. Ningún reintegro aumenta stock físico sin referenciar una salida autoritativa previa del mismo pedido.
21. Cada reintegro compensa exactamente una vez las unidades de una salida concreta.
22. Liberar una reserva `active` sólo reduce stock reservado; nunca incrementa stock físico.

---

## 16. Descuentos

**Estado: Aprobado**

### 16.1 Propósito y autoridad

El módulo de descuentos permite crear promociones administrables sin convertir la primera versión en un motor general de campañas.

El servidor será la única autoridad para resolver el código, comprobar sus condiciones, determinar las líneas elegibles, calcular el descuento y reservar o consumir un uso. El navegador nunca podrá establecer el valor descontado ni enviar un total como fuente de verdad.

### 16.2 Aplicación mediante código

La primera versión tendrá exclusivamente descuentos que la persona compradora aplica ingresando un código:

- Se permitirá un código por carrito y pedido.
- El código podrá agregarse, reemplazarse o retirarse mientras el carrito continúe activo.
- No se combinarán códigos.
- No habrá descuentos automáticos.
- Aplicar un código al carrito no reserva ni consume un uso.

El servidor volverá a validar el código cada vez que cambie el carrito, al comenzar el checkout y antes de crear el pedido.

### 16.3 Tipos permitidos

Se permitirán dos tipos:

- **Porcentaje:** reduce un porcentaje del subtotal elegible.
- **Monto fijo:** reduce una cantidad definida en la moneda configurada para la tienda.

No se incluirán inicialmente promociones de compra X y recibe Y, regalos automáticos, combos, paquetes, precios escalonados, descuentos por cantidad, crédito interno, descuentos personalizados por cliente ni envío gratuito.

El envío gratuito o los descuentos aplicados al despacho sólo podrán definirse después de cerrar el módulo de despacho y retiro.

### 16.4 Alcance y elegibilidad

El dueño podrá aplicar un descuento a:

- Todos los productos.
- Productos seleccionados.
- Colecciones seleccionadas.

No habrá reglas del tipo «todo excepto». Se definirá directamente qué productos son elegibles.

Cuando el alcance utilice colecciones, la pertenencia será dinámica: un producto añadido posteriormente a una colección seleccionada será elegible mientras el descuento continúe vigente. Quitar el producto de la colección dejará de hacerlo elegible para carritos y checkouts que todavía no hayan creado un pedido.

El descuento sólo afectará las líneas elegibles y nunca el costo de despacho.

### 16.5 Valor y condiciones comerciales

El dueño podrá configurar:

- Código.
- Tipo y valor.
- Alcance.
- Subtotal elegible mínimo opcional.
- Fecha de inicio opcional.
- Fecha de término opcional.
- Límite global de usos opcional.
- Habilitación o deshabilitación administrativa.

Se aplicarán estas reglas:

- El porcentaje será un número entero entre 1 % y 99 %.
- El monto fijo será positivo.
- El descuento nunca superará el subtotal elegible.
- El total final nunca será negativo.
- No se crearán pedidos con total final igual a cero.
- El subtotal mínimo se calculará sobre productos elegibles, antes del descuento y sin incluir despacho.

Los descuentos del 100 % y los pedidos gratuitos quedan excluidos porque requieren un flujo de confirmación sin pago.

### 16.6 Identidad y normalización del código

Cada descuento tendrá un identificador interno inmutable y un código comercial único dentro de la tienda.

El código:

- No distinguirá mayúsculas de minúsculas.
- Eliminará espacios al inicio y al final.
- Admitirá letras, números y guiones.
- Tendrá entre cuatro y treinta y dos caracteres.
- Se normalizará internamente en mayúsculas.

Por tanto, `verano-20`, `VERANO-20` y ` Verano-20 ` identificarán el mismo código.

### 16.7 Vigencia y ciclo de vida

La vigencia dependerá de la habilitación administrativa, las fechas y el límite de usos. El sistema podrá representar condiciones calculadas como:

- `scheduled`: todavía no alcanza su fecha inicial.
- `valid`: puede utilizarse en un nuevo pedido.
- `disabled`: fue deshabilitado administrativamente.
- `expired`: alcanzó su fecha final.
- `exhausted`: no tiene usos disponibles.
- `archived`: fue retirado de la operación cotidiana y se conserva como historia.

La fecha inicial será inclusiva y la fecha final exclusiva. Las fechas se interpretarán en la zona horaria estructural de la tienda y se almacenarán de manera inequívoca.

Antes de participar en un pedido, el dueño podrá modificar todos los datos del descuento. Después de que haya reservado o consumido al menos un uso:

- No podrá cambiarse el código.
- No podrá cambiarse el tipo, valor, alcance, subtotal mínimo, fechas ni límite global.
- Podrá deshabilitarse o archivarse para impedir usos nuevos.
- Una promoción con condiciones diferentes deberá crearse como un descuento nuevo.

Los descuentos no se eliminarán permanentemente desde el panel.

### 16.8 Usos y reservas

El dueño podrá establecer un máximo total de usos o dejar el código sin límite. No existirán límites por persona, correo o dispositivo, porque la primera versión permite comprar sin cuenta y no dispone de una identidad suficientemente fuerte para hacerlos cumplir.

Cada pedido con descuento conservará trazabilidad de todos sus registros de uso. En el flujo ordinario tendrá uno; sólo una resolución tardía autorizada podrá conservar el uso original `released` y asociar uno nuevo. Cuando exista un límite global:

1. Aplicar el código al carrito no ocupa un uso.
2. Crear el pedido reserva atómicamente un uso.
3. La reserva permanece mientras el pago esté pendiente y el pedido continúe vigente.
4. Confirmar el pago compromete el uso sólo si continúa `active`; nunca modifica uno `released`.
5. Expirar o cancelar el pedido antes del pago libera el uso.
6. Cancelar o reembolsar un pedido pagado no devuelve automáticamente el uso.

El registro de uso podrá estar:

- `active`: reservado por un pedido pendiente.
- `committed`: consumido por un pedido pagado.
- `released`: devuelto a la disponibilidad antes del pago. Es terminal y nunca vuelve a `active` ni pasa a `committed`.

La reserva de uso seguirá la vigencia del pedido y, en el flujo ordinario, la de sus reservas de inventario. La liberación excepcional del inventario por un pago `unknown` que agotó su plazo de conciliación no liberará por sí sola el uso del descuento: el pago y el pedido continúan en revisión. Mientras ese uso continúe `active`, se comprometerá cuando el proveedor confirme el pago o se liberará cuando exista una resolución definitiva que termine el pedido sin pago. Esta reserva de uso no mantiene stock físico apartado.

Si un pedido realmente expiró y su uso promocional pasó a `released`, una resolución tardía favorable no reutilizará ese registro. Conservará el snapshot económico original sin recalcular precio, porcentaje, monto, catálogo, fechas ni condiciones comerciales históricas, pero deberá adquirir atómicamente un **nuevo uso de la misma promoción**. Para esa adquisición tardía sólo se comprobará la capacidad cuantitativa vigente del límite global; no se reevaluarán retrospectivamente las condiciones ya congeladas del pedido.

Si existe capacidad, el nuevo uso se asociará y comprometerá como parte de la misma resolución idempotente que asegura el inventario completo y, cuando corresponda, ejecuta `expired → open`. El historial conservará tanto el uso original `released` como el nuevo uso; la asociación nueva no sobrescribirá el registro anterior. Si no existe capacidad, el pedido no se reabrirá ni se cumplirá: corresponderá la devolución completa del dinero, sin recalcular, reemplazar ni reescribir su snapshot económico.

Ante dos operaciones simultáneas para el último uso, sólo una podrá reservarlo o adquirirlo para una resolución tardía. Los usos `active` más `committed` nunca excederán el límite global.

### 16.9 Cálculo y distribución

El subtotal elegible se calculará con las cantidades y precios vigentes antes del descuento y sin incluir despacho.

Para descuentos porcentuales, el sistema calculará el descuento correspondiente a cada línea elegible.

Para montos fijos, el valor se distribuirá proporcionalmente entre las líneas elegibles. Las diferencias de redondeo se resolverán de forma determinista sin dejar ninguna línea con valor negativo.

El cálculo respetará la unidad mínima de la moneda configurada. El pedido conservará:

- Código utilizado.
- Tipo y valor configurado.
- Descuento asignado a cada línea.
- Descuento total.
- Condiciones aplicadas al confirmar.
- Referencia al uso reservado o consumido.

La suma de los descuentos asignados a las líneas deberá coincidir exactamente con el descuento total del pedido.

### 16.10 Revalidación y pedidos existentes

Si un código caduca, se deshabilita, se agota o deja de cumplir sus condiciones antes de crear el pedido:

- Se excluirá del cálculo.
- El carrito o checkout conservará una indicación explícita del conflicto.
- Se informará el motivo de forma comprensible.
- La persona deberá revisar nuevamente el total antes de confirmar.

Si el código era válido cuando se creó correctamente el pedido:

- El descuento queda congelado.
- El uso queda reservado.
- El pedido puede completar su pago mientras continúe vigente.
- El descuento no se pierde porque la campaña venza, se agote o sea deshabilitada posteriormente.

Vencer, deshabilitar o archivar una campaña impide pedidos nuevos, pero no altera pedidos existentes. Para detener un pedido pendiente deberá cancelarse explícitamente.

### 16.11 Permisos administrativos

Se distinguirán dos capacidades:

- **Consultar descuentos:** ver configuración, vigencia, usos y pedidos relacionados.
- **Gestionar descuentos:** crear, modificar, habilitar, deshabilitar y archivar.

El dueño podrá administrar promociones dentro de los tipos y límites aprobados. El panel no permitirá instalar nuevos tipos de descuento ni alterar el motor de cálculo.

Las capacidades administrativas predefinidas se rigen por la sección 18.4 y no debilitan esta separación.

### 16.12 Validación pública y seguridad

El catálogo público nunca entregará una lista de descuentos o códigos existentes. Sólo validará un código cuando la persona lo ingrese explícitamente.

Además:

- Se limitará la frecuencia de intentos.
- El navegador no decidirá el monto descontado.
- Código, condiciones, alcance y cálculo se obtendrán desde el servidor.
- Un código inexistente o deshabilitado devolverá un mensaje genérico.
- Un código reconocido podrá informar condiciones incumplidas, como subtotal insuficiente, productos no elegibles, vencimiento o límite agotado.
- Los mensajes no expondrán configuración administrativa innecesaria.

### 16.13 Auditoría

Se registrarán:

- Creación.
- Modificaciones anteriores al primer uso.
- Habilitación, deshabilitación y archivado.
- Reserva de uso.
- Compromiso del uso.
- Liberación por cancelación o vencimiento.
- Pedidos y montos relacionados.

Cada evento identificará actor o proceso, fecha, descuento, pedido relacionado y valores anteriores y nuevos cuando corresponda.

### 16.14 Exclusiones iniciales

La primera versión no incluirá:

- Combinación de códigos.
- Descuentos automáticos.
- Reglas por identidad o historial de cliente.
- Límites por correo, dispositivo o dirección.
- Códigos individuales generados en masa.
- Programas de fidelización o referidos.
- Tarjetas de regalo o crédito interno.
- Promociones por cantidad, paquetes o regalos.
- Descuentos del 100 % o pedidos gratuitos.
- Descuentos sobre el despacho.

### 16.15 Invariantes

1. El servidor es la única autoridad del descuento.
2. Sólo puede existir un código aplicado por carrito y pedido.
3. El descuento sólo afecta líneas elegibles.
4. El despacho no recibe descuentos en la primera versión.
5. El descuento nunca produce valores negativos.
6. No se crean pedidos con total cero.
7. Toda modificación del carrito provoca un nuevo cálculo.
8. El descuento se valida nuevamente antes de crear el pedido.
9. El pedido conserva el código, las condiciones y la distribución confirmadas.
10. La suma de descuentos por línea coincide con el descuento total.
11. Los usos activos más los comprometidos nunca superan el límite global.
12. Cada pedido puede mantener como máximo un uso `active` o `committed` del mismo código a la vez; un uso histórico `released` no se reutiliza y sólo permite crear uno nuevo dentro de la resolución tardía autorizada.
13. Reservar, comprometer o liberar un uso es atómico e idempotente.
14. Un pedido cancelado antes del pago libera el uso.
15. Un pedido pagado posteriormente cancelado o reembolsado no recupera el uso automáticamente.
16. Una campaña usada no cambia de identidad ni de condiciones comerciales.
17. Vencer, deshabilitar o archivar una campaña no modifica pedidos existentes.
18. Los descuentos y sus usos no se eliminan del historial.
19. Un uso promocional `released` nunca vuelve a `active` ni pasa a `committed`.
20. La aceptación tardía de un pedido nunca hace que los usos `active` más `committed` superen el límite global.
21. El snapshot económico no se recalcula ni reescribe para resolver la falta de cupo promocional.
22. Si no puede adquirirse válidamente el nuevo uso requerido, corresponde devolución completa y no cumplimiento del pedido.
23. La liberación excepcional de inventario por `paymentStatus = unknown` no libera por sí sola un uso promocional que continúa `active`.

---

## 17. Despacho y retiro

**Estado: Aprobado**

### 17.1 Propósito y configuración estructural

El módulo determina cómo se entrega físicamente un pedido pagado, cómo se calcula su costo y cómo se registra su cumplimiento sin depender inicialmente de integraciones externas.

Durante la implementación de cada proyecto se fijará si la tienda ofrece:

- Sólo despacho.
- Sólo retiro.
- Ambas modalidades.

El dueño no podrá instalar transportistas, habilitar una modalidad no contratada ni cambiar el modelo de entrega desde el panel. Sí podrá administrar datos operativos autorizados, como tarifas, zonas, horarios e instrucciones.

### 17.2 Una modalidad por pedido

Cada pedido utilizará una sola modalidad para todas sus líneas. La primera versión no permitirá:

- Dividir un pedido entre despacho y retiro.
- Utilizar múltiples direcciones.
- Realizar despachos parciales.
- Separar un pedido en varios paquetes.
- Aplicar restricciones de entrega diferentes por producto o variante.

Si ciertos productos requieren modalidades distintas, deberán comprarse en pedidos separados hasta que un proyecto justifique ampliar el modelo.

### 17.3 Zonas de despacho y tarifas

El despacho se calculará mediante zonas geográficas. Cada zona tendrá:

- Identificador interno.
- Nombre.
- Regiones y comunas incluidas.
- Tarifa fija.
- Estado activo o inactivo.
- Plazo estimado opcional.
- Indicaciones opcionales.

Cada comuna podrá pertenecer como máximo a una zona activa. Si una dirección no corresponde a ninguna zona habilitada, el despacho no estará disponible.

El dueño podrá modificar tarifas y habilitar o deshabilitar zonas. No podrá cambiar desde el panel el criterio geográfico, conectar proveedores ni crear fórmulas basadas en peso, volumen, distancia o dimensiones.

La tarifa será mayor o igual a cero. Una tarifa cero permitirá ofrecer despacho gratuito para una zona sin utilizar un descuento promocional.

### 17.4 Dirección y elegibilidad

Cuando se seleccione despacho se solicitará:

- Nombre de quien recibe.
- Región.
- Comuna.
- Calle.
- Número.
- Departamento, casa u oficina, opcional.
- Indicaciones adicionales, opcionales.

Región y comuna se seleccionarán desde valores controlados. El servidor utilizará identificadores normalizados para determinar zona y tarifa; nunca confiará en un nombre de comuna escrito libremente.

La persona compradora será responsable de revisar la dirección antes de confirmar. El servidor comprobará que los campos sean coherentes y que exista una zona activa.

No habrá inicialmente geocodificación, validación postal externa, cálculo por kilómetros, selección mediante mapa ni corrección automática de direcciones.

### 17.5 Punto de retiro

La primera versión tendrá como máximo un punto de retiro por instalación. Podrá conservar:

- Nombre.
- Dirección.
- Referencia.
- Horarios.
- Instrucciones.
- Datos de contacto.

El retiro tendrá costo cero. No habrá reserva de horario, calendario de citas, selección de sucursal ni múltiples puntos.

El dueño podrá actualizar horarios, instrucciones y datos operativos, pero no crear puntos adicionales desde el panel.

### 17.6 Cálculo y congelación

Cuando la persona ingrese región y comuna, el servidor determinará:

- Si existe despacho disponible.
- Zona aplicable.
- Tarifa.
- Plazo estimado cuando esté configurado.

La cotización durante el checkout será provisional. Se recalculará cuando cambie la dirección o modalidad, antes de mostrar la revisión final e inmediatamente antes de crear el pedido.

Si la elegibilidad o tarifa cambia, no se creará el pedido hasta que la persona revise y confirme nuevamente.

Al crear el pedido quedarán congelados:

- Modalidad.
- Dirección confirmada o punto de retiro vigente.
- Zona.
- Tarifa.
- Plazo informado.
- Instrucciones aplicables.

Modificar posteriormente una zona, tarifa, horario o punto de retiro no alterará pedidos existentes.

### 17.7 Preparación y cumplimiento

La preparación sólo podrá comenzar después de confirmar el pago, comprometer el inventario completo del pedido y mantener el pedido `open`. Una aprobación tardía todavía pendiente de resolución de inventario o de un nuevo uso promocional no habilita preparación ni cumplimiento. Un pedido que permanece `expired` bajo revisión tardía tampoco puede prepararse; primero deberá completar válidamente la transición autorizada `expired → open`.

Para despacho:

`unfulfilled → preparing → shipped → delivered`

Para retiro:

`unfulfilled → preparing → ready_for_pickup → picked_up`

No se crearán estados diferentes por transportista. Las transiciones serán administrativas en la primera versión y el sistema no asumirá que un pedido fue entregado sólo porque transcurrió cierto plazo.

No se podrá retroceder de estado mediante una edición común. Cada transición registrará actor, fecha, estado anterior, estado nuevo y nota o motivo cuando corresponda.

### 17.8 Seguimiento manual

Al marcar un pedido como `shipped`, la administración podrá registrar:

- Transportista.
- Código de seguimiento.
- Enlace de seguimiento.
- Fecha de despacho.
- Nota interna opcional.

El seguimiento será opcional porque el negocio podrá utilizar reparto propio o transportistas sin consulta pública.

No habrá inicialmente generación de etiquetas, contratación automática de envíos, seguimiento sincronizado, webhooks de transportistas, transición automática a `delivered` ni varios códigos por pedido.

Las integraciones futuras deberán adaptarse a los mismos estados y no reemplazar la autoridad del pedido.

### 17.9 Código de retiro

Cuando el pedido pase a `ready_for_pickup`, el sistema generará un código aleatorio de retiro:

- Vinculado exclusivamente al pedido.
- Visible para la persona compradora mediante su acceso seguro.
- No visible como texto completo para la administración.
- Válido hasta retirar o cancelar.
- Utilizable una sola vez.

Para marcar `picked_up`, la administración deberá validar el código.

Un usuario con permiso excepcional podrá confirmar el retiro sin código, pero deberá registrar el nombre de quien retira y un motivo obligatorio. La confirmación excepcional quedará destacada en la auditoría.

### 17.10 Correcciones después de crear el pedido

La persona compradora no podrá cambiar la dirección ni modalidad mediante autoservicio después de crear el pedido.

Antes de marcar `shipped`, la administración podrá corregir:

- Calle.
- Número.
- Departamento, casa u oficina.
- Indicaciones adicionales.

No podrá cambiar mediante una corrección simple:

- Región.
- Comuna.
- Zona.
- Tarifa.
- Modalidad entre despacho y retiro.

Toda corrección exigirá permiso, motivo y auditoría. Si el cambio afecta elegibilidad o precio, el pedido deberá cancelarse y realizarse nuevamente mediante el flujo correspondiente.

Un pedido marcado como `shipped` no admitirá correcciones ordinarias de dirección.

### 17.11 Incidentes de entrega

Los problemas posteriores al despacho se representarán mediante un incidente separado del estado de preparación. Motivos iniciales:

- Destinatario ausente.
- Dirección incorrecta o incompleta.
- Entrega rechazada.
- Retraso.
- Paquete dañado.
- Paquete perdido.
- Devolución al remitente.
- Otro, con nota obligatoria.

El incidente estará abierto o resuelto y conservará su historial. Registrarlo:

- No marcará el pedido como entregado.
- No devolverá inventario.
- No iniciará automáticamente un reembolso.
- No permitirá modificar silenciosamente la dirección.
- No hará retroceder el pedido desde `shipped`.

Si el transportista entrega posteriormente, se resolverá el incidente y el pedido podrá pasar a `delivered`.

Si el paquete vuelve al negocio, deberá recibirse e inspeccionarse antes de reintegrar inventario. Si se pierde, podrá ejecutarse un reembolso completo, pero nunca se reintegrarán unidades que no regresaron físicamente.

No habrá reenvío automático dentro del mismo pedido en la primera versión.

### 17.12 Permisos administrativos

Se distinguirán tres capacidades:

- **Consultar entregas:** ver modalidad, dirección, seguimiento e incidentes.
- **Gestionar entregas:** preparar, despachar, marcar entrega o retiro, corregir datos permitidos y registrar incidentes.
- **Configurar operación:** administrar zonas, tarifas, horarios e instrucciones del punto de retiro.

Acciones sensibles como confirmar retiro sin código, corregir una dirección o resolver un incidente exigirán permiso y motivo.

El panel no permitirá activar una modalidad no contratada, crear múltiples puntos de retiro, instalar transportistas, cambiar el motor de cálculo ni reescribir pedidos históricos.

### 17.13 Auditoría

Se registrarán:

- Cambios de zonas y tarifas.
- Cambios del punto de retiro.
- Modalidad y tarifa congeladas en cada pedido.
- Transiciones de preparación.
- Datos de seguimiento.
- Correcciones de dirección.
- Generación y consumo del código de retiro.
- Confirmaciones de retiro sin código.
- Incidentes y sus resoluciones.
- Actor, fecha y valores anteriores y nuevos cuando corresponda.

Los registros no se editarán ni eliminarán. Los errores se corregirán mediante eventos posteriores.

### 17.14 Exclusiones iniciales

La primera versión no incluirá:

- Múltiples direcciones o modalidades por pedido.
- Despachos parciales o varios paquetes.
- Varias zonas activas para una misma comuna.
- Tarifas por peso, dimensiones, distancia o volumen.
- Validación externa de direcciones.
- Integraciones con transportistas.
- Etiquetas o contratación automática.
- Seguimiento o entrega sincronizados.
- Reenvío automático.
- Múltiples puntos de retiro.
- Horarios de retiro reservables.
- Cambios de modalidad después de crear el pedido.

### 17.15 Invariantes

1. Cada pedido utiliza una única modalidad de entrega.
2. Un pedido tiene una sola dirección o un solo punto de retiro.
3. El servidor determina zona, elegibilidad y tarifa.
4. Una comuna pertenece como máximo a una zona activa.
5. La tarifa nunca puede ser negativa.
6. El retiro cuesta cero en la primera versión.
7. La modalidad y su costo se validan antes de crear el pedido.
8. El pedido conserva una copia histórica de la entrega confirmada.
9. Cambiar zonas, tarifas u horarios no modifica pedidos existentes.
10. La preparación sólo comienza con pedido `open`, pago confirmado e inventario completo comprometido; una aprobación tardía todavía no resuelta no la habilita.
11. Un pedido de retiro nunca pasa a `shipped`.
12. Un pedido con despacho nunca pasa a `ready_for_pickup` ni `picked_up`.
13. Un pedido despachado no admite correcciones ordinarias de dirección.
14. Las transiciones no retroceden mediante edición directa.
15. Un pedido tiene como máximo un código de seguimiento en la primera versión.
16. El código de retiro pertenece a un solo pedido y se utiliza una sola vez.
17. Confirmar retiro sin código exige permiso y motivo.
18. Un incidente no cambia automáticamente pago, inventario ni estado del pedido.
19. Una devolución al remitente no reintegra stock antes de recepción e inspección.
20. Un paquete perdido nunca genera reintegro de inventario.
21. Toda transición, corrección y excepción queda auditada.
22. No existen envíos divididos, múltiples paquetes ni múltiples direcciones.

---

## 18. Panel administrativo

**Estado: Aprobado**

### 18.1 Propósito y límite operativo

El panel permitirá operar la tienda entregada sin funcionar como constructor de sitios ni como consola de infraestructura.

Podrá incluir administración de:

- Productos y variantes.
- Inventario.
- Descuentos.
- Pedidos y pagos.
- Preparación, despacho y retiro.
- Cancelaciones, devoluciones y reembolsos.
- Colaboradores y permisos operativos.
- Historial de actividad.

No permitirá modificar el frontend, construir páginas, cambiar moneda o mercado, reemplazar métodos de pago, instalar integraciones, sustituir proveedores, activar funciones no contratadas, modificar reglas estructurales ni acceder a secretos o variables técnicas.

El panel no podrá modificar arbitrariamente valores de estado, crear estados nuevos ni ejecutar transiciones fuera de la máquina autorizada. Sí podrá solicitar transiciones comerciales expresamente habilitadas por el dominio cuando la persona tenga permiso y se cumplan las precondiciones. El servidor validará y ejecutará cada transición; la interfaz nunca será su fuente de autoridad.

Los cambios estructurales serán intervenciones técnicas evaluadas como evolución del proyecto.

### 18.2 Dueño y colaboradores

Cada instalación tendrá:

- Exactamente un usuario `owner`.
- Cero o más colaboradores individuales.

El dueño tendrá todas las capacidades operativas habilitadas para la instalación, pero tampoco podrá alterar la arquitectura.

Podrá invitar colaboradores, asignar permisos predefinidos, suspender accesos y revocar sesiones. No podrá crear otro dueño ni transferir la propiedad desde el panel. El cambio de propietario requerirá un procedimiento técnico controlado.

No existirá una cuenta técnica oculta con acceso permanente. Una intervención de soporte deberá ser explícita, temporal y auditable, identificando a la persona real que la ejecuta.

### 18.3 Identidad individual y responsabilidad

No se permitirán cuentas compartidas. Cada persona utilizará su propia cuenta y toda acción administrativa se asociará a su identidad.

Cada evento conservará:

- Identificador inmutable del usuario.
- Nombre y correo registrados al ejecutar la acción.
- Fecha y hora exactas.
- Sesión utilizada.
- Acción ejecutada.
- Entidad afectada.
- Valores anteriores y nuevos cuando corresponda.
- Motivo cuando sea obligatorio.
- Resultado completado, rechazado, fallido o incierto.

Suspender a un colaborador no borrará su identidad histórica. Cambiar posteriormente su nombre o correo tampoco reescribirá cómo quedó registrado en acciones anteriores.

Las acciones automáticas se atribuirán a `system` e identificarán su evento de origen. Los webhooks y conciliaciones indicarán el proveedor o proceso responsable. No se permitirá actuar silenciosamente en nombre de otra persona.

### 18.4 Permisos predefinidos

No habrá un constructor de roles arbitrarios. El dueño asignará capacidades predefinidas, como:

- Consultar o gestionar catálogo.
- Consultar o gestionar inventario.
- Consultar u operar pedidos.
- Confirmar pagos por transferencia.
- Cancelar y reembolsar.
- Consultar o gestionar descuentos.
- Consultar o gestionar entregas.
- Configurar zonas y retiro.
- Consultar auditoría.
- Gestionar colaboradores.

Una capacidad de gestión incluirá la consulta del mismo módulo, pero no concederá permisos sobre otros módulos.

Todas las acciones se autorizarán en el servidor. Ocultar botones o rutas en la interfaz no constituirá una medida de autorización. Ningún permiso podrá habilitar funciones no contratadas para la instalación.

### 18.5 Navegación y resumen operativo

La navegación mostrará únicamente las secciones autorizadas:

- Resumen.
- Pedidos.
- Productos.
- Inventario.
- Descuentos.
- Entregas.
- Colaboradores.
- Actividad.

El resumen inicial priorizará tareas pendientes en vez de analítica compleja. Podrá mostrar:

- Transferencias pendientes de revisión.
- Pedidos pagados sin preparar.
- Pedidos listos para retiro.
- Reembolsos pendientes.
- Incidentes de entrega abiertos.
- Variantes con stock bajo o agotado.

Cada indicador llevará al listado filtrado correspondiente. Los gráficos avanzados, reportes comerciales y paneles configurables quedan fuera de esta primera versión.

### 18.6 Acceso por invitación

No habrá registro público de cuentas administrativas.

- El `owner` se creará mediante un procedimiento inicial controlado.
- El dueño invitará colaboradores desde el panel.
- La invitación será individual, de un solo uso y vencerá después de veinticuatro horas.
- Aceptarla verificará el control del correo y permitirá configurar credenciales.
- Una invitación vencida o revocada no podrá reutilizarse.
- Ninguna cuenta accederá a funciones operativas antes de completar su activación.

### 18.7 Contraseña y segundo factor

Todas las cuentas administrativas utilizarán:

- Contraseña de al menos doce caracteres.
- Segundo factor obligatorio mediante aplicación autenticadora TOTP.
- Códigos de recuperación de un solo uso.

No se utilizará SMS como mecanismo principal.

La contraseña podrá contener espacios y caracteres Unicode, admitirá gestores de contraseñas y pegado, y no exigirá combinaciones arbitrarias de tipos de caracteres. Se comprobará contra contraseñas conocidas como comprometidas y no vencerá periódicamente; deberá cambiarse ante recuperación o evidencia de compromiso.

El servidor almacenará únicamente una derivación criptográfica resistente y nunca una contraseña recuperable.

Estas reglas deberán mantenerse alineadas con las recomendaciones vigentes de [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) y [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### 18.8 Sesiones

La sesión administrativa será opaca y gestionada por el servidor:

- Se transportará mediante cookie `Secure`, `HttpOnly` y `SameSite`.
- No se guardarán tokens administrativos en `localStorage`.
- Las operaciones que cambien datos tendrán protección contra CSRF.
- El identificador de sesión se renovará después de autenticar o modificar privilegios.
- Expirará después de doce horas de inactividad.
- Tendrá una duración absoluta máxima de siete días.
- No habrá sesión permanente.

Cada persona podrá consultar y cerrar sus sesiones activas. El dueño podrá revocar todas las sesiones de un colaborador.

La implementación seguirá los criterios de [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) y [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### 18.9 Reautenticación y recuperación

Las acciones sensibles exigirán que la identidad haya sido confirmada nuevamente durante los últimos quince minutos.

Se exigirá reautenticación como mínimo para:

- Confirmar pagos.
- Cancelar o reembolsar.
- Modificar permisos.
- Suspender colaboradores.
- Restablecer MFA.
- Corregir inventario.
- Confirmar retiro sin código.

Además:

- Cambiar contraseña revocará las demás sesiones.
- Suspender una cuenta revocará todas sus sesiones inmediatamente.
- Restablecer MFA revocará sesiones y códigos de recuperación anteriores.
- El dueño podrá reiniciar el acceso de un colaborador.
- La recuperación del `owner` requerirá un procedimiento técnico reforzado.
- Los errores de acceso no revelarán si un correo está registrado.
- Los intentos repetidos tendrán limitación progresiva.
- Inicios de sesión, fallos, recuperaciones y revocaciones quedarán auditados.

### 18.10 Confirmación de acciones sensibles

Antes de una acción irreversible o de alto impacto, el panel mostrará:

- Operación que se ejecutará.
- Pedido, producto, descuento o persona afectada.
- Consecuencias sobre dinero, inventario y estados.
- Posibilidad o imposibilidad de compensarla después.
- Campo de motivo cuando sea obligatorio.

Requerirán confirmación explícita:

- Confirmar una transferencia.
- Cancelar un pedido.
- Iniciar o confirmar un reembolso.
- Corregir inventario.
- Archivar un producto.
- Cambiar tarifas.
- Suspender colaboradores.
- Modificar permisos.
- Confirmar retiro sin código.
- Resolver incidentes de entrega.

Las operaciones sensibles serán idempotentes para que un doble clic o reintento no produzca efectos duplicados.

### 18.11 Respuesta visual y errores

El panel no mostrará una acción sensible como exitosa antes de que el servidor confirme que fue aplicada.

Las solicitudes podrán representarse como:

- `pending`: continúa procesándose.
- `succeeded`: fue confirmada y persistida.
- `failed`: no fue aplicada.
- `unknown`: se perdió la respuesta y debe consultarse el resultado antes de reintentar.

Ante un error se conservarán los datos ingresados, se explicará qué no pudo completarse y se consultará el estado vigente cuando exista un resultado incierto. No se ocultarán conflictos de concurrencia ni se realizará un reintento ciego.

Las interacciones sin efecto comercial, como filtros, orden o navegación, podrán actualizarse de forma inmediata. Dinero, inventario, pedidos, entregas y permisos esperarán confirmación real.

### 18.12 Actividad visible

La sección **Actividad** permitirá filtrar por:

- Persona o actor.
- Acción.
- Módulo.
- Entidad afectada.
- Fecha.
- Resultado.
- Motivo.

Cada evento mostrará la identidad conservada, tipo de actor, momento, sesión, acción, entidad, valores relevantes, motivo y resultado.

Los registros de actividad no podrán editarse ni eliminarse desde el panel. Su conservación, integridad y acceso se regirán por la auditoría transversal definida en la sección 20.

### 18.13 Concurrencia y cambios de permisos

Si dos personas editan el mismo recurso:

- El servidor comprobará la versión conocida.
- Una edición desactualizada será rechazada.
- Se mostrará la información vigente.
- La persona deberá revisar antes de enviar nuevamente.

Los cambios de permisos se aplicarán inmediatamente:

- Las siguientes solicitudes utilizarán los permisos nuevos.
- Retirar una capacidad sensible podrá revocar las sesiones afectadas.
- Suspender una cuenta cerrará todas sus sesiones.
- Un colaborador nunca podrá elevar sus propios permisos.
- Nadie podrá suspender al único `owner`.
- Los permisos nunca podrán superar las funciones habilitadas para la instalación.

### 18.14 Exclusiones iniciales

La primera versión no incluirá:

- Registro público.
- Cuentas compartidas.
- Múltiples dueños.
- Constructor de roles.
- Aprobación de acciones por varias personas.
- Inicio de sesión con redes sociales.
- SSO empresarial.
- Passkeys.
- Suplantación de usuarios.
- Acceso técnico permanente.
- Administración de varias tiendas desde una cuenta.
- Aplicación móvil administrativa.
- Acciones financieras masivas.

### 18.15 Invariantes

1. Cada persona utiliza una cuenta individual.
2. Cada instalación tiene exactamente un `owner`.
3. No existe registro público administrativo.
4. Toda autorización se valida en el servidor.
5. Ocultar una acción en la interfaz no constituye autorización.
6. MFA es obligatorio para todas las cuentas administrativas.
7. Toda acción administrativa identifica actor, sesión, momento y resultado.
8. Las acciones automáticas nunca se atribuyen a una persona.
9. Los registros de actividad no se editan ni eliminan desde el panel.
10. Suspender una cuenta revoca sus sesiones.
11. Un colaborador no eleva sus propios permisos.
12. Las acciones sensibles requieren confirmación y autenticación reciente.
13. Los motivos obligatorios no pueden omitirse.
14. Una respuesta incierta se consulta antes de reintentar.
15. Un reintento no duplica efectos.
16. Una edición desactualizada no sobrescribe información vigente.
17. El panel nunca muestra éxito antes de la confirmación del servidor.
18. El dueño administra la operación, no la arquitectura.
19. Ningún permiso habilita funciones no contratadas.
20. No existe acceso silencioso en nombre de otra persona.
21. Suspender o renombrar una cuenta no reescribe la responsabilidad histórica.
22. Una intervención técnica identifica a su actor real y queda auditada.

---

## 19. Notificaciones

**Estado: Aprobada — comunicaciones transaccionales por correo y alertas operativas**

### 19.1 Propósito y autoridad

El módulo informará hechos ya registrados por los dominios comerciales. Una notificación no crea, confirma, cancela ni modifica pedidos, pagos, inventario, descuentos, despachos o reembolsos.

La primera versión se limitará a comunicaciones transaccionales y alertas operativas. No será una plataforma de marketing ni una fuente alternativa del estado comercial.

Una falla, demora o resultado incierto al enviar una notificación:

- No revierte la operación que la originó.
- No modifica su resultado.
- No permite inferir que la operación comercial falló.
- Debe tratarse dentro del módulo de notificaciones.

### 19.2 Canales y configuración estructural

Los canales iniciales serán:

- **Persona compradora:** correo electrónico transaccional.
- **Administración:** alertas dentro del panel y correos operativos opcionales.

El proveedor de correo, el dominio remitente y las credenciales se definirán durante la implementación de cada proyecto. No podrán reemplazarse desde el panel administrativo.

La primera versión no incluirá SMS, WhatsApp, notificaciones push ni otros canales de pago por uso. Una integración futura deberá conservar los mismos eventos, autoridades y reglas de trazabilidad.

### 19.3 Registro durable y procesamiento asíncrono

La intención de notificar deberá quedar registrada de forma durable junto con el hecho comercial que la origina. La entrega al proveedor se procesará después y de manera asíncrona.

El registro incluirá como mínimo:

- Tipo de evento.
- Entidad y operación de origen.
- Destinatario previsto.
- Canal.
- Plantilla y versión.
- Estado de procesamiento.
- Intentos realizados.
- Fechas relevantes.
- Referencia del proveedor, cuando exista.
- Resultado de entrega informado, cuando exista.

Cada intención tendrá una clave idempotente derivada del evento comercial. Procesar nuevamente el mismo evento no creará envíos duplicados involuntarios.

### 19.4 Notificaciones para la persona compradora

Se enviarán notificaciones por los siguientes hechos, cuando correspondan al flujo del pedido:

- Pedido recibido.
- Instrucciones de transferencia y vencimiento.
- Pago confirmado.
- Pedido vencido.
- Pedido cancelado.
- Pedido listo para retiro.
- Pedido despachado, con referencia de seguimiento cuando exista.
- Pedido entregado o retirado.
- Reembolso iniciado.
- Reembolso completado.
- Reembolso fallido o con resolución pendiente.

El mensaje de pedido recibido podrá reunir la confirmación del pedido y las instrucciones del medio de pago aplicable. No se enviarán mensajes cuyo único propósito sea repetir información sin un cambio operativo real.

Estas comunicaciones forman parte del servicio solicitado y no utilizan una suscripción de marketing. No incluirán contenido promocional como condición para informar el estado de la compra.

### 19.5 Alertas para la administración

El panel podrá generar alertas por eventos que requieran revisión o trabajo, entre ellos:

- Nuevo pedido pendiente de transferencia.
- Pedido pagado pendiente de preparación.
- Pago o reembolso fallido, incierto o pendiente de resolución.
- Pedido listo para continuar su cumplimiento.
- Incidente de despacho abierto.
- Stock bajo o agotado, cuando esa alerta esté habilitada.

Las alertas orientan la operación, pero no sustituyen la consulta de la entidad autoritativa. Marcar una alerta como vista no confirma ni resuelve el pedido, pago, inventario o incidente relacionado.

### 19.6 Destinatarios y preferencias administrativas

Las preferencias se administrarán por cuenta individual y respetarán los permisos de cada persona.

Una persona administradora podrá activar o desactivar correos operativos opcionales dentro de las categorías disponibles. Esta preferencia no ocultará tareas ni estados autoritativos dentro del panel.

Las comunicaciones críticas de seguridad no podrán desactivarse. Esto comprende, según corresponda:

- Invitaciones administrativas.
- Recuperación o cambio de contraseña.
- Activación, recuperación o modificación de MFA.
- Cambio de permisos.
- Suspensión de cuenta o revocación de sesiones.

Las alertas de seguridad se dirigirán a la cuenta afectada y al dueño cuando el evento requiera su conocimiento.

### 19.7 Validación y corrección del correo

Durante el checkout, el sistema deberá:

- Eliminar espacios accidentales y aplicar únicamente normalizaciones seguras.
- Validar la estructura del correo.
- Mostrar claramente la dirección a la que se enviará la información antes de confirmar.
- Permitir corregirla antes de crear el pedido.
- Advertir posibles errores evidentes en dominios comunes sin reemplazarlos automáticamente.

No se exigirá repetir el correo en un segundo campo.

Un formato válido no demuestra que la dirección pertenezca a la persona compradora. Si el pedido ya fue creado con una dirección incorrecta:

1. El pedido continuará existiendo y conservará su estado comercial.
2. Una persona administradora con permiso explícito podrá corregir el correo indicando un motivo obligatorio.
3. Se conservarán la dirección original, la corregida, el actor, la sesión y el momento del cambio.
4. Se revocarán obligatoriamente todas las credenciales públicas anteriores aplicables al pedido; los enlaces enviados a la dirección anterior dejarán de autorizar acceso inmediatamente.
5. Se emitirá un nuevo enlace seguro para la dirección corregida.
6. Las notificaciones necesarias podrán reenviarse como registros nuevos vinculados con los envíos originales.

La corrección no modificará retrospectivamente el destinatario ni el resultado de las notificaciones anteriores.

### 19.8 Plantillas controladas y versionadas

Las plantillas se configurarán durante la implementación de cada ecommerce. El dueño y sus colaboradores no podrán editar desde el panel:

- La estructura de una plantilla.
- Sus variables disponibles.
- Su lógica condicional.
- El proveedor o dominio remitente.

Cada envío conservará la identidad y versión de la plantilla utilizada. Un cambio posterior no reescribirá los mensajes históricos ni hará que un reenvío aparente ser el envío original.

La incorporación futura de un editor visual, nuevos idiomas o contenido personalizado constituirá una ampliación explícita del producto.

### 19.9 Información sensible y enlaces seguros

Los mensajes incluirán sólo la información necesaria para comprender el evento. No contendrán:

- Contraseñas o credenciales administrativas.
- Datos completos de pago.
- Dirección de entrega completa cuando no sea necesaria.
- Notas internas.
- Códigos internos.
- El código completo de retiro.

Cuando se requiera consultar información protegida, el mensaje dirigirá al acceso seguro del pedido definido en la sección 12.9. La credencial será opaca, específica, revocable, reemplazable y tendrá la vigencia explícita definida allí. Su transporte y canje deberán cumplir la sección 12.9.1 para evitar que el secreto se propague durante la navegación.

Corregir el correo y reemitir el acceso revocará obligatoriamente todas las credenciales públicas anteriores aplicables, sin alterar el pedido. Cancelar el pedido o detectar exposición de un enlace también deberá permitir revocar el acceso. El sistema emitirá un acceso nuevo cuando corresponda y nunca incluirá el secreto completo en auditoría, logs o analítica.

### 19.10 Estados de procesamiento y entrega

El procesamiento interno tendrá estados explícitos:

| Estado | Significado |
| --- | --- |
| `pending` | El envío está registrado y espera procesamiento. |
| `sending` | Existe un intento activo cuyo resultado todavía no se conoce. |
| `sent` | El proveedor aceptó el mensaje. |
| `failed` | El intento terminó con un error conocido. |
| `unknown` | No puede determinarse con seguridad si el proveedor lo aceptó. |

`sent` no significa que la persona recibió o leyó el mensaje. Cuando el proveedor lo permita, se registrará por separado el resultado posterior, como entregado, rebotado o rechazado.

El sistema no afirmará que un correo fue leído basándose únicamente en que fue enviado o entregado.

### 19.11 Reintentos y resultados inciertos

Los errores temporales tendrán reintentos progresivos y limitados. Los errores definitivos, como una dirección rechazada de manera permanente, no se repetirán indefinidamente.

Cada intento se vinculará con la misma intención de notificación y conservará su resultado. Los reintentos deberán ser idempotentes frente a respuestas repetidas del sistema o del proveedor.

Un resultado `unknown` se conciliará antes de crear un nuevo envío. No se realizará un reintento ciego que pueda duplicar el mensaje.

Después de agotar los reintentos automáticos, la notificación quedará disponible para revisión operativa sin afectar el hecho comercial que la originó.

### 19.12 Respuestas del proveedor

Los webhooks o respuestas asíncronas del proveedor deberán:

- Verificar autenticidad mediante el mecanismo oficial disponible.
- Validar su estructura antes de procesarse.
- Ser idempotentes.
- Tolerar duplicados y eventos desordenados.
- Vincularse con un envío conocido.
- Registrar el momento y resultado recibido.

Un evento del proveedor sólo actualiza el estado técnico de la comunicación. Nunca cambia directamente el estado de un pedido, pago, reembolso, inventario o despacho.

### 19.13 Reenvío manual

Una persona con permiso explícito podrá reenviar determinadas notificaciones transaccionales desde el panel.

El reenvío deberá:

- Exigir confirmación explícita.
- Estar limitado para prevenir errores o abuso.
- Identificar a la persona, sesión y momento.
- Registrar el motivo cuando el contexto lo requiera.
- Crear un envío nuevo vinculado con el original.
- Usar la información vigente y una plantilla identificada.

Nunca se eliminará, reemplazará ni cambiará el resultado del envío original.

### 19.14 Auditoría y conservación

Quedarán registradas como acciones auditables:

- La corrección de un destinatario.
- La revocación y nueva emisión de un enlace.
- El reenvío manual.
- El cambio de preferencias administrativas.
- Los cambios técnicos de plantilla o configuración de entrega.
- La intervención manual sobre una notificación fallida o incierta.

Los registros de notificación no podrán editarse ni eliminarse desde el panel. Su conservación, protección y acceso se regirán por la auditoría transversal definida en la sección 20.

### 19.15 Exclusiones iniciales

La primera versión no incluirá:

- Campañas de marketing.
- Newsletters.
- Automatizaciones promocionales.
- Segmentación comercial.
- Mensajes masivos.
- Redacción libre de correos desde el panel.
- Editor visual de plantillas.
- SMS, WhatsApp o notificaciones push.
- Métricas de apertura como prueba de lectura.
- Centro de comunicaciones con conversaciones bidireccionales.

Si un negocio requiere marketing o mensajería conversacional, se integrará como un sistema independiente y sin concederle autoridad sobre la operación comercial.

### 19.16 Invariantes

1. Una notificación informa un hecho; no lo crea ni lo modifica.
2. Una falla de entrega no revierte una operación comercial.
3. Toda intención de notificación queda registrada de forma durable.
4. El mismo evento comercial no genera duplicados involuntarios.
5. Todo intento y resultado conserva trazabilidad.
6. `sent` sólo significa aceptación por el proveedor.
7. Un resultado incierto se concilia antes de reenviar.
8. Los webhooks del proveedor no tienen autoridad comercial.
9. El código de retiro no se envía como texto completo por correo.
10. Los mensajes no exponen notas internas ni credenciales.
11. Corregir un correo no reescribe el historial anterior.
12. Corregir el correo y reemitir acceso revoca obligatoriamente todas las credenciales públicas anteriores aplicables; dejan de autorizar inmediatamente.
13. Un reenvío crea un registro nuevo.
14. Toda acción manual identifica a la persona responsable.
15. Las alertas críticas de seguridad no pueden desactivarse.
16. El panel no permite mensajería libre ni campañas.
17. La administración no reemplaza el proveedor desde el panel.
18. Marcar una alerta como vista no resuelve la entidad relacionada.

---

## 20. Auditoría transversal

**Estado: Aprobada — evidencia común de responsabilidad, integridad y trazabilidad**

### 20.1 Propósito y límites

La auditoría transversal permitirá determinar quién o qué realizó una acción, cuándo ocurrió, sobre qué entidad, por qué se ejecutó y cuál fue su resultado.

La auditoría documenta hechos, pero no sustituye las autoridades del negocio. Pedidos, pagos, inventario, descuentos, cumplimiento y notificaciones conservarán sus propios estados y registros autoritativos.

No se auditará cada visita, búsqueda o navegación pública. La analítica, las métricas y los registros técnicos de diagnóstico tendrán propósitos y políticas de conservación separados.

### 20.2 Hechos auditables

Se registrarán como mínimo:

- Acciones administrativas que modifiquen el sistema.
- Consultas o exportaciones de información especialmente sensible.
- Acciones de clientes que produzcan efectos comerciales o de seguridad relevantes.
- Cambios comerciales automáticos.
- Respuestas de pasarelas, proveedores de correo y otros servicios externos.
- Inicios de sesión, intentos fallidos, recuperaciones y cambios de seguridad.
- Cambios de permisos y sesiones.
- Intervenciones técnicas o de soporte.
- Intentos fallidos de ejecutar acciones sensibles.

Los módulos podrán conservar además sus propios historiales especializados. El evento transversal los vinculará sin duplicar indiscriminadamente toda su información.

### 20.3 Historial acumulativo

Los eventos serán acumulativos. La aplicación y el panel no ofrecerán operaciones ordinarias para editarlos o eliminarlos.

Si una acción fue incorrecta, se ejecutará una operación compensatoria. Tanto la acción original como su corrección permanecerán registradas y relacionadas.

Suspender una cuenta, cambiar su nombre o modificar su correo no reescribirá la responsabilidad histórica. El evento conservará el identificador inmutable del actor y una representación legible de su identidad al momento de actuar.

### 20.4 Actores explícitos

Cada evento identificará uno de los siguientes tipos de actor:

- Persona administradora autenticada.
- Persona compradora o sesión pública.
- Sistema automático.
- Proveedor externo.
- Soporte o intervención técnica.

Las acciones automáticas se atribuirán a `system` e indicarán el evento o proceso que las originó. Los proveedores se identificarán individualmente.

No existirá suplantación silenciosa. Una intervención técnica se atribuirá a la persona real que la ejecutó, nunca al dueño, a un colaborador ni a la persona compradora afectada.

### 20.5 Contenido mínimo de un evento

Cada registro contendrá, cuando corresponda:

- Identificador y tipo del evento.
- Acción ejecutada.
- Entidad y módulo afectados.
- Identificador y tipo del actor.
- Nombre y correo históricos cuando el actor sea una persona administradora.
- Fecha y hora exactas en UTC.
- Sesión, solicitud e identificador de correlación.
- Estado anterior y posterior o diferencias relevantes.
- Motivo, cuando sea obligatorio.
- Resultado: `succeeded`, `failed` o `unknown`.
- Evento de origen y operaciones relacionadas.
- Datos técnicos de seguridad estrictamente necesarios.

Un resultado `unknown` no se presentará como exitoso. Deberá investigarse o conciliarse antes de repetir una operación que pueda duplicar efectos.

### 20.6 Minimización de datos

La auditoría almacenará diferencias relevantes, no copias completas e indiscriminadas de documentos, solicitudes o respuestas.

No se registrarán:

- Contraseñas.
- Secretos o credenciales.
- Tokens o enlaces de acceso completos.
- Códigos de retiro completos.
- Datos bancarios completos.
- Cuerpos sensibles que no sean necesarios para demostrar el hecho.

Los valores protegidos permanecerán ocultos también en consultas y exportaciones. Las notas libres tendrán límites de extensión y propósito para evitar que se conviertan en depósitos de datos personales.

### 20.7 Acceso restringido

El dueño podrá consultar la auditoría completa de su instalación. Los colaboradores requerirán el permiso explícito de consulta de auditoría.

Tener permisos sobre productos, inventario, pagos, pedidos o entregas no concederá automáticamente acceso a la auditoría general.

El acceso de soporte deberá formar parte de una intervención técnica identificada y autorizada. La consulta o exportación de registros especialmente sensibles también quedará auditada.

Ningún usuario podrá consultar eventos pertenecientes a otra instalación.

### 20.8 Consulta operativa

El panel permitirá filtrar por:

- Fecha.
- Persona o tipo de actor.
- Acción.
- Módulo.
- Entidad afectada.
- Resultado.
- Motivo.
- Identificador de pedido, pago, producto u otra entidad relacionada.

Cada entidad podrá mostrar su propia línea de actividad. Una vista general permitirá seguir eventos relacionados mediante sus identificadores de correlación.

Las fechas se almacenarán en UTC y se presentarán según la zona horaria configurada para la tienda.

### 20.9 Conservación

Los eventos se conservarán durante cinco años de manera predeterminada.

- El periodo se fijará durante la implementación de cada proyecto.
- No podrá modificarse desde el panel.
- Podrá ampliarse por una necesidad operacional o una obligación aplicable.
- El vencimiento de un evento no eliminará pedidos, pagos, movimientos de inventario ni otros registros comerciales relacionados.
- La eliminación por retención será automática, controlada y dejará evidencia operativa del lote procesado.

La evidencia de los procesos de retención no conservará el contenido íntegro de los eventos eliminados.

### 20.10 Exportación controlada

El dueño o una persona con permiso específico podrá exportar resultados filtrados.

La exportación:

- Requerirá confirmación explícita y autenticación reciente.
- Se generará de manera asíncrona.
- Tendrá un alcance limitado por los filtros y permisos vigentes.
- Ocultará o reducirá datos sensibles.
- Proporcionará un archivo con acceso temporal.
- Auditará la solicitud, generación y descarga.

La primera versión podrá utilizar CSV para revisión operativa y JSON para investigación técnica. No existirá importación ni restauración desde estos archivos.

### 20.11 Persistencia obligatoria y hechos externos

La auditoría continúa siendo obligatoria, pero el tratamiento distinguirá entre una acción interna que todavía puede impedirse y un hecho externo que ya ocurrió.

#### Acción interna

Una modificación sensible originada dentro del ecommerce —como una corrección administrativa, cancelación desde el panel, cambio de configuración o transición iniciada por una persona— no podrá producir efectos si su evidencia durable no puede garantizarse.

El cambio comercial y su evento de auditoría deberán persistirse de forma atómica o mediante un registro durable equivalente. Si la auditoría obligatoria no está disponible:

- La acción se rechazará antes de producir efectos.
- El panel no mostrará un éxito aparente.
- Las consultas que no modifican información podrán continuar.
- La navegación pública podrá continuar cuando no dependa del componente afectado.
- El intento rechazado se registrará posteriormente sólo si puede hacerse de forma segura y sin inventar un resultado.

#### Hecho externo ya ocurrido

Una aprobación, rechazo, devolución u otro resultado confirmado por un proveedor existe con independencia de que el ecommerce consiga procesarlo inmediatamente. El sistema no podrá negar ese hecho ni representar falsamente que el proveedor no cobró o no devolvió dinero.

Cada evento externo utilizará una identidad idempotente del proveedor. Antes de reconocer su procesamiento completo, el sistema deberá lograr una de estas garantías:

1. Persistir en una misma transacción los efectos comerciales locales y el evento de auditoría; o
2. Persistir una recepción técnica mínima y durable desde la cual los efectos comerciales y la auditoría puedan completarse de manera determinista mediante reintentos o conciliación.

La recepción durable contendrá sólo el identificador del proveedor, la referencia comercial necesaria, el tipo de evento, su estado de procesamiento y las fechas relevantes. No conservará secretos ni cuerpos completos innecesarios.

Si ni siquiera puede persistirse esa recepción, el sistema no reconocerá el evento como procesado ante el proveedor y dependerá de un reintento auténtico o de la conciliación posterior. Esto no cambia el hecho externo; sólo mantiene pendiente su aplicación local.

El procesamiento deberá impedir estados parciales como:

- Pago aplicado sin actualizar el pedido.
- Inventario comprometido sin la auditoría obligatoria.
- Auditoría creada sin aplicar el evento comercial correspondiente.
- Procesamiento doble del mismo evento.

Un fallo dejará el evento pendiente de procesamiento o conciliación, nunca parcialmente aplicado ni falsamente rechazado. Los reintentos recuperarán el mismo resultado de manera idempotente.

### 20.12 Protección e integridad

La protección inicial utilizará:

- Operaciones de aplicación limitadas a agregar eventos.
- Credenciales de base de datos con privilegios restringidos.
- Copias de seguridad.
- Comprobaciones de integridad y detección de eventos incompletos.
- Alertas ante fallos de persistencia obligatoria.
- Operaciones compensatorias en lugar de reescrituras.
- Procesamiento idempotente de eventos repetidos.

No se incorporará blockchain ni un servicio externo de inmutabilidad en la primera versión. Tampoco se afirmará que los registros sean imposibles de alterar por alguien con control total de la infraestructura.

### 20.13 Intervenciones técnicas

Toda intervención técnica o de soporte registrará:

- Persona responsable.
- Motivo, solicitud o incidente relacionado.
- Inicio y término.
- Entorno afectado.
- Acciones realizadas.
- Resultado.
- Script, migración o versión utilizada, cuando corresponda.
- Cantidades afectadas antes y después, cuando sea pertinente.

No existirá acceso técnico permanente ni una cuenta oculta compartida. El mecanismo específico de autorización se definirá durante la implementación sin debilitar estas reglas.

### 20.14 Exclusiones iniciales

La primera versión no incluirá:

- Blockchain.
- Servicio externo de inmutabilidad.
- Grabación indiscriminada de todas las solicitudes.
- Conservación indefinida por defecto.
- Constructor administrativo de políticas de retención.
- Restauración desde exportaciones.
- Analítica de comportamiento dentro de la auditoría.
- Edición o eliminación manual de eventos desde el panel.
- Suplantación de usuarios.

### 20.15 Invariantes

1. Toda acción sensible produce evidencia durable.
2. Si la auditoría obligatoria de una acción interna no puede garantizarse, la acción se rechaza antes de producir efectos.
3. Los eventos son acumulativos y no se editan desde el panel.
4. Una corrección genera un evento nuevo y no reescribe el anterior.
5. Cada evento identifica al actor real.
6. Las acciones automáticas se atribuyen a `system` y registran su origen.
7. Los proveedores externos se identifican individualmente.
8. El soporte técnico nunca actúa silenciosamente como otra persona.
9. Suspender o eliminar el acceso de una cuenta no elimina su responsabilidad histórica.
10. Cambiar el nombre o correo de una cuenta no modifica eventos anteriores.
11. La auditoría documenta el negocio, pero no sustituye sus autoridades.
12. Ningún evento contiene contraseñas, secretos, tokens ni códigos completos.
13. Los cambios registran diferencias relevantes, no copias indiscriminadas.
14. Los eventos relacionados permiten reconstruir la secuencia de una operación.
15. Las fechas se almacenan en UTC.
16. Consultar información especialmente sensible y exportar auditoría también genera eventos.
17. Toda exportación requiere permiso, autenticación reciente y acceso temporal.
18. Los eventos se conservan cinco años de forma predeterminada.
19. El vencimiento de la auditoría no elimina registros comerciales relacionados.
20. La eliminación por retención se ejecuta mediante procesos controlados y deja evidencia operativa.
21. Un resultado `unknown` nunca se presenta como exitoso.
22. Los eventos repetidos de proveedores se procesan idempotentemente.
23. Auditoría, analítica y registros técnicos permanecen separados.
24. La primera versión no promete inmutabilidad absoluta frente a quien controle toda la infraestructura.
25. Un hecho externo confirmado no se representa como inexistente por una falla local.
26. Los efectos locales de un hecho externo se aplican junto con su auditoría o se recuperan determinísticamente desde una recepción durable.
27. Un evento externo parcialmente aplicado no puede considerarse procesado.
28. La identidad idempotente de un proveedor produce como máximo un conjunto de efectos locales.

---

## 21. Cierre documental y decisiones restantes

**Estado: Aclaración administrativa de transferencias completada — implementación no autorizada**

La versión 0.15.5 aclara el tratamiento administrativo de las diferencias en transferencias bancarias. No incorpora automatización financiera ni funcionalidad comercial nueva. Esta especificación constituye la fuente funcional vigente para una futura planificación de implementación.

### 21.1 Decisiones realmente pendientes

Permanecen abiertas únicamente decisiones que dependen de obligaciones legales y del contexto concreto de cada proyecto:

1. **Conservación de registros comerciales:** duración aplicable a pedidos, pagos, reservas y movimientos una vez terminada su necesidad operativa.
2. **Tratamiento posterior de datos personales:** reglas de eliminación, anonimización o conservación restringida cuando terminen los plazos comerciales y legales.

Estas decisiones no modifican los flujos operativos aprobados. La política de cinco años de la sección 20.9 pertenece exclusivamente a eventos de auditoría y no resuelve por sí sola la conservación de registros comerciales.

No quedan pendientes funcionales sobre creación o vencimiento de reservas, recuperación y resolución tardía de pagos, efectos de inventario en cancelaciones o reembolsos, usos promocionales tardíos, correo, idempotencia del checkout, acceso público al pedido, transiciones administrativas, notificaciones ni auditoría.

La implementación y su planificación continúan sin estar autorizadas por este documento.

---

## 22. Registro de cambios

### 0.15.5 — 28 de agosto de 2026

**Aclaración del tratamiento administrativo de diferencias en transferencias bancarias, sin ampliar el alcance funcional.**

- Bloqueo de los efectos ordinarios ante faltantes, excedentes u otras discrepancias mientras no exista confirmación administrativa válida.
- Separación explícita entre la resolución humana directa con la persona compradora y los efectos que el ecommerce aplica después de la confirmación.
- Exigencia de revisión y confirmación administrativa antes de que una transferencia discrepante o tardía ingrese al flujo normal o de resolución tardía.
- Reafirmación de que no se incorporan pagos parciales, múltiples transferencias, saldos, créditos, *wallets* ni automatización de diferencias.

### 0.15.4 — 27 de agosto de 2026

**Corrección residual de coherencia entre creación de reservas, cobros ordinarios y resolución tardía. No incorpora funcionalidades nuevas.**

- Distinción entre reservas iniciales creadas con el checkout y reservas nuevas creadas exclusivamente dentro de una resolución tardía autorizada.
- Limitación de la precondición de reservas activas a cobros ordinarios iniciados o controlados por el ecommerce, sin impedir el registro de hechos financieros externos ya ocurridos.
- Corrección terminológica de `paid` como valor de `paymentStatus` y nunca de `orderStatus`.
- Actualización del estado de cierre documental a 0.15.4.

### 0.15.3 — 27 de agosto de 2026

**Corrección de convergencia entre pagos tardíos, inventario, ciclo de vida del pedido y límites promocionales. No incorpora funcionalidades nuevas.**

- Separación explícita entre pago confirmado e inventario comprometido al cancelar, reembolsar o reintegrar unidades.
- Transición controlada `expired → open` exclusivamente para una resolución tardía válida con todas sus precondiciones satisfechas.
- Adquisición de un nuevo uso promocional cuando un pago tardío se resuelve después de liberar el uso original, sin exceder el límite global ni reescribir el snapshot económico.
- Eliminación de sustituciones y soluciones abiertas fuera del alcance cuando no puede cumplirse íntegramente el pedido original.
- Correcciones de coherencia documental entre pagos tardíos, expiración, inventario, descuentos, preparación y devoluciones completas.

### 0.15.2 — 27 de agosto de 2026

**Cierre adversarial residual y eliminación de ambigüedades contractuales de la versión 0.15.1. No incorpora funcionalidades nuevas.**

- Precedencia de la confirmación tardía sobre el procesamiento normal cuando alguna reserva necesaria ya fue liberada.
- Representación explícita de `paymentStatus = unknown` en el resumen de pago del pedido y sus restricciones operativas.
- Revocación obligatoria de las credenciales públicas anteriores después de corregir el correo y reemitir el acceso.
- Endurecimiento del transporte y canje de credenciales públicas para evitar persistencia o propagación accidental durante la navegación.
- Actualización del estado de cierre documental a 0.15.2.

### 0.15.1 — 27 de agosto de 2026

**Cierre adversarial y endurecimiento contractual de la especificación existente. No incorpora funcionalidades nuevas.**

- Cierre de la retención acotada de inventario durante conciliación de pagos `unknown` y liberación determinista en su segundo vencimiento.
- Distinción entre auditoría *fail-closed* para acciones internas y procesamiento durable de hechos externos ya ocurridos.
- Cierre de la idempotencia posterior al checkout mediante origen único, registro técnico mínimo y retención explícita.
- Endurecimiento de la credencial pública del pedido: opacidad, entropía, vigencia, revocación, reemplazo, verificación no recuperable y protección contra exposición o fuerza bruta.
- Aclaración de que el panel sólo solicita transiciones comerciales autorizadas y nunca modifica estados arbitrariamente.
- Corrección de la tabla maestra, referencias cruzadas y decisiones pendientes obsoletas.

### 0.15.0 — 27 de agosto de 2026

- Definición de la auditoría transversal y su separación de las autoridades comerciales.
- Registro de acciones administrativas, hechos automáticos, actividad sensible, proveedores e intervenciones técnicas.
- Actores explícitos y conservación de identidad histórica para determinar responsabilidad.
- Modelo mínimo de eventos con correlación, diferencias relevantes, motivo y resultado.
- Acceso restringido, consulta por entidad y exportaciones temporales auditadas.
- Conservación predeterminada de cinco años sin eliminar registros comerciales.
- Persistencia obligatoria para acciones sensibles y rechazo seguro ante fallos.
- Protección mediante privilegios restringidos, respaldos, comprobaciones de integridad e idempotencia.
- Minimización de datos y separación respecto de analítica y registros técnicos.
- Exclusión de suplantación, edición manual, blockchain y conservación indefinida.

### 0.14.0 — 24 de agosto de 2026

- Definición de correo transaccional para compradores y alertas operativas para la administración.
- Separación estricta entre el resultado comercial y la entrega de comunicaciones.
- Registro durable, procesamiento asíncrono, deduplicación e idempotencia.
- Eventos obligatorios para pedidos, pagos, cumplimiento y reembolsos.
- Preferencias individuales y notificaciones de seguridad no desactivables.
- Validación preventiva y corrección auditada de correos incorrectos.
- Revocación de enlaces anteriores y reenvío como registros nuevos.
- Plantillas controladas y versionadas sin editor administrativo.
- Minimización de información sensible y uso del acceso seguro al pedido.
- Estados explícitos, reintentos limitados y conciliación de resultados inciertos.
- Verificación e idempotencia de respuestas del proveedor.
- Exclusión de marketing, mensajería libre, canales pagados y comunicaciones masivas.

### 0.13.0 — 23 de agosto de 2026

- Definición del panel como herramienta operativa sin acceso a la arquitectura.
- Incorporación de un dueño único y colaboradores con cuentas individuales.
- Permisos predefinidos por capacidad sin constructor de roles.
- Responsabilidad obligatoria de cada acción mediante identidad, sesión y resultado.
- Acceso por invitación, MFA obligatorio, sesiones opacas y reautenticación sensible.
- Resumen orientado a tareas pendientes y navegación limitada por permisos.
- Confirmaciones explícitas, estados de resultado y tratamiento de respuestas inciertas.
- Control de concurrencia y aplicación inmediata de cambios de permisos.
- Actividad visible, soporte identificado e invariantes de trazabilidad.
- Exclusión de cuentas compartidas, suplantación, SSO y administración multitienda.

### 0.12.0 — 23 de agosto de 2026

- Definición estructural de despacho, retiro o ambas modalidades por proyecto.
- Incorporación de zonas por región y comuna con tarifas fijas administrables.
- Un único punto de retiro gratuito por instalación.
- Cálculo autoritativo y congelación de la modalidad y tarifa en el pedido.
- Flujos separados de preparación para despacho y retiro.
- Seguimiento manual opcional y código de retiro de un solo uso.
- Correcciones acotadas de dirección sin alterar zona, tarifa ni modalidad.
- Incidentes de entrega separados de los estados comerciales.
- Permisos, auditoría e invariantes del módulo.
- Exclusión de múltiples paquetes, transportistas integrados, etiquetas y tarifas dinámicas.

### 0.11.0 — 23 de agosto de 2026

- Definición de descuentos aplicados mediante un único código por carrito y pedido.
- Incorporación de porcentajes y montos fijos sobre productos elegibles.
- Alcance por toda la tienda, productos seleccionados o colecciones dinámicas.
- Condiciones de subtotal, vigencia, habilitación y límite global de usos.
- Reservas de uso atómicas vinculadas al pedido y al estado del pago.
- Distribución determinista del descuento entre líneas elegibles.
- Protección de pedidos existentes frente al vencimiento o desactivación posterior.
- Permisos, validación pública, auditoría e invariantes del módulo.
- Exclusión de descuentos combinados, automáticos, personalizados, gratuitos o aplicados al despacho.

### 0.10.0 — 22 de agosto de 2026

- Definición de un único inventario por instalación y stock administrado por variante.
- Autoridades explícitas para stock físico, reservado y disponible.
- Movimientos físicos inmutables con compensación en vez de edición o eliminación.
- Recepción de unidades y corrección de conteo como operaciones administrativas controladas.
- Movimientos automáticos por venta, cancelación y devolución inspeccionada.
- Indicadores calculados de disponibilidad y umbral de stock bajo.
- Protección atómica e idempotente frente a concurrencia y reintentos.
- Consulta paginada, permisos separados e invariantes de trazabilidad.
- Exclusión de múltiples bodegas, importaciones masivas, sincronización externa y sobreventa.

### 0.9.0 — 22 de agosto de 2026

- Separación vinculante entre producto editorial y variante vendible.
- Variante interna obligatoria para productos sin opciones comerciales.
- Precio e inventario autoritativos por variante.
- Hasta tres tipos de opción y cien variantes activas por producto.
- Galería, colecciones planas, identificadores, SKU y estados de publicación.
- Reglas de edición que preservan la identidad y los pedidos históricos.
- Consulta pública básica con orden, paginación, búsqueda y filtros acotados.
- Exclusión de personalización libre, configuradores y automatizaciones de catálogo.

### 0.8.0 — 22 de agosto de 2026

- Separación explícita entre cancelación, reembolso, devolución y expiración.
- Incorporación de cancelaciones completas antes y después del pago.
- Reintegro seguro y auditable de reservas o stock físico.
- Reembolsos manuales para transferencia y conciliados con proveedor para pasarela.
- Devolución administrativa completa después del despacho o entrega.
- Exclusión inicial de operaciones parciales, cambios, crédito interno y contracargos.

### 0.7.0 — 19 de agosto de 2026

- Incorporación de la estructura inicial de pedidos.
- Separación entre estados de pedido, pago y preparación.
- Congelación de información comercial e identidad de las líneas compradas.
- Definición de transiciones para despacho y retiro.
- Acceso de invitados mediante credencial opaca, sin usar el número público como autorización.
- Prohibición de eliminar pedidos y exigencia de historial auditable.

### 0.6.0 — 19 de agosto de 2026

- Incorporación del flujo de pasarela de pago alojada o tokenizada por el proveedor.
- Definición de intentos, reintentos y un único intento activo por pedido.
- Autoridad exclusiva de webhook verificado o consulta servidor-servidor.
- Estado `unknown` para resultados inciertos y conciliación antes de decidir.
- Tratamiento de eventos repetidos, desordenados y confirmaciones tardías.
- Contrato independiente para adaptar proveedores sin exponerlos al panel administrativo.

### 0.5.0 — 19 de agosto de 2026

- Incorporación del flujo simple de transferencia bancaria.
- Confirmación manual basada en la comprobación directa del abono.
- Exclusión de carga de comprobantes, pagos parciales y sobrepagos como flujos normales.
- Congelación de las instrucciones bancarias en el pedido.
- Expiración automática y resolución controlada de transferencias tardías.
- Registro del principio de añadir complejidad únicamente cuando la operación la requiera.

### 0.4.0 — 18 de agosto de 2026

- Incorporación de la definición funcional general de reservas de inventario.
- Separación entre stock físico, reservado y disponible.
- Reserva atómica y todo-o-nada junto con la creación del pedido.
- Plazos predeterminados de 24 horas para transferencia y 30 minutos para pasarela.
- Prohibición de sobreventa, preventa, backorders y reservas parciales.
- Tratamiento seguro e idempotente de compromiso, liberación y pagos tardíos.

### 0.3.0 — 18 de agosto de 2026

- Incorporación de la estructura funcional general del checkout.
- Separación explícita entre carrito, checkout temporal y pedido durable.
- Definición de datos mínimos de contacto, despacho y retiro.
- Confirmación final con revalidación, atomicidad e idempotencia.
- Expiración del checkout tras 24 horas sin actividad.
- Registro de las decisiones que se resolverán junto con inventario y pagos.

### 0.2.0 — 18 de agosto de 2026

- Cierre de las cuatro decisiones pendientes del carrito.
- Límite predeterminado de 50 unidades por variante, editable por el dueño.
- Conversión del carrito al crear correctamente un pedido durable.
- Control optimista de versiones con actualización desde el estado vigente.
- Conservación de carritos expirados durante 90 días antes de su eliminación.

### 0.1.0 — 18 de agosto de 2026

- Creación de la especificación viva.
- Registro de la separación entre las bases nativa y Shopify.
- Registro del alcance y exclusiones iniciales.
- Formalización de la separación entre configuración estructural y operación administrativa.
- Incorporación de la primera definición aprobada del módulo carrito.
