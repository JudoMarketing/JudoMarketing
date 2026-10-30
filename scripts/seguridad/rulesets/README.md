# Reglas de GitHub para un repo ajeno

Cuando tomamos un repositorio de internet para trabajar con un chat de
Claude, se copia a un repo privado nuestro (sin fork) y se le ponen estas dos
reglas:

| Archivo | Qué hace |
| --- | --- |
| `repo-ajeno-main.json` | `main` no se borra, no se reescribe y no recibe cambios, ni por pull request. |
| `repo-ajeno-ramas.json` | Ninguna rama se borra ni se reescribe (`--force`). |

Nadie las salta, ni Junior: el chat empuja con la cuenta de Junior, así que
cualquier excepción para él también sería para el chat. Si un día hay que
cambiar `main`, Junior apaga la regla un momento (Settings → Rules →
Rulesets → la regla → Enforcement: Disabled) y la vuelve a prender. Un chat
no puede apagarlas: el proxy de las sesiones no deja escribir reglas.

## Cómo se ponen

1. Repo → Settings → Rules → Rulesets → New ruleset → Import a ruleset.
2. Elegir el archivo `.json` y guardar con Create.
3. Repetir con el otro archivo.

**En un repo privado de una cuenta personal, GitHub solo hace cumplir las
reglas con GitHub Pro.** Sin Pro, la protección es la copia sin fork, el
`CLAUDE.md` del repo y abrir el chat solo con ese repo.

Primer uso: `JudoMarketing/VideoCreator-explanatory-`, la copia de
anything2explainer (30 de octubre de 2026).
