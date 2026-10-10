# Modelo de datos: dividir la cuenta

Los tipos se documentan con JSDoc en JavaScript puro. Son valores del cálculo actual,
sin identidad persistida ni base de datos.

## Entrada de formulario

| Campo | Tipo | Significado |
|-------|------|-------------|
| monto | string | Monto previo a la propina. |
| personas | string | Cantidad ingresada sin convertir ni truncar. |
| porcentajePropina | string | Porcentaje de propina ingresado. |
| modoId | string | Id elegido en el catálogo inyectado; estado de presentation. |

Conservar texto permite distinguir vacío de cero y mostrar «Monto inválido» para abc.
Defaults de diseño: monto/personas vacíos y propina 0; main inyecta modoInicialId
con id exacto para iniciar en Exacto. El hook no codifica ese id. La spec
no exige esos valores iniciales. No se muestra resultado al iniciar.

## Valor racional

| Campo | Tipo | Invariante del valor válido |
|-------|------|----------------------------|
| numerador | bigint | Mayor o igual que cero. |
| denominador | bigint | Mayor que cero. |

Un decimal se representa exactamente: 1.005 equivale a 1005/1000.
La normalización conserva todos los decimales y admite un exponente decimal opcional.
No es necesario reducir la fracción para calcular ni redondear.
La finitud se comprueba mediante la gramática decimal completa, rechazando
literales NaN e Infinity. No se usa Number para normalizar, imponer límites
ni calcular. Por ejemplo, 1e309 sigue siendo un decimal finito representable
como racional BigInt; no se le impone el límite de la representación binaria.

## Cuenta — src/domain/cuenta.js

| Campo | Tipo | Regla |
|-------|------|-------|
| monto | ValorRacional | Entrada numérica finita no negativa. |
| personas | bigint | Entero mayor o igual que uno. |
| porcentajePropina | ValorRacional | Entrada numérica finita no negativa. |

validarEntrada entrega los datos normalizados y usa crearCuenta para construir
este valor. crearCuenta no valida, calcula ni formatea.
No hay máximo arbitrario ni límite de dos decimales en las entradas.

## Estrategia y catálogo

EstrategiaRedondeo tiene únicamente aplicar(valor: ValorRacional): bigint.
El bigint de retorno expresa centavos por persona.

Los módulos de data exportan id, etiqueta y una función aplicar.
main crea objetos de estrategia y elementos del catálogo:

| Campo del catálogo | Tipo | Ejemplos |
|--------------------|------|----------|
| id | string único | exacto, hacia-arriba |
| etiqueta | string | Exacto, Hacia arriba |
| estrategia | EstrategiaRedondeo | Objeto creado en main con la función aplicar del módulo. |

Los metadatos no pertenecen a la interfaz de redondeo.
El selector usa el catálogo; el cálculo recibe exclusivamente la estrategia.
Agregar una estrategia compatible no cambia los consumidores.

## Resultado — src/domain/resultado.js

| Campo | Tipo | Significado |
|-------|------|-------------|
| centavosPorPersona | bigint | Importe individual después de aplicar la estrategia. |

crearResultado construye este valor sin validarlo ni formatearlo.
No incluye reparto de sobrantes, moneda elegida, texto de pantalla ni error.
El texto con dos decimales se deriva en formateadorMoneda, sin redondeo adicional.

## Resultado de validación y error

validarEntrada devuelve una de estas dos formas:

- Válido: { valido: true, cuenta }.
- Inválido: { valido: false, error: { campo, mensaje } }.

| Condición | Mensaje de diseño |
|-----------|-------------------|
| Monto vacío, no numérico, no finito o negativo | Monto inválido |
| Personas numéricas menores o iguales que cero | Debe haber al menos una persona |
| Personas vacías, no numéricas, no finitas o no enteras | Número de personas inválido |
| Propina vacía, no numérica, no finita o negativa | Propina inválida |

Los dos primeros textos son exactos por la spec. Los otros dos son decisiones de UI.
En personas, comprobar menor o igual que cero antes de rechazar por no integralidad;
por ejemplo, -0.5 conserva el mensaje fijado para cantidades no positivas.
Orden para varios errores: monto, personas, propina. No es una nueva regla de la spec.

## Estado de pantalla — useState en useDivisor

El hook mantiene entradas, modoId y una salida { resultado, error }.

| Evento | Transición |
|--------|------------|
| Inicio | Resultado y error null. |
| Editar entrada o modo | Actualizar estado sin calcular; conservar la salida del último envío. |
| Calcular con entrada inválida | Resultado null y error del validador, aunque existía un resultado anterior. |
| Calcular con entrada válida | Resultado nuevo y error null. |
| Corregir y volver a calcular | Sustituir error por resultado válido en la misma pantalla. |

El resultado y el error nunca se muestran juntos.
Cada envío usa las entradas y el modo de ese momento.
Cerrar y reabrir reinicia los datos; la caché offline sólo conserva archivos de la aplicación.
