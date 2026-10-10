// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  completarCuenta, desmontarPantalla, editarCampo, montarPantalla,
  obtenerError, obtenerResultado, pulsarCalcular,
} from '../helpers/pantalla.js'

let pantalla

// Prepara una pantalla real, sin datos previos; devuelve undefined y propaga errores de montaje.
beforeEach(() => { pantalla = montarPantalla() })
// Limpia el DOM y estado para aislar cada caso; devuelve undefined y propaga errores del desmontaje.
afterEach(() => { desmontarPantalla(pantalla) })

// Comprueba errores de usuario y recuperación; recibe casos y produce fallos de aserción si hay regresiones.
describe('US2 — errores de entrada en la misma pantalla', () => {
  it.each([
    ['CA-003', 'monto', '50.00', 'personas', '0', 'Debe haber al menos una persona'],
    ['CA-004', 'monto', 'abc', 'personas', '3', 'Monto inválido'],
  ])('%s muestra mensaje exacto antes y después de un resultado', (_caso, campo1, valor1, campo2, valor2, mensaje) => {
    const { contenedor } = pantalla
    completarCuenta(contenedor, { monto: '100.00', personas: '4', porcentajePropina: '10' })
    editarCampo(contenedor, campo1, valor1)
    editarCampo(contenedor, campo2, valor2)
    pulsarCalcular(contenedor)
    expect(obtenerError(contenedor).textContent).toBe(mensaje)
    expect(obtenerResultado(contenedor)).toBeNull()

    completarCuenta(contenedor, { monto: '100.00', personas: '4', porcentajePropina: '10' })
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 27.50')
    expect(obtenerError(contenedor)).toBeNull()
    editarCampo(contenedor, campo1, valor1)
    editarCampo(contenedor, campo2, valor2)
    pulsarCalcular(contenedor)
    expect(obtenerError(contenedor).textContent).toBe(mensaje)
    expect(obtenerResultado(contenedor)).toBeNull()
  })

  it.each([
    ['monto', '', 'Monto inválido'],
    ['monto', 'Infinity', 'Monto inválido'],
    ['monto', 'NaN', 'Monto inválido'],
    ['monto', '-1', 'Monto inválido'],
    ['personas', '-1', 'Debe haber al menos una persona'],
    ['personas', '-0.5', 'Debe haber al menos una persona'],
    ['personas', '', null],
    ['personas', 'abc', null],
    ['personas', 'Infinity', null],
    ['personas', '1.5', null],
    ['porcentajePropina', '', null],
    ['porcentajePropina', 'abc', null],
    ['porcentajePropina', 'Infinity', null],
    ['porcentajePropina', 'NaN', null],
    ['porcentajePropina', '-1', null],
  ])('FR-008/FR-009/FR-010 entrada %s=%s elimina resultado y permite corregir', (campo, valor, mensaje) => {
    const { contenedor } = pantalla
    completarCuenta(contenedor, { monto: '100.00', personas: '4', porcentajePropina: '10' })
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor)).not.toBeNull()
    editarCampo(contenedor, campo, valor)
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor)).toBeNull()
    expect(obtenerError(contenedor)).not.toBeNull()
    expect(obtenerError(contenedor).textContent.length).toBeGreaterThan(0)
    if (mensaje) expect(obtenerError(contenedor).textContent).toBe(mensaje)

    completarCuenta(contenedor, { monto: '90.00', personas: '3', porcentajePropina: '0' })
    pulsarCalcular(contenedor)
    expect(obtenerError(contenedor)).toBeNull()
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 30.00')
  })
})
