/**
 * Fracción exacta de un importe no negativo, compartida por las estrategias.
 * @typedef {Object} ValorRacional
 * @property {bigint} numerador Mayor o igual que cero.
 * @property {bigint} denominador Mayor que cero.
 */

/**
 * Contrato pequeño que permite sustituir el redondeo sin cambiar consumidores.
 * aplicar recibe la fracción original, devuelve centavos bigint, es determinista
 * y no modifica el valor. No valida formularios ni utiliza React, DOM, red o datos
 * guardados. Un contrato incumplido es un error de programación; los errores nativos
 * de tipo o de división por cero pueden propagarse y no son mensajes de entrada.
 * @typedef {Object} EstrategiaRedondeo
 * @property {function(ValorRacional): bigint} aplicar Única operación del contrato.
 */

export {}
