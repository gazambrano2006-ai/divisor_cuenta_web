// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PantallaDivisor } from '../src/presentation/PantallaDivisor.jsx'
import { crearCatalogo } from '../src/main.jsx'

// Monta la pantalla real para aislar cada caso; no recibe datos, devuelve undefined
// y propaga errores de montaje. Las estrategias concretas se crean en main.jsx.
beforeEach(() => {
  const catalogo = crearCatalogo(import.meta.glob('../src/data/redondeo*.js', { eager: true }))
  render(<PantallaDivisor catalogo={catalogo} modoInicialId="exacto" />)
})

// Desmonta y limpia el DOM después de cada caso para no conservar datos anteriores.
afterEach(cleanup)

// Comprueba las interacciones visibles del usuario; las pruebas no reciben argumentos
// ni devuelven datos y fallan mediante aserciones de Vitest si la pantalla no cumple.
describe('Pantalla de división de cuenta', () => {
  it('ingresa 100, 4 y 10, pulsa Calcular y muestra 27.50', () => {
    fireEvent.change(screen.getByLabelText('Monto de la cuenta'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Número de personas'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Propina (%)'), { target: { value: '10' } })

    fireEvent.click(screen.getByRole('button', { name: 'Calcular', exact: true }))

    expect(screen.getByText('27.50')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Por persona: 27.50')
  })

  it('ingresa 50 y cero personas y muestra el error sin resultado numérico', () => {
    fireEvent.change(screen.getByLabelText('Monto de la cuenta'), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText('Número de personas'), { target: { value: '0' } })

    fireEvent.click(screen.getByRole('button', { name: 'Calcular', exact: true }))

    expect(screen.getByRole('alert').textContent).toBe('Debe haber al menos una persona')
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText(/^\d+\.\d{2}$/)).toBeNull()
  })

  it('ingresa abc en el monto y muestra Monto inválido', () => {
    fireEvent.change(screen.getByLabelText('Monto de la cuenta'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByLabelText('Número de personas'), { target: { value: '4' } })

    fireEvent.click(screen.getByRole('button', { name: 'Calcular', exact: true }))

    expect(screen.getByRole('alert').textContent).toBe('Monto inválido')
  })
})
