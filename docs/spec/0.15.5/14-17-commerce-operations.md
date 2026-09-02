# 14–17 — Catálogo, inventario, descuentos y cumplimiento

# 14. Catálogo, productos y variantes

**Estado: Aprobado**

## 14.1 Propósito y separación de responsabilidades

El catálogo representa productos físicos que el negocio puede publicar y vender.

- **Producto:** información editorial/comercial: nombre, descripción, imágenes, colecciones, URL y publicación.
- **Variante:** unidad vendible: combinación de opciones, SKU, precio, inventario, disponibilidad y límite de compra.

Toda línea de carrito y pedido referencia una variante. El producto por sí solo nunca es unidad vendible.

Todo producto posee al menos una variante interna. Si no hay elecciones visibles, existe una variante predeterminada que no necesita mostrarse como opción. No existen modelos transaccionales distintos para productos simples y productos con opciones.

## 14.2 Información del producto

Como mínimo:

- identificador interno inmutable;
- nombre;
- descripción;
- `slug` único dentro de la tienda;
- galería ordenada e imagen principal;
- colecciones asociadas;
- estado de publicación;
- posición manual en colección cuando corresponda;
- fechas de creación y modificación.

Nombre y descripción pertenecen al producto. La información que determina qué unidad exacta se compra pertenece a la variante.

## 14.3 Información de la variante

Como mínimo:

- identificador interno inmutable;
- valores de opción;
- SKU opcional;
- precio vigente;
- stock físico;
- stock reservado;
- stock disponible calculado;
- límite máximo de compra;
- estado activo/inactivo;
- imagen opcional;
- fechas de creación y modificación.

El límite predeterminado es **50 unidades por variante**. El dueño puede modificarlo dentro de las reglas del sistema; ninguna compra supera disponibilidad.

## 14.4 Opciones y combinaciones

El dueño puede definir nombres de opción adecuados al negocio: talla, color, material, formato, capacidad u otros equivalentes.

Primera versión:

- hasta tres tipos de opción por producto;
- hasta cien variantes activas por producto;
- cada combinación activa es única dentro del producto;
- no se generan combinaciones inválidas duplicadas.

## 14.5 SKU e identidad comercial

- El SKU es opcional.
- Cuando existe, es único dentro de la instalación.
- La identidad interna de una variante es estable e inmutable.
- Una variante que ya aparece en historial comercial no se reutiliza para representar otra combinación o producto.
- Cambiar opciones de manera que altere la identidad de la unidad vendida requiere crear una variante nueva y desactivar/archivar la anterior.

## 14.6 Precio

El precio autoritativo pertenece a la variante y se obtiene siempre del servidor.

Cambiar el precio modifica compras futuras, nunca pedidos históricos. Un carrito sólo muestra estimaciones vigentes y el checkout vuelve a validar antes de crear pedido.

## 14.7 Publicación y archivo

El producto posee un estado de publicación administrable. Archivar/despublicar impide nuevas compras, pero no elimina historial ni altera pedidos existentes.

Una variante inactiva no puede incorporarse a nuevas compras. Su identidad e historial permanecen disponibles para referencias comerciales previas.

## 14.8 Imágenes y colecciones

- La galería pertenece al producto y puede ordenarse.
- Una variante puede tener imagen específica opcional.
- Las colecciones iniciales son planas; no se requiere jerarquía arbitraria.
- Un producto puede pertenecer a varias colecciones y tener orden manual cuando corresponda.

## 14.9 Consulta pública

La API pública puede ofrecer:

- productos publicados;
- variantes activas vendibles;
- paginación;
- orden controlado;
- búsqueda acotada;
- filtros simples por colecciones/opciones habilitadas.

Nunca expone campos administrativos innecesarios.

## 14.10 Edición e historial

Editar nombre, descripción, imágenes, precio o estado no reescribe snapshots de pedidos existentes.

No se eliminan físicamente entidades con historia comercial para simular que nunca existieron.

## 14.11 Exclusiones iniciales

No se incluyen:

