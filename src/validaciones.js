// Texto obligatorio: devuelve el texto sin espacios sobrantes
export function textoObligatorio(valor, campo) {
	if (typeof valor !== 'string' || valor.trim() === '') {
		throw new Error(`${campo} es obligatorio`);
	}
	return valor.trim();
}

// Número mayor a 0
export function numeroPositivo(valor, campo) {
	if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
		throw new Error(`${campo} debe ser un número mayor a 0`);
	}
	return valor;
}

// Entero mayor a 0 (para cantidades)
export function enteroPositivo(valor, campo) {
	if (!Number.isInteger(valor) || valor <= 0) {
		throw new Error(`${campo} debe ser un número entero mayor a 0`);
	}
	return valor;
}

// Formato básico de email
export function emailValido(email) {
	const texto = textoObligatorio(email, 'El email').toLowerCase();
	const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!formato.test(texto)) {
		throw new Error('El email no tiene un formato válido');
	}
	return texto;
}

// El valor tiene que estar dentro de una lista permitida
export function valorPermitido(valor, permitidos, campo) {
	if (!permitidos.includes(valor)) {
		throw new Error(`${campo} inválido. Valores permitidos: ${permitidos.join(', ')}`);
	}
	return valor;
}