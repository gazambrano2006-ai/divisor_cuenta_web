/** @typedef {import('./estrategiaRedondeo.js').ValorRacional} ValorRacional */

/**
 * Datos exactos ya validados de un cálculo; no representan una cuenta guardada.
 * @typedef {Object} Cuenta
 * @property {ValorRacional} monto Entrada numérica finita no negativa.
 * @property {bigint} personas Entero mayor o igual que uno.
 * @property {ValorRacional} porcentajePropina Entrada numérica finita no negativa.
 */

/**
 * Construye Cuenta para separar representación de validación y cálculo.
 * Recibe los tres datos normalizados y devuelve su valor sin formatear ni alterar
 * las fracciones. No produce errores de usuario ni comprueba las precondiciones;
 * pasar un argumento que no sea un objeto es un error de programación nativo.
 * @param {Cuenta} datosNormalizados Datos que validarEntrada ya comprobó.
 * @returns {Cuenta} Valor de la cuenta actual.
 */
export function crearCuenta(datosNormalizados) {
  return {
    monto: datosNormalizados.monto,
    personas: datosNormalizados.personas,
    porcentajePropina: datosNormalizados.porcentajePropina,
  }
}
