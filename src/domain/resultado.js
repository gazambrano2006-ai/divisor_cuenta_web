/**
 * Salida numérica del cálculo, separada del texto de presentación y de los errores.
 * @typedef {Object} Resultado
 * @property {bigint} centavosPorPersona Importe individual después de aplicar la estrategia.
 */

/**
 * Construye Resultado para conservar centavos exactos sin repartir o formatear.
 * Recibe el bigint devuelto por la estrategia y devuelve un objeto con ese importe.
 * No valida precondiciones, no redondea y no produce errores de usuario.
 * @param {bigint} centavosPorPersona Importe individual en centavos.
 * @returns {Resultado} Valor del pago individual.
 */
export function crearResultado(centavosPorPersona) {
  return { centavosPorPersona }
}
