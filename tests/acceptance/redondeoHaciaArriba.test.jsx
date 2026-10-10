// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  completarCuenta, desmontarPantalla, montarPantalla, obtenerResultado,
  pulsarCalcular, seleccionarModo,
} from '../helpers/pantalla.js'

let pantalla

// Monta main para usar estrategias reales; recibe nada, devuelve undefined y propaga errores de composición.
beforeEach(() => { pantalla = montarPantalla() })
// Desmonta la pantalla entre casos; recibe nada, devuelve undefined y propaga errores de React.
afterEach(() => { desmontarPantalla(pantalla) })

// Verifica el techo del cociente original con casos de spec; produce errores de aserción ante regresiones.
describe('US3 — redondeo Hacia arriba con composición real', () => {
  it.each([
    ['CA-006', '10.00', '3', '0', '4.00'],
    ['FR-006 entero no aumenta', '90.00', '3', '0', '30.00'],
    ['FR-007 cero', '0', '3', '10', '0.00'],
    ['FR-004 una persona', '100', '1', '10', '110.00'],
    ['FR-006 usa cociente original', '3.0001', '1', '0', '4.00'],
    ['FR-007 monto grande', '1000000000000000000000', '1', '0', '1000000000000000000000.00'],
    ['FR-007 1e309', '1e309', '1', '0', `1${'0'.repeat(309)}.00`],
  ])('%s conserva el entero y dos decimales', (_caso, monto, personas, porcentajePropina, esperado) => {
    const { contenedor } = pantalla
    completarCuenta(contenedor, { monto, personas, porcentajePropina })
    seleccionarModo(contenedor, 'hacia-arriba')
    expect(contenedor.querySelector('[name="modoId"]').selectedOptions[0].textContent).toBe('Hacia arriba')
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe(`Por persona: ${esperado}`)
  })

  it('FR-002/FR-003 cambia Exacto → Hacia arriba → Exacto sólo al enviar', () => {
    const { contenedor } = pantalla
    // Recibe cada opción y devuelve su etiqueta para verificar el catálogo US3;
    // no produce errores de usuario.
    expect([...contenedor.querySelectorAll('select option')].map((opcion) => opcion.textContent)).toEqual(['Exacto', 'Hacia arriba'])
    completarCuenta(contenedor, { monto: '10.00', personas: '3', porcentajePropina: '0' })
    seleccionarModo(contenedor, 'exacto')
    expect(obtenerResultado(contenedor)).toBeNull()
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 3.33')
    seleccionarModo(contenedor, 'hacia-arriba')
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 3.33')
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 4.00')
    seleccionarModo(contenedor, 'exacto')
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 4.00')
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 3.33')
  })
})
