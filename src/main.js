import { conectar, cerrar } from './conexion.js';
import * as Categorias from './repositorios/categorias.js';
import * as Productos from './repositorios/productos.js';
import * as Usuarios from './repositorios/usuarios.js';
import * as Pedidos from './repositorios/pedidos.js';

// Datos tomados del data.ts de la Food Store (parcial 1)
const PRODUCTOS = [
	{ nombre: 'Pizza Muzzarella', categoria: 'Pizzas', descripcion: 'Pizza con salsa de tomate y queso muzzarella', precio: 11000, imagen: 'https://images.unsplash.com/photo-1732223229355-95a1433404bf?q=80&w=687&auto=format&fit=crop' },
	{ nombre: 'Pizza Fugazzeta', categoria: 'Pizzas', descripcion: 'Pizza rellena de muzzarella con doble capa de cebolla salteada', precio: 13500, imagen: 'https://i.pinimg.com/1200x/ec/69/f0/ec69f0f3d433901134ce9991725d7e7e.jpg' },
	{ nombre: 'Pizza Caprese', categoria: 'Pizzas', descripcion: 'Muzzarella, tomate fresco en rodajas, albahaca y rúcula', precio: 14200, imagen: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=400' },
	{ nombre: 'Pizza Especial', categoria: 'Pizzas', descripcion: 'Jamón, morrones, aceitunas y huevo duro sobre base de muzzarella', precio: 15800, imagen: 'https://i.pinimg.com/1200x/bc/29/bc/bc29bcfc411be5eab871866eca86d791.jpg' },
	{ nombre: 'Hamburguesa Simple', categoria: 'Hamburguesas', descripcion: 'Medallón de carne, cheddar, lechuga, tomate y mayonesa', precio: 7200, imagen: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400' },
	{ nombre: 'Hamburguesa Doble', categoria: 'Hamburguesas', descripcion: 'Doble medallón de carne, doble cheddar, bacon y cebolla crispy', precio: 10500, imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
	{ nombre: 'Hamburguesa Triple', categoria: 'Hamburguesas', descripcion: 'Triple medallón de carne, triple cheddar, bacon, cebolla y salsa especial', precio: 13800, imagen: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
	{ nombre: 'Ensalada César', categoria: 'Ensaladas', descripcion: 'Lechuga romana, crutones, parmesano, pollo grillado y aderezo césar', precio: 8900, imagen: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400' },
	{ nombre: 'Ensalada Caprese', categoria: 'Ensaladas', descripcion: 'Tomate, muzzarella fresca, albahaca y aceite de oliva', precio: 7600, imagen: 'https://i.pinimg.com/736x/d4/eb/a3/d4eba3394bc5067767296d932125760d.jpg' },
	{ nombre: 'Ensalada Mixta', categoria: 'Ensaladas', descripcion: 'Lechuga, tomate, zanahoria rallada, huevo duro y choclo', precio: 6800, imagen: 'https://i.pinimg.com/1200x/7a/5b/74/7a5b74bf75a8b785050dead5c314b777.jpg' },
	{ nombre: 'Gaseosa 500ml', categoria: 'Bebidas', descripcion: 'Gaseosa línea Coca-Cola, botella de 500ml', precio: 2500, imagen: 'gaseosa-500ml.jpg' },
	{ nombre: 'Agua Mineral 500ml', categoria: 'Bebidas', descripcion: 'Agua mineral sin gas, botella personal de 500ml', precio: 1800, imagen: 'agua-mineral-500ml.webp' },
	{ nombre: 'Porción de Flan Casero', categoria: 'Postres', descripcion: 'Flan casero con dulce de leche y crema', precio: 4800, imagen: 'https://i.pinimg.com/1200x/c9/ac/9c/c9ac9cb3fa13b74e3d0f46a2c264af2f.jpg' }
];

function titulo(texto) {
	console.log(`\n=== ${texto} ===`);
}

// Ejecuta algo que debería fallar y muestra el rechazo
async function intentar(descripcion, funcion) {
	try {
		await funcion();
		console.log(`[NO FUE RECHAZADO] ${descripcion}`);
	} catch (error) {
		console.log(`Rechazado: ${descripcion} -> ${error.message}`);
	}
}

try {
	const db = await conectar();
	console.log('Conectado a la base:', db.databaseName);

	// Este programa se ejecuta una sola vez sobre una base vacía
	if (await db.collection('categorias').countDocuments() > 0) {
		console.log('La base ya tiene datos. Este programa se ejecuta una sola vez sobre una base vacía.');
		await cerrar();
		process.exit(0);
	}

	// ========== PARTE 1: CARGA DE DATOS REALES ==========
	titulo('CARGA DE DATOS DE LA FOOD STORE');

	// Categorías: se obtienen sin repetir a partir de los productos
	const nombresCategorias = [...new Set(PRODUCTOS.map(p => p.categoria))];
	const idsCategorias = {};
	for (const nombre of nombresCategorias) {
		idsCategorias[nombre] = await Categorias.crearCategoria(db, nombre);
	}
	console.log('Categorías creadas:', nombresCategorias.join(', '));

	// Productos: cada uno guarda el id de su categoría (linking)
	const idsProductos = {};
	for (const p of PRODUCTOS) {
		idsProductos[p.nombre] = await Productos.crearProducto(db, {
			nombre: p.nombre,
			descripcion: p.descripcion,
			precio: p.precio,
			imagen: p.imagen,
			categoriaId: idsCategorias[p.categoria]
		});
	}
	console.log(`Productos creados: ${PRODUCTOS.length}`);

	// Usuarios
	await Usuarios.crearUsuario(db, 'admin@foodstore.com', 'admin123', 'admin');
	const idCliente = await Usuarios.crearUsuario(db, 'cliente@mail.com', 'cliente123', 'client');
	const idCliente2 = await Usuarios.crearUsuario(db, 'cliente2@mail.com', 'cliente456', 'client');
	console.log('Usuarios creados: 3');

	// ========== PARTE 2: DEMO DEL CRUD (sobre los datos reales) ==========

	// ---------- CATEGORIAS ----------
	titulo('CATEGORIAS: UPDATE y READ');
	await Categorias.actualizarNombre(db, idsCategorias['Postres'], 'Postres Caseros');
	console.log('Categorías activas:', (await Categorias.listarCategorias(db)).map(c => c.nombre));

	// ---------- PRODUCTOS ----------
	titulo('PRODUCTOS: UPDATE, baja lógica y READ con categoría');
	await Productos.actualizarPrecio(db, idsProductos['Gaseosa 500ml'], 2800);
	await Productos.darDeBaja(db, idsProductos['Porción de Flan Casero']);

	for (const p of await Productos.listarProductosConCategoria(db)) {
		console.log(`${p.nombre} | $${p.precio} | categoría: ${p.categoria?.nombre}`);
	}

	// ---------- REGLA DE INTEGRIDAD ----------
	titulo('REGLA DE INTEGRIDAD');
	await intentar('baja de "Bebidas" (tiene productos activos)', () => Categorias.darDeBaja(db, idsCategorias['Bebidas']));
	// Postres Caseros ya no tiene productos activos (el flan está dado de baja), así que sí se puede
	console.log('Baja de "Postres Caseros":', await Categorias.darDeBaja(db, idsCategorias['Postres']));

	// ---------- USUARIOS ----------
	titulo('USUARIOS: UPDATE, baja lógica y READ');
	await Usuarios.actualizarRol(db, idCliente2, 'admin');
	await Usuarios.darDeBaja(db, idCliente2);
	console.log('Usuarios activos:', (await Usuarios.listarUsuarios(db)).map(u => `${u.email} (${u.rol})`));

	// ---------- PEDIDOS ----------
	titulo('PEDIDOS (linking a usuario + items embebidos)');
	const items = [
		await Pedidos.crearItem(db, idsProductos['Pizza Muzzarella'], 2),
		await Pedidos.crearItem(db, idsProductos['Hamburguesa Simple'], 1)
	];
	const idPedido = await Pedidos.crearPedido(db, idCliente, items);
	await Pedidos.actualizarEstado(db, idPedido, 'entregado');
	for (const p of await Pedidos.listarPedidos(db)) {
		console.log(`Pedido ${p._id} | ${p.estado} | total $${p.total}`);
		p.items.forEach(i => console.log(`    ${i.cantidad} x ${i.nombre} ($${i.precio})`));
	}

	// ---------- VALIDACIONES ----------
	titulo('VALIDACIONES (todas deben ser rechazadas)');
	await intentar('categoría sin nombre', () => Categorias.crearCategoria(db, '   '));
	await intentar('categoría repetida', () => Categorias.crearCategoria(db, 'hamburguesas'));
	await intentar('producto con precio negativo', () => Productos.crearProducto(db, {
		nombre: 'Prueba', descripcion: 'Prueba', precio: -5, imagen: 'x.jpg', categoriaId: idsCategorias['Pizzas']
	}));
	await intentar('producto con categoría dada de baja', () => Productos.crearProducto(db, {
		nombre: 'Prueba', descripcion: 'Prueba', precio: 100, imagen: 'x.jpg', categoriaId: idsCategorias['Postres']
	}));
	await intentar('usuario con email inválido', () => Usuarios.crearUsuario(db, 'no-es-un-mail', '123456', 'client'));
	await intentar('usuario con email repetido', () => Usuarios.crearUsuario(db, 'cliente@mail.com', '123456', 'client'));
	await intentar('usuario con rol inexistente', () => Usuarios.crearUsuario(db, 'otro@mail.com', '123456', 'superadmin'));
	await intentar('ítem con cantidad 0', () => Pedidos.crearItem(db, idsProductos['Pizza Muzzarella'], 0));
	await intentar('pedido sin ítems', () => Pedidos.crearPedido(db, idCliente, []));
	await intentar('pedido entregado que vuelve a pendiente', () => Pedidos.actualizarEstado(db, idPedido, 'pendiente'));

	// ---------- BAJA LÓGICA DEL PEDIDO ----------
	titulo('BAJA LÓGICA DEL PEDIDO');
	await Pedidos.darDeBaja(db, idPedido);
	console.log('Pedidos activos después de la baja:', (await Pedidos.listarPedidos(db)).length);
} catch (error) {
	console.error('Error:', error.message);
} finally {
	await cerrar();
}