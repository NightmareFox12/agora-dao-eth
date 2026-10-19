"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Loader, Rocket, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { MarkdownEditor } from "~~/components/MarkdownEditor";
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
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Textarea } from "~~/components/ui/shadcn/textarea";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useEventsAddress } from "~~/hooks/useEventsAddress";
import { sha256Hex } from "~~/lib/files";
import {
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_SUMMARY_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EventFormSchema,
  type EventFormValues,
  type EventMetadata,
} from "~~/lib/schemes/event.scheme";
import { authorizeUploads, prepareImage, uploadFile } from "~~/lib/uploadClient";
import { cn } from "~~/lib/utils";
import { useDaoStore } from "~~/services/store/dao.store";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

type UploadStep = "idle" | "sign" | "upload" | "wallet";

const SUBMIT_LABELS: Record<UploadStep, string> = {
  idle: "Publicar evento",
  sign: "Firma para autorizar los archivos...",
  upload: "Subiendo archivos...",
  wallet: "Confirma en tu wallet...",
};

// Default start time: tomorrow at 19:00 (local). Shown in the datetime-local input.
const defaultStartsAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

export const CreateEventForm: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { daoAddress } = useDaoStore();
  const eventsAddress = useEventsAddress();
  const { isMember, isAdmin, isLoading: rolesLoading } = useDaoRoles();
  const canCreateEvents = isMember || isAdmin;

  //states
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");

  // Form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      summary: "",
      location: "",
      startsAt: defaultStartsAt(),
      maxAttendees: 0,
      description: "",
      cover: undefined,
    },
  });
  const coverFile = form.watch("cover");

  const [coverPreview, setCoverPreview] = useState<string>();
  useEffect(() => {
    if (coverFile === undefined) {
      setCoverPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  //Smart contract
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgoraEvents",
    contractAddress: eventsAddress,
  });

  //consts
  const busy = uploadStep !== "idle";

  const onSubmit = async (data: EventFormValues) => {
    if (eventsAddress === undefined || address === undefined || daoAddress === "") return;

    let phase: UploadStep = "sign";
    try {
      let metadataHash: `0x${string}` = ZERO_HASH;

      // Only upload metadata if the user filled the description or added a cover
      const hasExtendedDetails = data.description.trim().length > 0 || data.cover !== undefined;

      if (hasExtendedDetails) {
        setUploadStep("sign");

        const preparedCover = data.cover ? await prepareImage(data.cover) : undefined;

        const metadata: EventMetadata = {
          version: 1,
          description: data.description.trim(),
          cover: preparedCover?.name ?? null,
        };
        const detailsBytes = new TextEncoder().encode(JSON.stringify(metadata));
        const detailsHash = await sha256Hex(detailsBytes);

        const hashes = preparedCover ? [preparedCover.hash, detailsHash] : [detailsHash];
        const authorization = await authorizeUploads({
          action: "event",
          hashes,
          dao: daoAddress,
          address,
          chainId,
          signMessage: message => signMessageAsync({ message }),
        });

        phase = "upload";
        setUploadStep("upload");
        if (preparedCover) await uploadFile("event-cover", preparedCover.bytes, authorization);
        await uploadFile("event-details", detailsBytes, authorization);

        metadataHash = `0x${detailsHash}`;
      }

      phase = "wallet";
      setUploadStep("wallet");

      const startsAt = BigInt(Math.floor(new Date(data.startsAt).getTime() / 1000));

      await writeContractAsync({
        functionName: "createEvent",
        args: [data.title, data.summary, startsAt, data.location, BigInt(data.maxAttendees), metadataHash],
      });

      toast.success("¡Evento publicado!");
      router.push("/events");
    } catch (err) {
      console.error(err);
      if (phase !== "wallet") {
        const rejected = err instanceof Error && /reject|denied/i.test(err.message);
        toast.error(
          rejected
            ? "Cancelaste la firma. No se publicó nada."
            : err instanceof Error
              ? err.message
              : "No se pudo publicar el evento.",
        );
      }
    } finally {
      setUploadStep("idle");
    }
  };

  if (rolesLoading || eventsAddress === undefined) {
    return (
      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!canCreateEvents) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="m-0 text-2xl font-bold">No puedes publicar eventos</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Solo los miembros de la DAO pueden publicar eventos. Únete a la DAO para empezar.
        </p>
        <Button asChild>
          <Link href="/events">Volver a los eventos</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a los eventos
        </Link>
        <h1 className="m-0 text-3xl font-bold tracking-tight">Nuevo evento</h1>
        <p className="m-0 text-muted-foreground">
          Un título claro y una fecha concreta son lo más importante. La descripción y la portada son opcionales.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <fieldset disabled={busy} className="m-0 space-y-4 border-0 p-0">
            <Card>
              <CardHeader>
                <CardTitle>Lo básico</CardTitle>
                <CardDescription>Esto es lo que verán los miembros en la lista.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Título <span className="font-bold text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Meetup de noviembre" {...field} />
                      </FormControl>
                      <div className="flex w-full justify-between px-1">
                        {fieldState.error === undefined && <span />}
                        <FormMessage className="-my-1" />
                        <FormDescription className="-my-1">
                          {field.value.length}/{EVENT_TITLE_MAX_LENGTH}
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
                        Resumen <span className="font-bold text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Una o dos frases que expliquen el evento."
                          className="h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex w-full justify-between px-1">
                        {fieldState.error === undefined && <span />}
                        <FormMessage className="-my-1" />
                        <FormDescription className="-my-1">
                          {field.value.length}/{EVENT_SUMMARY_MAX_LENGTH}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startsAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Fecha y hora <span className="font-bold text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>Como mínimo, dentro de una hora.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value}
                            onChange={e => field.onChange(Number(e.target.value) || 0)}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormDescription>0 = sin límite.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Ubicación <span className="font-bold text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Café de la Esquina, calle Ejemplo 5 — o https://meet.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <div className="flex w-full justify-between px-1">
                        {fieldState.error === undefined && <span />}
                        <FormMessage className="-my-1" />
                        <FormDescription className="-my-1">
                          {field.value.length}/{EVENT_LOCATION_MAX_LENGTH}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portada y descripción</CardTitle>
                <CardDescription>Opcionales. Si no las usas, el evento se publica sin archivos extra.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cover"
                  render={() => (
                    <FormItem>
                      <FormLabel>Portada</FormLabel>
                      {coverPreview ? (
                        <div className="relative aspect-video overflow-hidden rounded-lg border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverPreview} alt="Portada" className="size-full object-cover" />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2 size-7"
                            aria-label="Quitar portada"
                            onClick={() => form.setValue("cover", undefined, { shouldValidate: true })}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:bg-accent">
                          <ImagePlus className="size-6" />
                          Añadir una portada
                          <input
                            type="file"
                            accept=".jpeg,.png,.jpg"
                            className="sr-only"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!["image/jpeg", "image/png"].includes(file.type)) {
                                toast.error("Solo PNG o JPG.");
                                return;
                              }
                              if (file.size >= 1024 * 1024) {
                                toast.error("La imagen debe pesar menos de 1 MB.");
                                return;
                              }
                              form.setValue("cover", file, { shouldValidate: true });
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                      <FormDescription>JPG o PNG de menos de 1 MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        invalid={fieldState.error !== undefined}
                        placeholder={
                          "¿De qué va el evento? ¿Qué hay que llevar? ¿Dónde aparcar?\n\nPuedes dar formato con la barra de arriba."
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className={cn("flex items-center justify-between gap-2 border-t pt-4")}>
              <Button asChild variant="outline" type="button">
                <Link href="/events">Cancelar</Link>
              </Button>
              <Button type="submit" size="lg" disabled={busy || !form.formState.isValid}>
                {busy ? <Loader className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {SUBMIT_LABELS[uploadStep]}
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
    </main>
  );
};
