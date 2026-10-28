import { textoObligatorio, numeroPositivo } from '../validaciones.js';

const COLECCION = 'productos';

// CREATE: el producto guarda el id de su categoría (LINKING)
export async function crearProducto(db, { nombre, descripcion, precio, imagen, categoriaId }) {
	nombre = textoObligatorio(nombre, 'El nombre del producto');
	descripcion = textoObligatorio(descripcion, 'La descripción');
	numeroPositivo(precio, 'El precio');

	// La categoría tiene que existir y estar activa (integridad del linking)
	const categoria = await db.collection('categorias').findOne({ _id: categoriaId, activo: true });
	if (!categoria) {
		throw new Error('La categoría indicada no existe o está dada de baja');
	}

	const documento = {
		nombre,
		descripcion,
		precio,
		imagen,
		categoriaId,
		activo: true,
		fechaCreacion: new Date()
	};
	const resultado = await db.collection(COLECCION).insertOne(documento);
	return resultado.insertedId;
}

// READ: solo productos activos
export async function listarProductos(db) {
	return await db.collection(COLECCION).find({ activo: true }).toArray();
}

// READ con categoría: usa el linking para traer los datos de la categoría
// ($lookup es el equivalente a un JOIN de SQL)
export async function listarProductosConCategoria(db) {
	return await db.collection(COLECCION).aggregate([
		{ $match: { activo: true } },
		{
			$lookup: {
				from: 'categorias',
				localField: 'categoriaId',
				foreignField: '_id',
				as: 'categoria'
			}
		},
		{ $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } }
	]).toArray();
}

// Busca un producto activo por id (null si no existe o está dado de baja)
export async function obtenerProducto(db, id) {
	return await db.collection(COLECCION).findOne({ _id: id, activo: true });
}

// UPDATE: cambia el precio de un producto activo
export async function actualizarPrecio(db, id, nuevoPrecio) {
	numeroPositivo(nuevoPrecio, 'El precio');

	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { precio: nuevoPrecio, fechaModificacion: new Date() } }
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