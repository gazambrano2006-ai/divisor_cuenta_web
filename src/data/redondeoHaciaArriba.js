/** @typedef {import('../domain/estrategiaRedondeo.js').ValorRacional} ValorRacional */

export const id = 'hacia-arriba'
export const etiqueta = 'Hacia arriba'

/**
 * Obtiene el techo entero para implementar Hacia arriba sobre el cociente original.
 * Recibe la misma fracción no negativa que cualquier estrategia y devuelve centavos
 * bigint con un importe entero; no aumenta un valor ya entero ni modifica el recibido.
 * No valida formularios. Un contrato incumplido puede producir errores nativos de
 * programación, por ejemplo tipos incompatibles o división por cero.
 * @param {ValorRacional} valor Importe individual sin redondeos previos.
 * @returns {bigint} El menor entero igual o mayor que el valor, expresado en centavos.
 */
export function aplicar(valor) {
  const cociente = valor.numerador / valor.denominador
  const resto = valor.numerador % valor.denominador
  return (cociente + (resto === 0n ? 0n : 1n)) * 100n
}
