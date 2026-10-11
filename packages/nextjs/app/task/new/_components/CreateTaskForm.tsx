"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskCard } from "../../_components/TaskCard";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ImagePlus, Info, Loader, Plus, Rocket, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Markdown } from "~~/components/Markdown";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~~/components/ui/shadcn/form";
import { Input } from "~~/components/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/shadcn/select";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { Textarea } from "~~/components/ui/shadcn/textarea";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useTasksAddress } from "~~/hooks/useTasksAddress";
import { getCategoryStyle } from "~~/lib/categoryColors";
import {
  TASK_CRITERION_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_IMAGE_MAX_BYTES,
  TASK_LINK_LABEL_MAX_LENGTH,
  TASK_MAX_CRITERIA,
  TASK_MAX_IMAGES,
  TASK_MAX_LINKS,
  TASK_SUMMARY_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TaskFormSchema,
  type TaskFormValues,
  type TaskMetadata,
} from "~~/lib/schemes/task.scheme";
import { TASK_STATUS } from "~~/lib/tasks";
import { cn } from "~~/lib/utils";

const WORK_DAY_OPTIONS = [7, 10, 14, 21, 30];

type Step = "idle" | "images" | "details" | "wallet";

const SUBMIT_LABELS: Record<Step, string> = {
  idle: "Publicar tarea",
  images: "Subiendo imágenes...",
  details: "Guardando detalles...",
  wallet: "Confirma en tu wallet...",
};

