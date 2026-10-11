"use client";

import { Funnel, Loader, X } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~~/components/ui/shadcn/dropdown-menu";
import { Input } from "~~/components/ui/shadcn/input";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { cn } from "~~/lib/utils";
import { useDaoStore } from "~~/services/store/dao.store";

export const SearchDaos: React.FC = () => {
  const { selectedDao, setSelectedDao, clearDaoFilters } = useDaoStore();

  //smart contract
  const { data: daoCategories, isLoading: daoCategoriesLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaoCategories",
  });

  //consts
  const activeFilters = selectedDao.categories.length + (selectedDao.onlyMine ? 1 : 0);

  //functions
  const toggleCategory = (id: number) => {
    const categories = selectedDao.categories.includes(id)
      ? selectedDao.categories.filter(x => x !== id)
      : [...selectedDao.categories, id];

    setSelectedDao({ ...selectedDao, categories });
  };

  return (
    <>
      <Input
        className="w-full md:w-1/4"
        placeholder="Buscar DAOs..."
        value={selectedDao.name}
        onChange={e => setSelectedDao({ ...selectedDao, name: e.target.value })}
      />
      <DropdownMenu>
        {/* Button trigger */}
        <DropdownMenuTrigger asChild>
          <Button variant={activeFilters > 0 ? "default" : "outline"} disabled={daoCategoriesLoading}>
            {daoCategoriesLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Funnel className="h-4 w-4" />}
            {activeFilters === 0 ? "Filtros" : `${activeFilters} ${activeFilters === 1 ? "filtro" : "filtros"}`}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={selectedDao.onlyMine}
            onCheckedChange={checked => setSelectedDao({ ...selectedDao, onlyMine: checked === true })}
            onSelect={e => e.preventDefault()}
          >
            Mis DAOs
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="pb-0">Categorías</DropdownMenuLabel>
          <p className="px-2 pb-1.5 text-xs text-muted-foreground">Muestra las DAOs con cualquiera de las elegidas</p>
          <DropdownMenuGroup>
            {daoCategories?.map((category, id) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={selectedDao.categories.includes(id)}
                onCheckedChange={() => toggleCategory(id)}
                onSelect={e => e.preventDefault()}
              >
                <span className={cn("size-2 rounded-full", getCategoryStyle(id).dot)} />
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={activeFilters === 0} onSelect={clearDaoFilters}>
            <X className="h-4 w-4" />
            Borrar filtros
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
