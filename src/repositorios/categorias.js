import { textoObligatorio } from '../validaciones.js';

const COLECCION = 'categorias';

// Verifica que no exista otra categoría activa con el mismo nombre (sin distinguir mayúsculas)
async function existeNombre(db, nombre, idExcluido = null) {
	const filtro = { nombre, activo: true };
	if (idExcluido) filtro._id = { $ne: idExcluido };
	const existente = await db.collection(COLECCION)
		.findOne(filtro, { collation: { locale: 'es', strength: 2 } });
	return existente !== null;
}

// CREATE: toda categoría nace activa
export async function crearCategoria(db, nombre) {
	nombre = textoObligatorio(nombre, 'El nombre de la categoría');
	if (await existeNombre(db, nombre)) {
		throw new Error(`Ya existe una categoría activa llamada "${nombre}"`);
	}

	const documento = {
		nombre,
		activo: true,
		fechaCreacion: new Date()
	};
	const resultado = await db.collection(COLECCION).insertOne(documento);
	return resultado.insertedId;
}

// READ: devuelve solo las activas (respeta la baja lógica)
export async function listarCategorias(db) {
	return await db.collection(COLECCION).find({ activo: true }).toArray();
}

// UPDATE: cambia el nombre de una categoría activa
export async function actualizarNombre(db, id, nuevoNombre) {
	nuevoNombre = textoObligatorio(nuevoNombre, 'El nombre de la categoría');
	if (await existeNombre(db, nuevoNombre, id)) {
		throw new Error(`Ya existe una categoría activa llamada "${nuevoNombre}"`);
	}

	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { nombre: nuevoNombre, fechaModificacion: new Date() } }
	);
	return resultado.modifiedCount > 0;
}

// DELETE (baja lógica): NO borra, solo marca como inactiva.
// Regla de integridad: no se puede dar de baja una categoría con productos activos.
export async function darDeBaja(db, id) {
	const productosActivos = await db.collection('productos')
		.countDocuments({ categoriaId: id, activo: true });

	if (productosActivos > 0) {
		throw new Error(`No se puede dar de baja la categoría: tiene ${productosActivos} producto(s) activo(s)`);
	}

	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { activo: false, fechaBaja: new Date() } }
	);
	return resultado.modifiedCount > 0;
}