export const CreateTaskForm: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const tasksAddress = useTasksAddress();
  const { canCreateTasks, isLoading: rolesLoading } = useDaoRoles();

  //states
  const [step, setStep] = useState<Step>("idle");

  // Form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      summary: "",
      category: undefined,
      description: "",
      images: [],
      criteria: [{ text: "" }],
      links: [{ label: "", url: "" }],
      workDays: 30,
      reward: "",
    },
  });
  const criteria = useFieldArray({ control: form.control, name: "criteria" });
  const links = useFieldArray({ control: form.control, name: "links" });
  const values = form.watch();

  //Smart contract
  const { writeContractAsync: writeTasksAsync } = useScaffoldWriteContract({
    contractName: "AgoraTasks",
    contractAddress: tasksAddress,
  });

  //consts
  const isBusy = step !== "idle";

  //memos
  const rewardInWei = useMemo(() => {
    try {
      return parseEther(values.reward);
    } catch {
      return undefined;
    }
  }, [values.reward]);

  const notEnoughBalance = balance !== undefined && rewardInWei !== undefined && rewardInWei > balance.value;

  const imagePreviews = useMemo(() => values.images.map(file => URL.createObjectURL(file)), [values.images]);

  //effects
  useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  //functions
  const addImages = (files: FileList | null) => {
    if (!files) return;

    const current = form.getValues("images");
    const accepted: File[] = [];

    for (const file of Array.from(files)) {
      if (current.length + accepted.length >= TASK_MAX_IMAGES) {
        toast.error(`Máximo ${TASK_MAX_IMAGES} imágenes.`);
        break;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error(`${file.name}: solo se permiten imágenes JPG o PNG.`);
        continue;
      }
      if (file.size >= TASK_IMAGE_MAX_BYTES) {
        toast.error(`${file.name}: la imagen debe pesar menos de 1 MB.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) form.setValue("images", [...current, ...accepted], { shouldValidate: true });
  };

  const onSubmit = async (data: TaskFormValues) => {
    if (tasksAddress === undefined) return;

    let phase: Step = "images";
    try {
      // 1. images
      setStep("images");
      const images: string[] = [];
      for (const file of data.images) {
        const formData = new FormData();
        formData.append("name", data.title);
        formData.append("logo", file);

        const res = await fetch("/api/upload-image", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.response);
        images.push(json.cid);
      }

      // 2. details (the long description, images, criteria and links live on IPFS)
      phase = "details";
      setStep("details");
      const metadata: TaskMetadata = {
        version: 1,
        description: data.description,
        images,
        criteria: data.criteria.map(x => x.text).filter(text => text.length > 0),
        links: data.links.filter(x => x.url.length > 0),
      };

      const res = await fetch("/api/upload-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.response);

      // 3. the transaction: the reward is deposited with it
      phase = "wallet";
      setStep("wallet");
      await writeTasksAsync({
        functionName: "createTask",
        args: [data.title, data.summary, BigInt(data.category), BigInt(data.workDays), json.cid],
        value: parseEther(data.reward),
      });

      toast.success("¡Tarea publicada!");
      router.push("/task");
    } catch (err) {
      console.error(err);
      // wallet errors are already shown by the transaction notifications
      if (phase !== "wallet") toast.error(err instanceof Error ? err.message : "No se pudo publicar la tarea.");
    } finally {
      setStep("idle");
    }
  };

  if (rolesLoading || tasksAddress === undefined) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!canCreateTasks) {
    return (
      <main className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <h1 className="m-0 text-2xl font-bold">No puedes publicar tareas</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Solo los gestores de tareas y los administradores de la DAO pueden publicarlas. Pídele a un administrador que
          te asigne el rol.
        </p>
        <Button asChild>
          <Link href="/task">Volver a las tareas</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="space-y-1">
        <Link
          href="/task"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a las tareas
        </Link>
        <h1 className="m-0 text-3xl font-bold tracking-tight">Nueva tarea</h1>
        <p className="m-0 text-muted-foreground">
          Describe el trabajo con claridad: lo que escribas aquí es lo que se acuerda y no se podrá cambiar después.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <fieldset disabled={isBusy} className="m-0 grid min-w-0 gap-6 border-0 p-0 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Basics */}
              <Card>
                <CardHeader>
                  <CardTitle>Lo básico</CardTitle>
                  <CardDescription>Lo primero que verán los miembros en la lista de tareas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Título <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Diseño y desarrollo de la landing page" {...field} />
                        </FormControl>
                        <div className="flex w-full justify-between px-1">
                          {fieldState.error === undefined && <span />}
                          <FormMessage className="-my-1" />
                          <FormDescription className="-my-1">
                            {field.value.length}/{TASK_TITLE_MAX_LENGTH}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Resumen <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Una o dos frases que expliquen la tarea en la tarjeta."
                            className="h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex w-full justify-between px-1">
                          {fieldState.error === undefined && <span />}
                          <FormMessage className="-my-1" />
                          <FormDescription className="-my-1">
                            {field.value.length}/{TASK_SUMMARY_MAX_LENGTH}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Categoría <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {TASK_CATEGORIES.map((name, id) => {
                            const isSelected = field.value === id;
                            const style = getCategoryStyle(id);

                            return (
                              <Badge
                                key={id}
                                asChild
                                variant="outline"
                                className={cn("px-3 py-1 text-sm", isSelected ? style.active : style.idle)}
                              >
                                <button
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => field.onChange(id)}
                                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isSelected && <Check />}
                                  {name}
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage className="-my-1" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                  <CardDescription>
                    Se guardan en IPFS: quedan enlazados a la tarea y nadie puede alterarlos después.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Descripción <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <Tabs defaultValue="write">
                          <TabsList>
                            <TabsTrigger value="write">Escribir</TabsTrigger>
                            <TabsTrigger value="preview">Vista previa</TabsTrigger>
                          </TabsList>
                          <TabsContent value="write">
                            <FormControl>
                              <Textarea
                                placeholder={
                                  "Explica qué hay que hacer, para qué sirve y qué esperas recibir.\n\nPuedes usar formato: **negrita**, listas con - y títulos con ##."
                                }
                                className="h-64 resize-y"
                                {...field}
                              />
                            </FormControl>
                          </TabsContent>
                          <TabsContent value="preview">
                            <div className="min-h-64 rounded-lg border p-4">
                              {field.value.trim().length > 0 ? (
                                <Markdown>{field.value}</Markdown>
                              ) : (
                                <p className="m-0 text-sm text-muted-foreground">Todavía no hay nada que mostrar.</p>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                        <div className="flex w-full justify-between px-1">
                          {fieldState.error === undefined && <span />}
                          <FormMessage className="-my-1" />
                          <FormDescription className="-my-1">
                            {field.value.length}/{TASK_DESCRIPTION_MAX_LENGTH}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Images */}
                  <FormField
                    control={form.control}
                    name="images"
                    render={() => (
                      <FormItem>
                        <FormLabel>Imágenes</FormLabel>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {imagePreviews.map((url, index) => (
                            <div key={url} className="relative aspect-video overflow-hidden rounded-lg border">
                              {
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt={`Imagen ${index + 1}`} className="size-full object-cover" />
                              }
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute right-1.5 top-1.5 size-7"
                                aria-label="Quitar imagen"
                                onClick={() =>
                                  form.setValue(
                                    "images",
                                    values.images.filter((_, i) => i !== index),
                                    { shouldValidate: true },
                                  )
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}

                          {values.images.length < TASK_MAX_IMAGES && (
                            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:bg-accent">
                              <ImagePlus className="size-6" />
                              Añadir imagen
                              <input
                                type="file"
                                multiple
                                accept=".jpeg,.png,.jpg"
                                className="sr-only"
                                onChange={e => {
                                  addImages(e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <FormDescription>
                          Opcional. Hasta {TASK_MAX_IMAGES} imágenes JPG o PNG de menos de 1 MB: referencias, bocetos,
                          capturas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Acceptance criteria */}
                  <div className="space-y-2">
                    <FormLabel>Criterios de aceptación</FormLabel>
                    <FormDescription>
                      ¿Cómo sabremos que la tarea está terminada? Si hay una disputa, el árbitro los usará para decidir.
                    </FormDescription>
                    {criteria.fields.map((item, index) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name={`criteria.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder={`Criterio ${index + 1}, e.g. Se ve bien en móvil`}
                                  maxLength={TASK_CRITERION_MAX_LENGTH}
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Quitar criterio"
                                onClick={() => criteria.remove(index)}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={criteria.fields.length >= TASK_MAX_CRITERIA}
                      onClick={() => criteria.append({ text: "" })}
                    >
                      <Plus className="size-4" />
                      Añadir criterio
                    </Button>
                  </div>

                  {/* References */}
                  <div className="space-y-2">
                    <FormLabel>Enlaces de referencia</FormLabel>
                    <FormDescription>
                      Ejemplos, marcas o archivos que quieres que se tengan en cuenta. Recuerda que todo lo que escribas
                      aquí es público.
                    </FormDescription>
                    {links.fields.map((item, index) => (
                      <div key={item.id} className="flex flex-col gap-2 sm:flex-row">
                        <FormField
                          control={form.control}
                          name={`links.${index}.label`}
                          render={({ field }) => (
                            <FormItem className="sm:w-1/3">
                              <FormControl>
                                <Input
                                  placeholder="Nombre, e.g. Guía de marca"
                                  maxLength={TASK_LINK_LABEL_MAX_LENGTH}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`links.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Quitar enlace"
                                  onClick={() => links.remove(index)}
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={links.fields.length >= TASK_MAX_LINKS}
                      onClick={() => links.append({ label: "", url: "" })}
                    >
                      <Plus className="size-4" />
                      Añadir enlace
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Deadline and reward */}
              <Card>
                <CardHeader>
                  <CardTitle>Plazo y recompensa</CardTitle>
                  <CardDescription>
                    La recompensa se deposita al publicar y queda retenida en el contrato.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="workDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plazo de entrega</FormLabel>
                        <Select value={field.value.toString()} onValueChange={value => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger className="w-full sm:w-64">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WORK_DAY_OPTIONS.map(days => (
                              <SelectItem key={days} value={days.toString()}>
                                {days} días
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Lo que tendrá quien tome la tarea, desde que la toma, para entregar el trabajo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Recompensa <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <div className="relative sm:w-64">
                          <FormControl>
                            <Input inputMode="decimal" placeholder="0.5" className="pr-14" {...field} />
                          </FormControl>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            ETH
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-4 px-1">
                          <FormMessage className="-my-1" />
                          {balance !== undefined && (
                            <FormDescription className={cn("-my-1", notEnoughBalance && "text-destructive")}>
                              {notEnoughBalance ? "Saldo insuficiente. " : ""}Tu saldo: {formatEther(balance.value)} ETH
                            </FormDescription>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-2">
                <p className="m-0 text-sm font-medium text-muted-foreground">Así se verá en la lista</p>
                <TaskCard
                  title={values.title.trim() || "Título de la tarea"}
                  summary={values.summary.trim() || "Aquí irá el resumen de la tarea."}
                  categoryId={values.category}
                  reward={rewardInWei ?? 0n}
                  status={TASK_STATUS.Open}
                  workDays={values.workDays}
                  creator={address}
                />
              </div>

              <Card className="gap-3 py-4">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Resumen del depósito</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recompensa</span>
                    <span>{rewardInWei !== undefined ? formatEther(rewardInWei) : "0"} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisión</span>
                    <span>0 ETH</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total a depositar</span>
                    <span>{rewardInWei !== undefined ? formatEther(rewardInWei) : "0"} ETH</span>
                  </div>
                  <p className="m-0 flex gap-2 pt-1 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Si nadie toma la tarea en 30 días, la recompensa se te devuelve. Además pagarás la tarifa de la
                      red.
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isBusy || !form.formState.isValid || notEnoughBalance}
              >
                {isBusy ? <Loader className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {SUBMIT_LABELS[step]}
              </Button>
            </aside>
          </fieldset>
        </form>
      </Form>
    </main>
  );
};
