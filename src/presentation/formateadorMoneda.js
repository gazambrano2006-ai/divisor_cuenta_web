/**
 * Convierte centavos ya redondeados en texto con dos decimales para la pantalla.
 * Recibe un bigint no negativo y devuelve un string con punto, sin convertir a
 * Number ni redondear. No produce errores de usuario: un tipo incorrecto puede
 * lanzar TypeError, pues incumple el contrato del resultado del dominio.
 * @param {bigint} centavos
 * @returns {string}
 */
export function formateadorMoneda(centavos) {
  const entero = centavos / 100n
  const decimales = (centavos % 100n).toString().padStart(2, '0')
  return `${entero}.${decimales}`
}
