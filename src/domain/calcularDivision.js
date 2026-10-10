import { crearResultado } from './resultado.js'

/**
 * Calcula la parte original y delega el redondeo para separar ambas responsabilidades.
 * Recibe Cuenta válida y una estrategia con aplicar; devuelve Resultado en centavos.
 * Construye monto × (1 + propina/100) / personas sin redondear el total, llama una
 * sola vez a aplicar y no consulta tipos o modos. No valida ni formatea. Si los
 * argumentos incumplen sus contratos, los errores de programación se propagan.
 * @param {import('./cuenta.js').Cuenta} cuenta Datos ya validados y normalizados.
 * @param {import('./estrategiaRedondeo.js').EstrategiaRedondeo} estrategia Contrato de redondeo inyectado.
 * @returns {import('./resultado.js').Resultado} Importe individual redondeado.
 */
export function calcularDivision(cuenta, estrategia) {
  const { monto, personas, porcentajePropina } = cuenta
  const numerador = monto.numerador * (
    100n * porcentajePropina.denominador + porcentajePropina.numerador
  )
  const denominador = monto.denominador * 100n * porcentajePropina.denominador * personas

  return crearResultado(estrategia.aplicar({ numerador, denominador }))
}
