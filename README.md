# Entre Naciones 🇻🇪🇦🇷

Tienda online de comida y productos venezolanos.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase (Firestore, Auth, Storage) · Vercel

## Qué incluye

### Tienda (pensada primero para el celular)
- Catálogo con buscador instantáneo (ignora tildes), buscador fijo arriba, filtros por **categoría**, y orden por precio.
- Productos destacados, ofertas con % de descuento y aviso de "sin stock".
- Ficha de producto con galería deslizable, productos relacionados y datos estructurados para Google.
- Carrito que se guarda en el navegador.
- Checkout: **retiro en el local** o **envío por zonas** (con envío gratis desde un monto y pedido mínimo).
- El pedido se guarda en Firestore y se envía por **WhatsApp** al negocio con todo el detalle.
- Botón flotante de WhatsApp, sitemap, robots, manifest (se puede instalar como app).

### Panel admin (`/admin`)
- Ingreso con Google. Solo entran los emails cargados en la colección `admins`.
- **Productos:** alta, edición y baja. Fotos desde la cámara o la galería, comprimidas automáticamente a WebP antes de subir; se pueden reordenar (la primera es la portada).
- **Categorías:** con emoji, orden, ocultar/mostrar, y un botón para cargar categorías sugeridas.
- **Pedidos:** lista en tiempo real con estados (nuevo → confirmado → pagado → preparando → enviado → entregado) y botón para escribirle al cliente.
- **Ajustes:** WhatsApp, Instagram, dirección y horarios de retiro, zonas y costos de envío, envío gratis y pedido mínimo.

## Puesta en marcha

### 1. Firebase
1. Crear un proyecto en <https://console.firebase.google.com>.
2. **Firestore Database** → Crear base de datos (modo producción, región `southamerica-east1`).
3. **Storage** → Comenzar.
4. **Authentication** → Método de acceso → habilitar **Google**.
5. Configuración del proyecto → Tus apps → agregar app **Web** → copiar la config.
6. Publicar las reglas. Desde esta carpeta:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # elegir el proyecto
   firebase deploy --only firestore:rules,storage
   ```
   (o copiar y pegar `firestore.rules` y `storage.rules` en la consola).
7. **Crear el primer admin:** en Firestore, crear la colección `admins` con un documento cuyo **ID sea el email** (en minúsculas) de la cuenta de Google del administrador, por ejemplo `admins/duenio@gmail.com` (puede tener un campo cualquiera, ej. `nombre: "Dueño"`).

### 2. Local
```bash
cp .env.example .env.local   # completar con la config de Firebase
npm install
npm run dev
```
- Tienda: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>

Primeros pasos en el admin: **Ajustes** (cargar el WhatsApp) → **Categorías** (cargar las sugeridas) → **Productos**.

### 3. Deploy en Vercel
1. Importar el repo en <https://vercel.com/new>.
2. Cargar las mismas variables de `.env.example` (con `NEXT_PUBLIC_SITE_URL` = dominio final).
3. En Firebase → Authentication → Configuración → **Dominios autorizados**, agregar el dominio de Vercel.

## Modelo de datos (Firestore)

| Colección | Contenido |
|---|---|
| `productos` | `nombre`, `slug`, `descripcion`, `presentacion`, `precio`, `precioOferta`, `origen` (`VE`/`AR`/`OTRO`), `categoriaId`, `imagenes[]`, `stock` (`null` = sin control), `activo`, `destacado`, `etiquetas[]` |
| `categorias` | `nombre`, `slug`, `emoji`, `orden`, `activa` |
| `pedidos` | `codigo`, `items[]`, `subtotal`, `envio`, `total`, `entrega`, `zona`, `cliente{}`, `pago`, `estado`, `creado` |
| `configuracion/tienda` | WhatsApp, retiro, horarios, `zonas[]`, `envioGratisDesde`, `pedidoMinimo`, etc. |
| `admins/{email}` | Emails con acceso al panel |

Las fotos se guardan en Storage en `productos/{idProducto}/`. Al borrar un producto se borran también sus fotos.

La tienda se regenera como máximo cada **60 segundos** (ISR), así que los cambios del admin aparecen enseguida sin perder velocidad.

## Próximos pasos
- [ ] **Mercado Pago Checkout Pro**: preferencia de pago desde una ruta del servidor + webhook que marca el pedido como `pagado`.
- [ ] Descuento automático de stock al confirmar un pedido.
- [ ] Notificación push / email al entrar un pedido nuevo.
- [ ] Cupones de descuento.
- [ ] Dominio propio.
