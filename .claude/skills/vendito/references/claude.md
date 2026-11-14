# Cómo trabaja Vendito con Claude (rápido, bueno y barato)

Junior pidió que Vendito sepa cómo funciona Claude para delegar «de la manera
que a Claude le gustaría que se lo deleguen» y gastar poco. Fuentes: la
documentación de Claude Code (memory, sub-agents, skills, best-practices) y la
guía de prompting de Anthropic, revisadas el 14 nov 2026.

## Lo que cuesta contexto (y por qué importa)

- **Cada sesión empieza en blanco.** Solo se carga solo CLAUDE.md y las
  descripciones de las skills y los agentes. Todo lo demás hay que leerlo.
  Por eso existen `docs/vendito/decisiones.md` y `mapa.md`: son la memoria.
- **CLAUDE.md, corto** (menos de 200 líneas). Cada línea le quita un poco de
  atención a cada tarea. Lo largo va en la skill o en `docs/`, con un puntero.
- **Una skill se carga cuando se usa,** y sus referencias, solo si se abren.
  Por eso Vendito abre una referencia por tema, no todas.
- **Leer por partes:** un archivo grande se busca con Grep y se lee la sección
  (offset y limit), no entero.
- **No editar CLAUDE.md a mitad de una sesión** sin necesidad: lo estable al
  principio aprovecha la caché.

## Cuándo delegar en un subagente y cuándo no

**Sí:**

- **Búsquedas amplias** («dónde está X en todo el repo»): el agente
  `explorador` (Haiku, solo lectura). Devuelve la conclusión, no el contenido
  de los archivos.
- **Investigación en paralelo** (mercado, competencia, documentación): un
  agente por tema, lanzados a la vez.
- **La prueba del humano:** `cliente-esceptico`, porque un revisor nuevo no
  vio nuestro razonamiento y por eso no se ancla.

**No:**

- Una búsqueda que ya sé dónde está: se hace directo.
- Algo de dos o tres pasos.
- Revisar dos veces lo mismo (si se delegó, se espera el resultado).

Cada subagente gasta sus propios tokens. Uno por función, no uno por tema.

## Cómo se escribe el encargo (el prompt) para otro agente

El agente solo sabe lo que dice el encargo. La prueba: si un colega sin
contexto se confundiría con el texto, el agente también.

1. **El objetivo y para qué sirve** (el porqué orienta mejor que la orden).
2. **El contexto que no puede deducir:** el negocio, lo que ya se descartó, los
   archivos que vale la pena leer (con su ruta).
3. **Los límites:** qué no hacer, qué no tocar, el idioma, «sin rayas largas».
4. **El formato de entrega:** dónde escribe el archivo, cuántas palabras, qué
   secciones, qué devuelve en la respuesta final (un resumen corto).
5. **Para un revisor:** se le da el material y la pregunta, nunca nuestra
   conclusión. Se le dan criterios concretos (si no, siempre encuentra algo).
6. **Ejemplos** cuando el formato importa: uno o dos, distintos entre sí.
7. **Estructura:** encabezados o etiquetas XML para separar instrucciones,
   contexto y material.

## Qué modelo para qué

| Trabajo | Modelo |
| --- | --- |
| Buscar, listar, resumir archivos, tareas mecánicas | `haiku` |
| Revisar una pieza como cliente, investigar en la web, escribir borradores | `sonnet` |
| Estrategia, el ángulo de una campaña, decisiones que cambian el negocio | `opus` (o el de la conversación, `inherit`) |

## Los agentes de Vendito (`.claude/agents/`)

| Agente | Para qué | Modelo |
| --- | --- | --- |
| `cliente-esceptico` | La prueba del humano: lee la pieza como un dueño desconfiado | el de la conversación |
| `explorador` | Encontrar algo en el sistema y devolver solo la respuesta | Haiku |

Un agente nuevo se crea solo cuando una función se repite y no la cubre
ninguno de estos dos.

**Un agente nuevo se carga en la sesión siguiente,** no en la que lo creó.
Mientras tanto se usa el agente general con el archivo del agente como
instrucciones («lee `.claude/agents/cliente-esceptico.md` y síguelo»), y el
modelo de la tabla de arriba.

## Lo que Vendito NO hace con Claude

- Lanzar un «workflow» de muchos agentes sin que Junior lo pida.
- Repetir una búsqueda que ya delegó.
- Copiar en el chat el contenido de archivos largos: se cita la ruta y la
  conclusión.
