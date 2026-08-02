*📢 PRESENTACIÓN DE WINNERS HUB CRM* 🚀
_Resumen del estado actual del desarrollo para el equipo_

---

*🔌 CONEXIONES REALES ACTIVAS (100% Integradas)*

1️⃣ *Shopify (API GraphQL)*
Se conecta directamente a la tienda en línea para:
• Sincronizar pedidos en tiempo real.
• Consultar estados de pago y preparación.
• *Acciones reales:* "Marcar como pagado" y solicitar la preparación de envíos (_Fulfillment_).

2️⃣ *Hoko Logística (API Colombia)*
Se conecta en tiempo real al agregador logístico Hoko para:
• *Productos y Stocks:* Consulta y sincronización real de inventarios por bodega.
• *Cotizador de Fletes:* Cálculo de tarifas en tiempo real según peso/tamaño del paquete con múltiples transportadoras.
• *Creación de Órdenes:* Generación de envíos y descarga de guías de despacho automáticamente.
• *Edición Activa:* Modificar datos del destinatario o cancelar despachos antes del envío.

3️⃣ *Supabase (Base de Datos & Seguridad)*
• Resguardo de información de clientes, pedidos y logs locales de forma segura.
• Sincronización automática de IDs de pedidos entre Shopify y Hoko.

4️⃣ *PWA (App Móvil Directa)*
• La app se puede instalar en celulares (Android e iOS) desde el navegador sin pasar por Google Play ni App Store.
• Cuenta con prevención de parpadeo de color al cargar la web y un diseño responsivo adaptado a teléfonos.

---

*🛠️ MÓDULOS OPERATIVOS (Funcionando con Datos Reales)*

✅ *Dashboard:* Indicadores clave de rendimiento (KPIs) con ventas y pedidos reales sincronizados de Shopify y Supabase.
✅ *Pedidos Shopify:* Buscador por cliente o número de orden, filtros avanzados y exportador de datos a Excel/CSV.
✅ *Órdenes Hoko:* Panel de despacho de mercancía, cotización de transportadoras, generación de guías y edición de datos de envío.
✅ *Stocks y Bodegas:* Visualización del inventario y productos reales guardados en Hoko.
✅ *Novedades de Logística:* Monitoreo y listado de novedades/incidencias con transportadoras de Hoko.

---

*🎨 MÓDULOS DE DISEÑO (Visuales / Simulación)*

⚠️ *Bandeja de Chats (Soporte):* Estructura visual interactiva multicanal (tipo Chatwoot). Actualmente usa datos ficticios en memoria. _(Nota: Esta será nuestra siguiente conexión real usando la API oficial de WhatsApp Cloud la próxima semana)._
⚠️ *Tablero de Tareas:* Interfaz tipo Kanban totalmente operativa pero sin persistencia en base de datos.
⚠️ *Flujo de Ventas (Pipeline):* Embudos y reportes gráficos con métricas ilustrativas.
