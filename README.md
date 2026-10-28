# TPI Bases de Datos II: Food Store

Modelado NoSQL, persistencia en MongoDB Atlas, CRUD con baja lógica y backup automatizado.

**Tecnicatura Universitaria en Programación a Distancia, UTN**

---
| **Integrantes** | Mauricio Guzmán y Franco Petrucci |
| **Materia** | Bases de Datos II |
| **Tecnologías** | Node.js, driver oficial `mongodb`, MongoDB Atlas (M0) |
---

## 1. Descripción del proyecto

Food Store es una tienda de comida (pizzas, hamburguesas, ensaladas, bebidas y postres). Su aplicación web se desarrolló en el primer parcial de Programación (TypeScript) y guardaba todo en el `localStorage` del navegador. Para este TPI se tomó ese negocio como dominio y se llevaron sus datos a **MongoDB Atlas**, operados desde un **backend en Node.js** que ejecuta el ciclo completo de CRUD desde la terminal.

Como se acordó con la docente, no se desarrolla frontend: el trabajo es el modelo de datos, la conexión a la nube, las operaciones sobre los datos y el respaldo.

## 2. Cumplimiento de la consigna

| Requisito | Cómo se resolvió |
|---|---|
| Definir el negocio y las colecciones | Food Store, base `foodstore` |
| Al menos 3 colecciones relacionadas | 4 colecciones: `categorias`, `productos`, `usuarios`, `pedidos` |
| Justificar embedding y linking | Sección 3.2 |
| Baja lógica (sin borrado físico) | Campo `activo`; no existe ningún `delete` en el código |
| Cluster M0 con Database Access y Network Access | `Cluster0` (FREE), usuario `prueba_tpi`, acceso `0.0.0.0/0` |
| CREATE, READ (sin dados de baja), UPDATE, DELETE lógico | Archivos de `src/repositorios/` |
| Script CLI con rutas relativas y carpeta con fecha | `scripts/backup.bat` crea `resguardos_tpi/AAAA-MM-DD` |
| `mongodump` conectado remotamente a Atlas | Incluido en `backup.bat` |
| Informe RTO/RPO | Sección 7 y informe PDF |

## 3. Modelo de datos

### 3.1 Colecciones

```
categorias  <----  productos

usuarios    <----  pedidos ---> items (embebidos dentro del pedido)
```

| Colección | Contenido | Relación |
|---|---|---|
| `categorias` | Pizzas, Hamburguesas, Ensaladas, Bebidas, Postres | Una categoría tiene muchos productos |
| `productos` | 13 productos del menú | Guarda `categoriaId` (linking) |
| `usuarios` | Clientes y administradores | Un usuario hace muchos pedidos |
| `pedidos` | Compras | Guarda `usuarioId` (linking) e `items` (embedding) |

Ejemplo de un documento de `pedidos`:

```json
{
  "usuarioId": "ObjectId (referencia a usuarios)",
  "items": [
    { "productoId": "ObjectId", "nombre": "Pizza Muzzarella", "precio": 11000, "cantidad": 2 },
    { "productoId": "ObjectId", "nombre": "Hamburguesa Simple", "precio": 7200, "cantidad": 1 }
  ],
  "total": 29200,
  "estado": "pendiente",
  "activo": true,
  "fechaCreacion": "Date"
}
```

### 3.2 Embedding vs. Linking

- **Linking** en `productos.categoriaId` y `pedidos.usuarioId`: una categoría tiene muchos productos y un usuario hace muchos pedidos. Copiar esos datos en cada documento los duplicaría y obligaría a actualizarlos en muchos lugares.
- **Embedding** en `pedidos.items`: los ítems se leen siempre junto con el pedido y guardan el **nombre y el precio del momento de la compra**, de modo que un cambio posterior de precio no altera los pedidos históricos.

### 3.3 Baja lógica

Todo documento nace con `activo: true`. "Eliminar" ejecuta un `updateOne` que pone `activo: false` y registra `fechaBaja`; el documento permanece en la base. Todas las lecturas filtran por `{ activo: true }`.

### 3.4 Validaciones e integridad

MongoDB no impone esquema ni claves foráneas, por lo que las reglas se aplican en el código:

- **Categorías:** nombre obligatorio y sin repetir. No se puede dar de baja una categoría con productos activos.
- **Productos:** precio mayor a 0, la categoría debe existir y estar activa.
- **Usuarios:** email válido y único, contraseña de al menos 6 caracteres, rol `client` o `admin`.
- **Pedidos:** el usuario debe existir y estar activo, al menos un ítem, cantidad entera mayor a 0, y solo transiciones de estado válidas (`pendiente` a `entregado` o `cancelado`).

## 4. Estructura del proyecto

```
.
├── .env                      Connection string y nombre de la base
├── README.md                    
├── package.json              Dependencias y configuración (type: module)
├── scripts/
│   └── backup.bat            Backup con mongodump
└── src/
    ├── conexion.js           Conexión a Atlas (conectar / cerrar)
    ├── validaciones.js       Funciones de validación reutilizables
    ├── main.js               Carga de datos y demostración del CRUD
    └── repositorios/
        ├── categorias.js     CRUD de categorías
        ├── productos.js      CRUD de productos (linking a categoría, $lookup)
        ├── usuarios.js       CRUD de usuarios
        └── pedidos.js        CRUD de pedidos (linking a usuario, items embebidos)
```

