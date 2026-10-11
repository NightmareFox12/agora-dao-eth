# Roadmap de Agora DAO

Los 6 módulos base de la plataforma. Marca cada casilla al completar el módulo.

## Módulos

| # | Módulo | Qué incluye | Estado |
|---|---|---|---|
| 1 | **Tareas** | Crear, asignar, entregar, auditar y pagar | Solo UI con datos de prueba |
| 2 | **Votaciones** | Propuestas y decisiones de la DAO | Pendiente |
| 3 | **Eventos públicos** | Pendiente de definir | Pendiente |
| 4 | **Recompensas** | Tokens y NFTs | Pendiente |
| 5 | **Tesorería / escrow** | Fondos de la DAO y pagos de tareas | Pendiente |
| 6 | **Reputación** | Niveles y NFTs según cuánto aportas | Pendiente (la pantalla de Perfil ya espera este módulo) |

Reputación y Recompensas se tocan: los NFTs de nivel son recompensas. Van como contratos separados. Reputación lleva la cuenta de puntos y nivel, y Recompensas emite los NFTs cuando se alcanza un nivel.

## Orden propuesto

- [x] 1. Arreglar los bugs de seguridad de roles
- [ ] 2. Tesorería
- [ ] 3. Tareas (paga desde la tesorería y suma puntos de reputación)
- [ ] 4. Votaciones
- [ ] 5. Reputación y Recompensas
- [ ] 6. Eventos públicos (independientes: en paralelo o al final)

## Ya hecho

- [x] Factory para crear DAOs, con categorías múltiples (máx. 3) y nombres únicos
- [x] Unirse a una DAO y roles (`AUDITOR`, `TASK_MANAGER`, `PROPOSAL_MANAGER`, `USER`)
- [x] Configuración de roles en el frontend
- [x] Landing, lista de DAOs (con filtros múltiples) y creación de DAOs
- [x] Bugs de seguridad de roles (`Rol.sol` y factory), con tests
- [x] Inicio de la DAO: dashboard con datos reales
- [x] Perfil: roles, antigüedad y espacio reservado para nivel y NFTs
- [x] Guía de bienvenida para usuarios nuevos (se guarda por DAO)

## Para cuando se agreguen pantallas

- Cada pantalla nueva puede tener su propia guía: define los pasos en un archivo `*.tour.ts` junto a la página y llama a `useTour(id, pasos)`. Los elementos se señalan con `data-tour="..."`.
- El Perfil crece con el módulo de Reputación: nivel, experiencia, insignias NFT e historial de contribuciones.

## Por decidir

- ¿Qué es un "evento público"? Puede ser un meetup con asistentes, o una actividad abierta a quien no es miembro de la DAO.
- Ocultar "Configuración" del menú a quien no es administrador.
