// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { casos } from './casosDePrueba.js'
import { validarEntrada } from '../src/domain/validarEntrada.js'
import * as division from '../src/domain/calcularDivision.js'
import * as redondeoExacto from '../src/data/redondeoExacto.js'
import * as redondeoHaciaArriba from '../src/data/redondeoHaciaArriba.js'

const estrategias = { exacto: redondeoExacto, arriba: redondeoHaciaArriba }
let espiaCalculo

// Observa el cálculo real para detectar llamadas indebidas; no recibe datos ni sustituye su resultado.
beforeEach(() => {
  espiaCalculo = vi.spyOn(division, 'calcularDivision')
})

// Restaura las funciones al acabar cada caso para que las llamadas no se compartan entre pruebas.
afterEach(() => {
  vi.restoreAllMocks()
})

// Genera una prueba por caso y verifica el contrato puro del dominio; los fallos son aserciones de Vitest.
describe('División de cuenta', () => {
  for (const caso of casos) {
    it(caso.nombre, () => {
      expect.hasAssertions()
      // El formulario entrega textos: adaptar los números del fixture conserva ese contrato.
      const validacion = validarEntrada({
        monto: String(caso.monto),
        personas: String(caso.personas),
        porcentajePropina: String(caso.propina),
      })

      if (Object.hasOwn(caso, 'errorEsperado')) {
        expect(validacion.valido).toBe(false)
        expect(validacion.error.mensaje).toBe(caso.errorEsperado)
        expect(espiaCalculo).not.toHaveBeenCalled()
        return
      }

      if (Object.hasOwn(caso, 'esperado')) {
        expect(validacion.valido).toBe(true)
        const estrategia = estrategias[caso.modo]
        expect(estrategia).toBeDefined()
        const resultado = division.calcularDivision(validacion.cuenta, estrategia)
        // Convertir centavos sólo para comparar con los importes numéricos del fixture.
        expect(Number(resultado.centavosPorPersona) / 100).toBeCloseTo(caso.esperado, 2)
        expect(espiaCalculo).toHaveBeenCalledTimes(1)
      }
    })
  }

  // Sustituye ambas implementaciones en el mismo cálculo sin consultar modos ni tipos.
  it('LSP: calcularDivision funciona con Exacto y Hacia arriba sin comprobar tipos', () => {
    const validacion = validarEntrada({ monto: '10.00', personas: '3', porcentajePropina: '0' })
    expect(validacion.valido).toBe(true)

    const exacto = division.calcularDivision(validacion.cuenta, redondeoExacto)
    const arriba = division.calcularDivision(validacion.cuenta, redondeoHaciaArriba)

    expect(Number(exacto.centavosPorPersona) / 100).toBeCloseTo(3.33, 2)
    expect(Number(arriba.centavosPorPersona) / 100).toBeCloseTo(4.00, 2)
    expect(espiaCalculo).toHaveBeenNthCalledWith(1, validacion.cuenta, redondeoExacto)
    expect(espiaCalculo).toHaveBeenNthCalledWith(2, validacion.cuenta, redondeoHaciaArriba)
  })
})
