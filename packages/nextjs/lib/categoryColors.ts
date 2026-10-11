// Every class is written out in full so Tailwind can detect it.
// The colors themselves live in styles/globals.css (--category-1 ... --category-8).
const CATEGORY_STYLES = [
  {
    soft: "bg-category-1/15 text-category-1 border-category-1/40",
    idle: "border-category-1/40 text-foreground/70 hover:bg-category-1/10",
    active: "bg-category-1/20 text-category-1 border-category-1 font-semibold",
    dot: "bg-category-1",
  },
  {
    soft: "bg-category-2/15 text-category-2 border-category-2/40",
    idle: "border-category-2/40 text-foreground/70 hover:bg-category-2/10",
    active: "bg-category-2/20 text-category-2 border-category-2 font-semibold",
    dot: "bg-category-2",
  },
  {
    soft: "bg-category-3/15 text-category-3 border-category-3/40",
    idle: "border-category-3/40 text-foreground/70 hover:bg-category-3/10",
    active: "bg-category-3/20 text-category-3 border-category-3 font-semibold",
    dot: "bg-category-3",
  },
  {
    soft: "bg-category-4/15 text-category-4 border-category-4/40",
    idle: "border-category-4/40 text-foreground/70 hover:bg-category-4/10",
    active: "bg-category-4/20 text-category-4 border-category-4 font-semibold",
    dot: "bg-category-4",
  },
  {
    soft: "bg-category-5/15 text-category-5 border-category-5/40",
    idle: "border-category-5/40 text-foreground/70 hover:bg-category-5/10",
    active: "bg-category-5/20 text-category-5 border-category-5 font-semibold",
    dot: "bg-category-5",
  },
  {
    soft: "bg-category-6/15 text-category-6 border-category-6/40",
    idle: "border-category-6/40 text-foreground/70 hover:bg-category-6/10",
    active: "bg-category-6/20 text-category-6 border-category-6 font-semibold",
    dot: "bg-category-6",
  },
  {
    soft: "bg-category-7/15 text-category-7 border-category-7/40",
    idle: "border-category-7/40 text-foreground/70 hover:bg-category-7/10",
    active: "bg-category-7/20 text-category-7 border-category-7 font-semibold",
    dot: "bg-category-7",
  },
  {
    soft: "bg-category-8/15 text-category-8 border-category-8/40",
    idle: "border-category-8/40 text-foreground/70 hover:bg-category-8/10",
    active: "bg-category-8/20 text-category-8 border-category-8 font-semibold",
    dot: "bg-category-8",
  },
] as const;

/**
 * Category ids are append-only on the contract, so an id always maps to the same color.
 * When there are more categories than colors the palette wraps around.
 */
export const getCategoryStyle = (id: number) => CATEGORY_STYLES[id % CATEGORY_STYLES.length];
