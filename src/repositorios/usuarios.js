import { emailValido, textoObligatorio, valorPermitido } from '../validaciones.js';

const COLECCION = 'usuarios';
const ROLES = ['client', 'admin'];

// CREATE
export async function crearUsuario(db, email, password, rol) {
	email = emailValido(email);
	textoObligatorio(password, 'La contraseña');
	if (password.length < 6) {
		throw new Error('La contraseña debe tener al menos 6 caracteres');
	}
	valorPermitido(rol, ROLES, 'Rol');

	// El email no puede repetirse entre usuarios activos
	const existente = await db.collection(COLECCION).findOne({ email, activo: true });
	if (existente) {
		throw new Error(`Ya existe un usuario activo con el email ${email}`);
	}

	const documento = {
		email,
		password, // Limitación del TP: en un sistema real se guardaría hasheada (bcrypt)
		rol,
		activo: true,
		fechaCreacion: new Date()
	};
	const resultado = await db.collection(COLECCION).insertOne(documento);
	return resultado.insertedId;
}

// READ: solo usuarios activos
export async function listarUsuarios(db) {
	return await db.collection(COLECCION).find({ activo: true }).toArray();
}

// UPDATE: cambia el rol de un usuario activo
export async function actualizarRol(db, id, nuevoRol) {
	valorPermitido(nuevoRol, ROLES, 'Rol');

	const resultado = await db.collection(COLECCION).updateOne(
		{ _id: id, activo: true },
		{ $set: { rol: nuevoRol, fechaModificacion: new Date() } }
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