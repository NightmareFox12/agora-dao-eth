// Position = category id in the contract. AgoraTasks only knows how many there are (CATEGORY_COUNT = 6),
// so if you add one here, raise CATEGORY_COUNT in AgoraTasks.sol too.
export const TASK_CATEGORIES = ["Desarrollo", "Diseño", "Contenido", "Marketing", "Investigación", "Otro"] as const;