- personalización libre del producto;
- configuradores visuales complejos;
- generación automática de opciones mediante IA;
- importación masiva como requisito inicial;
- sincronización con catálogos externos;
- reglas de precio dinámico;
- múltiples monedas por variante.

## 14.12 Invariantes

1. Toda unidad comprable es una variante.
2. Todo producto posee al menos una variante interna.
3. El servidor es autoridad sobre precio y vendibilidad.
4. SKU es único cuando existe.
5. Una combinación activa no se duplica dentro del mismo producto.
6. La identidad de una variante usada comercialmente no se recicla.
7. Editar catálogo nunca reescribe pedidos históricos.
8. Archivar o desactivar impide operaciones futuras, pero conserva historia.
9. Stock disponible es calculado; no es un valor independiente editable.
10. Los límites de compra nunca autorizan vender más que la disponibilidad actual.

---

# 15. Inventario

**Estado: Aprobado — movimientos, ajustes y concurrencia**

## 15.1 Modelo inicial

Cada instalación utiliza **un único inventario**. No existen bodegas, lotes ni ubicaciones múltiples en la primera versión.

El inventario se administra por variante.

Autoridades:

- `stockFisico`: unidades realmente disponibles en el inventario del negocio antes de descontar reservas;
- `stockReservado`: suma de reservas `active` vigentes;
- `stockDisponible = stockFisico - stockReservado`.

`stockDisponible` siempre es calculado y nunca se edita directamente.

## 15.2 Movimientos físicos

Toda variación de stock físico se representa mediante movimiento inmutable.

Movimientos relevantes incluyen:

- recepción/entrada de unidades;
- salida por venta al comprometer inventario;
- compensación por cancelación cuando existió salida previa;
- reintegro después de devolución física inspeccionada;
- corrección administrativa de conteo.

Un movimiento registrado no se edita ni elimina para cambiar historia. Los errores se corrigen mediante movimiento compensatorio.

## 15.3 Reservado

El stock reservado se deriva de reservas `active` y sólo cambia mediante las transiciones del módulo de reservas.

- crear reserva aumenta reservado;
- `active → committed` reduce reservado y produce la salida física autoritativa;
- `active → released` reduce reservado sin incrementar stock físico.

`paymentStatus = paid` no es evidencia de movimiento de inventario.

## 15.4 Recepción de unidades

Una persona con permiso de gestión de inventario puede registrar entrada física indicando al menos variante, cantidad y motivo/referencia operativa necesaria.

La entrada es idempotente respecto de su operación de origen cuando corresponda y queda auditada.

## 15.5 Corrección de conteo

La corrección administrativa representa una observación física nueva, no una edición del historial.

Requiere:

- permiso específico;
- motivo obligatorio;
- cantidad observada o delta controlado;
- registro de valor anterior/nuevo;
- auditoría.

Una corrección no puede establecer `stockFisico` por debajo de las unidades actualmente reservadas. Si existe conflicto con reservas, primero debe resolverse por el flujo comercial autorizado; el panel no puede fabricar disponibilidad.

## 15.6 Venta y compromiso

La salida por venta ocurre únicamente al comprometer válidamente un conjunto de reservas.

- todas las líneas se comprometen o ninguna;
- una misma reserva produce una sola salida;
- un evento de pago repetido no duplica movimiento;
- el stock físico nunca queda negativo.

## 15.7 Cancelación y devolución

Restaurar stock físico exige evidencia de que esas unidades fueron descontadas previamente para ese pedido.

- reserva `active` liberada: no incrementa físico;
- reserva `committed`/salida autoritativa: puede compensarse exactamente una vez si el flujo lo permite;
- devolución después de entrega: stock sólo vuelve tras recepción e inspección física;
- unidad no vendible se registra mediante ajuste y no vuelve ficticiamente a disponibilidad.

## 15.8 Stock bajo

La instalación puede tener un umbral operativo simple para identificar variantes con stock bajo o agotado. Es una alerta calculada, no una reserva ni una regla que modifique inventario.

## 15.9 Consultas administrativas

Las listas de inventario son paginadas y pueden filtrarse por producto, variante, SKU, disponibilidad o estado dentro de límites razonables.

