# Contrato de aceptación ejecutable

**Fuente**: [spec.md](../spec.md), conservada sin modificaciones.
**Runner**: Vitest para todas las suites.
Los nombres de casos incluirán los identificadores CA/FR/SC para hacer trazable el resultado.

## Seis escenarios de aceptación

La suite tests/acceptance/ monta la entrada de main con el catálogo real.
Ingresa datos, selecciona el modo, pulsa «Calcular» y comprueba la salida en el DOM,
incluidos punto y exactamente dos decimales.

| Caso | Monto | Personas | Propina | Modo | Esperado |
|------|-------|----------|---------|------|----------|
| CA-001 | 100.00 | 4 | 10 | Exacto | Por persona: 27.50 |
| CA-002 | 90.00 | 3 | 0 | Exacto | Por persona: 30.00 |
| CA-003 | 50.00 | 0 | 0 | Exacto | Debe haber al menos una persona; resultado ausente. |
| CA-004 | abc | 3 | 0 | Exacto | Monto inválido; resultado ausente. |
| CA-005 | 10.00 | 3 | 0 | Exacto | Por persona: 3.33; sin reparto del sobrante. |
| CA-006 | 10.00 | 3 | 0 | Hacia arriba | Por persona: 4.00 |

CA-003 y CA-004 se ejecutan en estado inicial y después de CA-001.
El mensaje exacto debe aparecer y el resultado anterior desaparecer en ambos casos.
La suite offline repite los seis casos, incluida esa secuencia, en una apertura desconectada.

## Trazabilidad de requisitos y escenarios adicionales

| Referencia de la spec | Prueba ejecutable prevista |
|-----------------------|----------------------------|
| FR-001, FR-002, SC-005 | Verificar tres entradas, opciones Exacto/Hacia arriba, botón Calcular y salida en la misma pantalla. |
| FR-003 | Al iniciar no existe resultado; editar datos o modo no calcula; enviar usa los valores actuales. |
| FR-004 | CA-001 y pruebas de la fórmula, incluida propina decimal y conservación del total original. |
| FR-005, CA-005 | Todos reciben el mismo importe 3.33; no se asigna 3.34 a una persona ni se compensa sobrante. |
| FR-006, CA-006 | Techo entero del cociente original; parte ya entera no aumenta; salida incluye .00. |
| FR-007, SC-002 | Comparar texto exacto de importes y dos decimales, incluido cero. |
| FR-008 | Cero/negativos con mensaje exacto; vacíos, no numéricos y no enteros con error sin resultado. |
| FR-009 | abc, vacío, Infinity, NaN y monto negativo producen Monto inválido. |
| FR-010, SC-003 | Todas las entradas inválidas borran cualquier resultado; CA-003/004 antes y después de válido. |
| FR-011, SC-005 | Corregir datos inválidos y enviar produce resultado y elimina el error, sin navegación. |
| FR-012, US4, SC-004 | Precargar build, activar worker, cerrar página, desconectar y abrir página nueva; repetir CA-001 a CA-006. |
| US3, escenario adicional | 10/3 con 0%: enviar Exacto → 3.33, cambiar y enviar Hacia arriba → 4.00, volver y enviar Exacto → 3.33. |
| SC-001 | Los seis CA deben pasar; no reemplazarlos por comprobaciones sólo del algoritmo. |

## Casos límite y precisión

| Caso | Esperado |
|------|----------|
| Monto 0.00, una o más personas válidas y propina válida, ambos modos | 0.00 |
| Una persona, monto 100.00 y 10% | 110.00 en ambos modos. |
| Personas vacías, abc, Infinity o 1.5 | Error de entrada, sin resultado. |
| Personas -1 o -0.5 | Debe haber al menos una persona, sin resultado. |
| Propina vacía, abc, Infinity, NaN o negativa | Error de entrada, sin resultado. |
| Hacia arriba: 90.00 / 3 con 0% | 30.00, sin aumentar el entero. |
| Hacia arriba: 3.0001 / 1 con 0% | 4.00, sin usar el valor previamente formateado. |
| Exacto: 1.005 / 1 con 0% | 1.01, empate superior. |
| Exacto: 2.675 / 1 con 0% | 2.68, empate superior. |
| Exacto: 0.02 / 2 con 49% | 0.01; no redondear total 0.0298 antes de dividir. |
| Personas 9007199254740993, monto 0 y propina 0 | Entrada válida y 0.00; no imponer máximo de enteros seguros. |
| Monto 1000000000000000000000 / 1 con 0%, ambos modos | 1000000000000000000000.00, sin notación exponencial. |
| Monto 1e309 / 1 con 0%, ambos modos | Representación completa de 10^309 con .00; sin imponer el límite de Number. |

No añadir topes a monto, personas o propina. Los textos de errores que la spec
no fija se comprueban como error visible y resultado ausente; las decisiones
de redacción se documentan en data-model.md.

## Contratos, capas y offline

- tests/domain/ verifica validación, fórmula original y representación del resultado.
- tests/data/ llama las dos funciones aplicar con iguales precondiciones;
  comprueba retorno bigint, cero, empates, entero y ausencia de mutación.
- tests/presentation/ verifica formato, acciones y estados con React/DOM.
- tests/acceptance/ verifica los escenarios mediante la composición real de main.
- tests/offline/ usa Vitest en Node y playwright para Chromium. Prepara los activos
  en el mismo contexto/origen, espera worker activo y caché completa, cierra la página,
  activa setOffline(true), abre otra y repite la matriz. No simula sólo navigator.onLine.
- En la validación offline, comprobar que HTML/JS/CSS se sirven desde el worker
  y que enviar, validar y calcular no inicia ninguna petición de red, incluidas
  peticiones al mismo origen. La precarga se prepara aparte. Caché no contiene cuentas.
- Revisar imports: domain sin React/DOM/data; presentation sin data;
  descubrimiento y creación de objetos concretos sólo en main.

Estos son casos planificados. Este comando no implementa ni ejecuta las pruebas.
