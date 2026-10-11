"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TaskCard } from "./TaskCard";
import { ClipboardList, Plus, Search } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/shadcn/select";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useTasksAddress } from "~~/hooks/useTasksAddress";
import { TASK_STATUS } from "~~/lib/tasks";

// Which statuses each tab shows
const TABS: Record<string, readonly number[] | undefined> = {
  all: undefined,
  open: [TASK_STATUS.Open],
  active: [TASK_STATUS.Taken, TASK_STATUS.Submitted, TASK_STATUS.Rejected, TASK_STATUS.Disputed],
  done: [TASK_STATUS.Completed, TASK_STATUS.Cancelled],
};

export const TaskSection: React.FC = () => {
  const tasksAddress = useTasksAddress();
  const { canCreateTasks } = useDaoRoles();

  //states
  const [search, setSearch] = useState<string>("");
  const [tab, setTab] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  //smart contract
  const { data: tasks, isLoading } = useScaffoldReadContract({
    contractName: "AgoraTasks",
    functionName: "getAllTasks",
    contractAddress: tasksAddress,
    query: { enabled: tasksAddress !== undefined },
  });

  //memos
  const tasksFiltered = useMemo(() => {
    const text = search.trim().toLowerCase();
    const statuses = TABS[tab];

    // newest first
    return [...(tasks ?? [])]
      .reverse()
      .filter(task => statuses === undefined || statuses.includes(task.status))
      .filter(task => category === "all" || Number(task.categoryId) === Number(category))
      .filter(
        task =>
          text.length === 0 || task.title.toLowerCase().includes(text) || task.summary.toLowerCase().includes(text),
      );
  }, [tasks, search, tab, category]);

  const hasTasks = (tasks?.length ?? 0) > 0;

  return (
    <main className="container mx-auto py-2 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas de la DAO</h1>
          <p className="text-muted-foreground">Contribuye a la organización y gana recompensas.</p>
        </div>
        {canCreateTasks ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/task/new">
              <Plus className="h-4 w-4" /> Nueva tarea
            </Link>
          </Button>
        ) : (
          <p className="m-0 max-w-xs text-xs text-muted-foreground md:text-right">
            Solo los gestores de tareas y los administradores publican tareas.
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="open">Abiertas</TabsTrigger>
              <TabsTrigger value="active">En curso</TabsTrigger>
              <TabsTrigger value="done">Cerradas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {TASK_CATEGORIES.map((name, id) => (
                <SelectItem key={id} value={id.toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tasksAddress === undefined || isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map(x => (
            <Skeleton key={x} className="h-56" />
          ))}
        </div>
      ) : tasksFiltered.length === 0 ? (
        <article className="flex flex-col items-center gap-3 py-16 text-center">
          <ClipboardList className="h-16 w-16 text-muted-foreground" />
          <h3 className="m-0 text-xl font-semibold">{hasTasks ? "Ninguna tarea coincide" : "Aún no hay tareas"}</h3>
          <p className="m-0 max-w-sm text-muted-foreground">
            {hasTasks
              ? "Prueba con otra búsqueda o cambia los filtros."
              : canCreateTasks
                ? "Publica la primera tarea de tu DAO."
                : "Cuando un gestor de tareas publique una, aparecerá aquí."}
          </p>
          {!hasTasks && canCreateTasks && (
            <Button asChild>
              <Link href="/task/new">
                <Plus className="h-4 w-4" /> Nueva tarea
              </Link>
            </Button>
          )}
        </article>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasksFiltered.map(task => (
            <TaskCard
              key={task.id.toString()}
              title={task.title}
              summary={task.summary}
              categoryId={Number(task.categoryId)}
              reward={task.reward}
              status={task.status}
              deadline={task.deadline}
              workDays={Number(task.workWindow / 86400n)}
              creator={task.creator}
              href={`/task/${task.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
};