Consultar y gestionar inventario son capacidades separables.

## 15.10 Concurrencia

Las operaciones que cambian inventario utilizan comprobaciones atómicas/condicionales que impiden:

- vender la misma unidad dos veces;
- comprometer más de lo disponible;
- aplicar dos veces el mismo movimiento idempotente;
- sobrescribir un conteo concurrente con una versión antigua.

## 15.11 Exclusiones iniciales

No se incluyen:

- múltiples bodegas;
- lotes/series;
- proveedores y órdenes de compra;
- importaciones masivas como flujo obligatorio;
- sincronización externa de stock;
- preventa;
- backorders;
- stock negativo;
- sobreventa intencional.

## 15.12 Invariantes

1. Existe un inventario por instalación.
2. Toda unidad física pertenece a una variante.
3. `stockDisponible` es calculado.
4. El stock disponible nunca es negativo.
5. Los movimientos físicos son inmutables; se corrigen mediante compensación.
6. Una reserva liberada no incrementa stock físico.
7. Una salida por venta requiere compromiso de reserva.
8. Una salida física se compensa como máximo una vez.
9. `paid` no es evidencia de salida física.
10. Un ajuste nunca reduce físico por debajo del reservado vigente.
11. Todas las mutaciones son auditables.
12. Reintentos no duplican movimientos.

---

# 16. Descuentos

**Estado: Aprobado — códigos simples con uso controlado**

## 16.1 Alcance

La primera versión soporta **un código promocional por pedido** dentro de tipos simples configurados por el motor.

Los descuentos pueden representar, según los tipos habilitados:

- monto fijo;
- porcentaje;
- alcance a productos/variantes/colecciones elegibles;
- subtotal mínimo;
- vigencia temporal;
- límite global de usos.

El panel no puede inventar tipos nuevos de descuento ni alterar el motor de cálculo.

## 16.2 Autoridad

El servidor resuelve código, vigencia, elegibilidad, capacidad de uso y monto aplicado.

El navegador nunca envía como autoridad el monto descontado.

## 16.3 Aplicación

- El código se ingresa explícitamente.
- No existe listado público de códigos.
- El código se revalida cada vez que cambia el carrito y antes de crear el pedido.
- Si deja de ser válido antes del pedido, se excluye del cálculo, se informa el conflicto y la persona debe revisar nuevamente el total.
- El descuento sólo afecta líneas elegibles.
- El despacho no recibe descuento en esta versión.
- Ningún descuento produce subtotal/total negativo ni pedido de total cero.

## 16.4 Snapshot

Cuando el código era válido al crear correctamente el pedido:

- código, condiciones y distribución quedan congelados en el snapshot;
- el uso queda reservado;
- vencer/deshabilitar/agotar la campaña después no modifica el pedido existente;
- detener un pedido pendiente requiere cancelarlo explícitamente.

## 16.5 Uso promocional

El uso posee identidad y ciclo de vida propios:

- `active`: cupo reservado por un pedido todavía pendiente;
- `committed`: uso consumido por pago/aceptación válida;
- `released`: uso liberado; terminal.

Crear pedido reserva uso de manera atómica cuando existe límite global. Confirmar pago ordinario compromete el uso. Cancelar/expirar antes del pago puede liberarlo.

Un uso `released` nunca se reactiva ni pasa a `committed`.

## 16.6 Pago tardío

Si el uso original fue liberado antes de descubrir un pago tardío, la resolución tardía debe adquirir **nuevo cupo actual**.

- No reutiliza el registro `released`.
- Crea un registro nuevo asociado al mismo pedido.
- El límite global sigue aplicando.
- Si no existe capacidad, no se reescribe el snapshot ni se elimina el descuento de la compra para forzar cumplimiento.
- La resolución termina en devolución completa.

Liberar inventario por un `paymentStatus = unknown` no libera automáticamente un uso promocional que continúe `active`; cada dominio mantiene su autoridad.

## 16.7 Límites

En todo momento, usos `active + committed` no superan el límite global configurado.

