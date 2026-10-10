/** @typedef {import('../domain/estrategiaRedondeo.js').ValorRacional} ValorRacional */

export const id = 'exacto'
export const etiqueta = 'Exacto'

/**
 * Redondea al centavo más cercano con empate superior para implementar Exacto.
 * Recibe el cociente racional original no negativo y devuelve centavos bigint sin
 * modificarlo ni validar formularios. Sólo pueden propagarse errores de programación
 * nativos, como tipos incompatibles o denominador cero, al incumplir el contrato.
 * @param {ValorRacional} valor Importe individual antes de cualquier redondeo.
 * @returns {bigint} Centavos por persona, sin redistribuir sobrantes.
 */
export function aplicar(valor) {
  const numeradorCentavos = 100n * valor.numerador
  const cociente = numeradorCentavos / valor.denominador
  const resto = numeradorCentavos % valor.denominador
  return cociente + (2n * resto >= valor.denominador ? 1n : 0n)
}
