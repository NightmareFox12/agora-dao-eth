import React, { Suspense } from "react";
import { TaskCard } from "./TaskCard";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";

const MOCK_TASKS = [
  {
    id: "1",
    title: "Auditoría de Smart Contracts v2",
    description:
      "Revisión exhaustiva de la nueva implementación de gobernanza para detectar posibles vulnerabilidades.",
    reward: "500 USDC",
    status: "open" as const,
    category: "Desarrollo",
    priority: "high" as const,
    deadline: "5 días",
  },
  {
    id: "2",
    title: "Rediseño de Landing Page",
    description: "Actualizar la interfaz de usuario principal siguiendo las nuevas guías de marca de la DAO.",
    reward: "350 USDC",
    status: "in-progress" as const,
    category: "Diseño",
    priority: "medium" as const,
    deadline: "12 días",
  },
  {
    id: "3",
    title: "Artículo de Investigación: MEV",
    description: "Escribir un reporte detallado sobre el impacto de MEV en nuestra red y posibles mitigaciones.",
    reward: "200 USDC",
    status: "open" as const,
    category: "Contenido",
    priority: "low" as const,
    deadline: "8 días",
  },
  {
    id: "4",
    title: "Integración de Oráculos",
    description: "Implementar feeds de precios externos para los nuevos pools de liquidez propuestos.",
    reward: "600 USDC",
    status: "completed" as const,
    category: "Desarrollo",
    priority: "high" as const,
    deadline: "Finalizado",
  },
];

export const TaskSection: React.FC = () => {
  return (
    <main className="container mx-auto py-2 px-4 space-y-6">
      <Suspense fallback={null}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tareas de la DAO</h1>
            <p className="text-muted-foreground">Contribuye a la organización y gana recompensas.</p>
          </div>
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Proponer Tarea
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tareas..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Tabs defaultValue="all" className="w-full md:w-auto">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="open">Abiertas</TabsTrigger>
                <TabsTrigger value="active">Activas</TabsTrigger>
                <TabsTrigger value="done">Hechas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TASKS.map(task => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      </Suspense>
    </main>
  );
};