Reservar, comprometer y liberar son operaciones atómicas e idempotentes.

## 16.8 Pedidos cancelados o reembolsados

- Cancelar antes del pago libera el uso activo.
- Cancelar o reembolsar después de pago no recupera automáticamente el uso comprometido.

## 16.9 Edición de campañas

Una campaña que ya tiene historia comercial no cambia de identidad ni de condiciones de manera que reinterprete pedidos anteriores. Deshabilitar/archivar afecta nuevas compras, no snapshots existentes.

## 16.10 Revalidación y pedidos existentes

Si un código caduca, se deshabilita, agota o incumple condiciones antes de crear pedido:

- se excluye;
- el carrito/checkout muestra conflicto;
- se informa motivo comprensible;
- la persona revisa el nuevo total antes de confirmar.

Si era válido al crear el pedido, el descuento permanece congelado y el pedido puede completar el pago dentro de su vigencia operativa aunque la campaña cambie posteriormente.

## 16.11 Permisos administrativos

Se distinguen:

- **Consultar descuentos:** configuración, vigencia, usos y pedidos relacionados.
- **Gestionar descuentos:** crear, modificar dentro de reglas permitidas, habilitar, deshabilitar y archivar.

## 16.12 Validación pública y seguridad

- No se publica una lista de códigos.
- Se limita frecuencia de intentos.
- Código y condiciones se resuelven en servidor.
- Código inexistente/deshabilitado puede devolver mensaje genérico.
- Un código reconocido puede explicar condiciones incumplidas sin exponer configuración administrativa innecesaria.

## 16.13 Auditoría

Se registran creación, modificaciones permitidas, habilitación/deshabilitación/archivo, reserva de uso, compromiso, liberación, pedidos y montos relacionados.

## 16.14 Exclusiones iniciales

No se incluyen:

- combinación de códigos;
- descuentos automáticos;
- reglas por identidad/historial de cliente;
- límites por correo/dispositivo/dirección;
- códigos individuales masivos;
- fidelización/referidos;
- tarjetas regalo/crédito interno;
- promociones por cantidad, paquetes o regalos;
- descuentos del 100 % o pedidos gratuitos;
- descuentos sobre despacho.

## 16.15 Invariantes

1. Un pedido utiliza como máximo un código.
2. El servidor es autoridad del cálculo.
3. El descuento sólo afecta líneas elegibles.
4. Despacho no recibe descuento.
5. No existen valores negativos.
6. No se crean pedidos de total cero.
7. Toda modificación de carrito recalcula.
8. El descuento se revalida antes de crear pedido.
9. El pedido conserva código, condiciones y distribución confirmadas.
10. La suma por líneas coincide con descuento total.
11. `active + committed` nunca supera límite global.
12. Un pedido tiene como máximo un uso `active` o `committed` del mismo código; un `released` histórico no se reutiliza.
13. Reservar, comprometer y liberar son atómicos e idempotentes.
14. Cancelar antes de pago libera uso.
15. Cancelar/reembolsar después de pago no recupera uso automáticamente.
16. Una campaña usada no cambia identidad ni reinterpretación histórica.
17. Vencer/deshabilitar/archivar no modifica pedidos existentes.
18. Descuentos y usos permanecen en historial.
19. `released` nunca vuelve a `active` ni pasa a `committed`.
20. Resolución tardía nunca excede límite global.
21. El snapshot no se recalcula para resolver falta de cupo promocional.
22. Si no puede adquirirse nuevo uso requerido, corresponde devolución completa y no cumplimiento.
23. Liberar inventario por `unknown` no libera por sí solo uso promocional todavía `active`.

---

# 17. Despacho y retiro

**Estado: Aprobado**

## 17.1 Propósito y configuración estructural

El módulo determina cómo se entrega físicamente un pedido pagado, cómo se calcula costo y cómo se registra cumplimiento sin depender inicialmente de integraciones externas.

Durante implementación se fija si la tienda ofrece:

- sólo despacho;
- sólo retiro;
- ambas modalidades.

El dueño no instala transportistas ni habilita modalidades no contratadas desde el panel. Sí puede administrar datos operativos autorizados como tarifas, zonas, horarios e instrucciones.

