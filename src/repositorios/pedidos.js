import { obtenerProducto } from './productos.js';
import { enteroPositivo, valorPermitido } from '../validaciones.js';

const COLECCION = 'pedidos';

// Estados posibles y a cuáles se puede pasar desde cada uno
const TRANSICIONES = {
	pendiente: ['entregado', 'cancelado'],
	entregado: [],
	cancelado: []
};

// Arma un ítem para EMBEBER dentro del pedido.
// Copia el nombre y el precio actuales: es una "foto" del momento de la compra.
export async function crearItem(db, productoId, cantidad) {
	enteroPositivo(cantidad, 'La cantidad');

	const producto = await obtenerProducto(db, productoId);
	if (!producto) {
		throw new Error('El producto no existe o está dado de baja');
	}
	return {
		productoId,
		nombre: producto.nombre,
		precio: producto.precio,
		cantidad
	};
}

// CREATE: usuarioId (LINKING) + items adentro del pedido (EMBEDDING)
export async function crearPedido(db, usuarioId, items) {
	// El usuario tiene que existir y estar activo (integridad del linking)
	const usuario = await db.collection('usuarios').findOne({ _id: usuarioId, activo: true });
	if (!usuario) {
		throw new Error('El usuario indicado no existe o está dado de baja');
	}
	if (!Array.isArray(items) || items.length === 0) {
		throw new Error('El pedido debe tener al menos un ítem');
	}

	const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

	const documento = {
		usuarioId,
		items,
		total,
		estado: 'pendiente',
		activo: true,
		fechaCreacion: new Date()
	};
	const resultado = await db.collection(COLECCION).insertOne(documento);
	return resultado.insertedId;
}

// READ: solo pedidos activos
export async function listarPedidos(db) {
	return await db.collection(COLECCION).find({ activo: true }).toArray();
}

// UPDATE: solo permite transiciones de estado válidas
export async function actualizarEstado(db, id, nuevoEstado) {
	valorPermitido(nuevoEstado, Object.keys(TRANSICIONES), 'Estado');

	const pedido = await db.collection(COLECCION).findOne({ _id: id, activo: true });
	if (!pedido) {
		throw new Error('El pedido no existe o está dado de baja');
	}
	if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
		throw new Error(`No se puede pasar un pedido de "${pedido.estado}" a "${nuevoEstado}"`);
	}

	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { estado: nuevoEstado, fechaModificacion: new Date() } }
	);
	return resultado.modifiedCount > 0;
}

// DELETE (baja lógica)
export async function darDeBaja(db, id) {
	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { activo: false, fechaBaja: new Date() } }
	);
	return resultado.modifiedCount > 0;
}