**Qué hace cada archivo**

- `conexion.js`: lee `MONGODB_URL` y `DB_NAME` del `.env`, crea el cliente y exporta `conectar()` y `cerrar()`. Es el único lugar donde se define a qué servidor se conecta el programa.
- `validaciones.js`: controles reutilizables (texto obligatorio, número positivo, entero positivo, email válido, valor permitido).
- `repositorios/*.js`: una colección por archivo, todos con el mismo patrón de cuatro operaciones (crear, listar activos, actualizar, dar de baja).
- `main.js`: comprueba que la base esté vacía, carga los datos reales, ejecuta el CRUD de las cuatro colecciones, prueba la regla de integridad, crea un pedido y verifica que diez operaciones inválidas sean rechazadas.
- `scripts/backup.bat`: crea `resguardos_tpi/<fecha>` con rutas relativas y ejecuta `mongodump` contra Atlas.

## 5. Cómo ejecutarlo

### Requisitos

- **Node.js 20.6 o superior** (se recomienda la 22 LTS), por la opción `--env-file`.
- **MongoDB Database Tools** (`mongodump` y `mongorestore`), solo para el backup.
- Conexión a internet. No hace falta instalar MongoDB: la base está en Atlas.

### Pasos

1. Descomprimir el proyecto y abrir una terminal en su carpeta.
2. Instalar las dependencias:
   ```
   npm install
   ```
3. Crear un archivo `.env` en la raíz, con estas dos líneas (sin comillas ni espacios alrededor del `=`). El connection string completo figura en el informe PDF:
   ```
   MONGODB_URL=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.v8uurep.mongodb.net/?appName=Cluster0
   DB_NAME=foodstore
   ```
4. Ejecutar:
   ```
   node --env-file=.env src/main.js
   ```

### Importante

- `main.js` **solo se ejecuta sobre una base vacía**. Si la base ya tiene datos, avisa y termina sin modificar nada. Para repetir la prueba, usar otro `DB_NAME` (por ejemplo `foodstore_prueba`) o eliminar las colecciones desde Atlas o Compass.
- En Atlas, **Network Access** debe permitir la IP desde la que se ejecuta (el cluster tiene habilitado `0.0.0.0/0`).

### Resultado esperado

```
Conectado a la base: foodstore
Categorías creadas: Pizzas, Hamburguesas, Ensaladas, Bebidas, Postres
Productos creados: 13
Usuarios creados: 3
...
Rechazado: baja de "Bebidas" (tiene productos activos) -> No se puede dar de baja la categoría: tiene 2 producto(s) activo(s)
...
Pedido ... | entregado | total $29200
...
Rechazado: pedido entregado que vuelve a pendiente -> No se puede pasar un pedido de "entregado" a "pendiente"
Pedidos activos después de la baja: 0
```

## 6. Backup con mongodump

Desde la raíz del proyecto:

```
cmd /c scripts\backup.bat
```

El script lee el connection string y el nombre de la base del `.env` (si no encuentra el string, lo pide por teclado), obtiene la fecha de hoy, crea `resguardos_tpi\AAAA-MM-DD` y ejecuta `mongodump` contra Atlas. Resultado:

```
resguardos_tpi/
└── 2026-10-27/
    └── foodstore/
        ├── categorias.bson, categorias.metadata.json
        ├── productos.bson,  productos.metadata.json
        ├── usuarios.bson,   usuarios.metadata.json
        └── pedidos.bson,    pedidos.metadata.json
```

**Restauración** (en PowerShell, sobre un MongoDB local y con otro nombre de base, para no afectar Atlas):

```
Measure-Command { mongorestore --uri="mongodb://localhost:27017" --nsFrom="foodstore.*" --nsTo="foodstore_restaurada.*" "resguardos_tpi\2026-10-27" }
```

## 7. RTO y RPO

| Indicador | Valor | Detalle |
|---|---|---|
| **RTO** | 1,59 segundos | Medido en la restauración de 22 documentos. Corresponde solo a ejecutar `mongorestore`; en un incidente real habría que sumar detección y decisión, y crecería con el tamaño de la base |
| **RPO** | Hasta 24 horas | El backup es manual y diario; se perderían los cambios posteriores al último respaldo |

El cluster M0 de Atlas muestra *Backups Inactive*, por lo que el respaldo se resuelve con `mongodump`. Una mejora posible es programar el script con el Programador de tareas de Windows para reducir el RPO.

## 8. Limitaciones conocidas

- Las contraseñas de `usuarios` se guardan en texto plano (en un sistema real se usaría un hash, por ejemplo bcrypt).
- El backup se ejecuta manualmente.
- El acceso desde cualquier IP (`0.0.0.0/0`) solo es aceptable en un contexto académico.
- La aplicación web original no está conectada a esta base.