## 17.2 Una modalidad por pedido

Cada pedido utiliza una única modalidad para todas sus líneas.

No se permite inicialmente:

- dividir pedido entre despacho/retiro;
- múltiples direcciones;
- despachos parciales;
- múltiples paquetes;
- restricciones de entrega distintas por producto/variante.

Productos que requieran modalidades incompatibles deben comprarse en pedidos separados.

## 17.3 Zonas de despacho y tarifas

Cada zona contiene:

- ID interno;
- nombre;
- regiones/comunas incluidas;
- tarifa fija;
- activo/inactivo;
- plazo estimado opcional;
- indicaciones opcionales.

Una comuna pertenece como máximo a una zona activa. Si no pertenece a ninguna, despacho no está disponible.

El dueño puede cambiar tarifas y activar/desactivar zonas, pero no cambiar el criterio geográfico, conectar proveedores ni crear fórmulas por peso, volumen, distancia o dimensiones desde el panel.

Tarifa >= 0. Una tarifa cero representa despacho gratuito sin utilizar descuento promocional.

## 17.4 Dirección y elegibilidad

Despacho solicita nombre receptor, región, comuna, calle, número, complemento opcional e indicaciones opcionales.

Región/comuna provienen de valores controlados. El servidor utiliza identificadores normalizados para zona/tarifa y no confía en comuna escrita libremente.

No existe inicialmente geocodificación, validación postal externa, kilómetros, mapa ni autocorrección de direcciones.

## 17.5 Punto de retiro

La primera versión utiliza como máximo un punto de retiro operativo por instalación cuando esa modalidad está habilitada.

El punto puede incluir nombre, dirección, horario e instrucciones. Los datos aplicables al pedido quedan congelados para que cambios posteriores no reescriban información entregada al comprador.

## 17.6 Costo y snapshot

El servidor calcula la tarifa antes de crear el pedido. La modalidad, zona/punto y costo confirmados quedan en el snapshot.

Cambiar tarifas posteriormente sólo afecta pedidos futuros.

## 17.7 Preparación

El cumplimiento físico sólo avanza cuando el pedido cumple las precondiciones generales: pedido abierto, pago confirmado e inventario íntegramente comprometido.

Estados y acciones de preparación se registran mediante transiciones explícitas; el panel no escribe estados arbitrarios.

## 17.8 Despacho

Registrar despacho requiere permiso y un estado de preparación compatible. Puede conservarse referencia operativa/transportista manual cuando el proyecto lo necesite, sin convertirla en integración externa automática.

## 17.9 Retiro

El retiro se confirma mediante el mecanismo de verificación definido por el proyecto. Confirmar retiro sin la evidencia/código normal requiere permiso reforzado, confirmación explícita, motivo y auditoría.

Las credenciales de retiro no se envían como secretos completos por correo cuando ello pueda permitir retiro no autorizado.

## 17.10 Incidentes

Problemas de entrega pueden registrarse y resolverse manualmente con motivo y trazabilidad. Marcar una alerta como vista no modifica por sí solo el pedido ni resuelve el incidente.

## 17.11 Exclusiones iniciales

No se incluyen:

- integraciones automáticas con transportistas;
- cotización en tiempo real;
- etiquetas automáticas;
- tracking externo como autoridad del pedido;
- múltiples puntos dinámicos de retiro;
- paquetes parciales;
- despacho internacional;
- fórmulas por peso/volumen/distancia.

## 17.12 Invariantes

1. Un pedido tiene una sola modalidad.
2. El servidor determina elegibilidad y costo.
3. El costo confirmado queda congelado en el pedido.
4. Cambios de tarifa/zona no reescriben pedidos existentes.
5. No se marca cumplimiento físico sin precondiciones comerciales válidas.
6. Las transiciones de entrega son auditables e idempotentes cuando corresponda.
7. Un proveedor/logística externo futuro no reemplaza la autoridad del pedido.
8. Resolver un incidente requiere acción explícita; una alerta visual no altera entidades comerciales.