import { MongoClient } from 'mongodb';

// Ambos valores se leen del archivo .env
const url = process.env.MONGODB_URL;
const NOMBRE_BD = process.env.DB_NAME;

const client = new MongoClient(url);

// Abre la conexión y devuelve la base de datos
export async function conectar() {
	await client.connect();
	return client.db(NOMBRE_BD);
}

// Cierra la conexión
export async function cerrar() {
	await client.close();
}