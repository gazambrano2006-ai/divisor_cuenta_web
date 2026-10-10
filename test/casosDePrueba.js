// Los casos salen de la spec. Son EXACTAMENTE los mismos que en la versión Flutter.

export const casos = [
  { nombre: '1. reparto normal',
    monto: 100.00, personas: 4, propina: 10, modo: 'exacto', esperado: 27.50 },

  { nombre: '2. sin propina',
    monto: 90.00, personas: 3, propina: 0, modo: 'exacto', esperado: 30.00 },

  { nombre: '3. cero personas',
    monto: 50.00, personas: 0, propina: 0, modo: 'exacto',
    errorEsperado: 'Debe haber al menos una persona' },

  { nombre: '4. monto no numerico',
    monto: NaN, personas: 4, propina: 0, modo: 'exacto',
    errorEsperado: 'Monto inválido' },

  { nombre: '5. redondeo exacto',
    monto: 10.00, personas: 3, propina: 0, modo: 'exacto', esperado: 3.33 },

  { nombre: '6. redondeo hacia arriba',
    monto: 10.00, personas: 3, propina: 0, modo: 'arriba', esperado: 4.00 },
]