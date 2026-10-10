import { crearCuenta } from './cuenta.js'

/**
 * Textos del formulario antes de convertirlos a los valores exactos del dominio.
 * @typedef {Object} EntradaCuenta
 * @property {string} monto Monto anterior a la propina.
 * @property {string} personas Cantidad de personas sin convertir ni truncar.
 * @property {string} porcentajePropina Porcentaje de propina.
 */

/**
 * Fracción exacta de un texto numérico no negativo durante la validación.
 * @typedef {Object} DecimalAnalizado
 * @property {bigint} numerador Mayor o igual que cero.
 * @property {bigint} denominador Siempre positivo.
 */

/**
 * Marca que indica un decimal negativo no cero sin construir su magnitud.
 * No es una fracción ni puede formar parte de Cuenta.
 * @typedef {Object} DecimalNegativo
 * @property {true} negativo Permite devolver el mensaje correspondiente al campo.
 */

/**
 * Normaliza un texto decimal completo para evitar pérdida de precisión binaria.
 * Recibe texto con punto, signo y exponente opcionales; devuelve una fracción exacta
 * no negativa, una marca de negativo no cero, o null si es vacío/no numérico/no finito.
 * La marca permite rechazar negativos sin expandir potencias y conserva la distinción
 * entre negativo y cero con signo. No lanza excepciones por textos inválidos. Entradas
 * positivas válidas excesivas pueden agotar los recursos del motor, como cualquier
 * cálculo con BigInt; no se establece un máximo propio de la aplicación.
 * @param {string} texto Entrada textual sin normalizar.
 * @returns {DecimalAnalizado | DecimalNegativo | null} Valor exacto o marca de entrada negativa/inválida.
 */
function normalizarDecimal(texto) {
  if (typeof texto !== 'string') return null

  const coincidencia = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(texto.trim())
  if (!coincidencia) return null

  const entero = coincidencia[2] ?? '0'
  const fraccion = coincidencia[3] ?? coincidencia[4] ?? ''
  const digitos = entero + fraccion

  // Cero no necesita construir potencias, ni siquiera con un exponente muy grande.
  if (!/[1-9]/.test(digitos)) return { numerador: 0n, denominador: 1n }

  // El signo basta para rechazar un negativo no cero antes de construir su magnitud.
  if (coincidencia[1] === '-') return { negativo: true }

  const numerador = BigInt(digitos)
  const exponente = BigInt(coincidencia[5] ?? '0')
  const escala = BigInt(fraccion.length) - exponente

  if (escala < 0n) {
    return { numerador: numerador * (10n ** -escala), denominador: 1n }
  }
  return { numerador, denominador: 10n ** escala }
}

/**
 * Construye una salida inválida uniforme para separar el mensaje de la pantalla.
 * Recibe campo y mensaje, devuelve el error de entrada y no lanza excepciones.
 * @param {string} campo Nombre de la entrada inválida.
 * @param {string} mensaje Explicación que debe mostrar presentation.
 * @returns {{valido: false, error: {campo: string, mensaje: string}}} Error de entrada.
 */
function entradaInvalida(campo, mensaje) {
  return { valido: false, error: { campo, mensaje } }
}

/**
 * Valida y normaliza para que el cálculo reciba únicamente Cuenta válida.
 * Recibe tres textos y devuelve { valido: true, cuenta } o { valido: false, error }.
 * Comprueba monto, personas y propina en ese orden; no calcula ni formatea. Los datos
 * inválidos del usuario se devuelven como errores, sin lanzar excepciones. Un objeto
 * de entrada ausente supone incumplir el contrato y puede producir un error nativo.
 * @param {EntradaCuenta} entrada Textos actuales del formulario.
 * @returns {{valido: true, cuenta: import('./cuenta.js').Cuenta} | {valido: false, error: {campo: string, mensaje: string}}} Validación y cuenta o primer error.
 */
export function validarEntrada(entrada) {
  const monto = normalizarDecimal(entrada.monto)
  if (!monto || monto.negativo) {
    return entradaInvalida('monto', 'Monto inválido')
  }

  const personas = normalizarDecimal(entrada.personas)
  if (!personas) {
    return entradaInvalida('personas', 'Número de personas inválido')
  }
  if (personas.negativo || personas.numerador <= 0n) {
    return entradaInvalida('personas', 'Debe haber al menos una persona')
  }
  if (personas.numerador % personas.denominador !== 0n) {
    return entradaInvalida('personas', 'Número de personas inválido')
  }

  const porcentajePropina = normalizarDecimal(entrada.porcentajePropina)
  if (!porcentajePropina || porcentajePropina.negativo) {
    return entradaInvalida('porcentajePropina', 'Propina inválida')
  }

  return {
    valido: true,
    cuenta: crearCuenta({
      monto,
      personas: personas.numerador / personas.denominador,
      porcentajePropina,
    }),
  }
}
