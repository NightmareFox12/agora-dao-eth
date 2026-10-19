import { isAddress, parseEther } from "viem";
import { z } from "zod";

// Limits that AgoraVotes.sol enforces too (MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MIN_VOTING_DAYS, MAX_VOTING_DAYS).
// If you change one of them, change it in both places. The form counters read from here too.
export const PROPOSAL_TITLE_MAX_LENGTH = 100;
export const PROPOSAL_DESCRIPTION_MAX_LENGTH = 2000;
export const PROPOSAL_MIN_VOTING_DAYS = 3;
export const PROPOSAL_MAX_VOTING_DAYS = 14;

// Lower limits are only enforced by the form.
const PROPOSAL_TITLE_MIN_LENGTH = 5;
const PROPOSAL_DESCRIPTION_MIN_LENGTH = 30;

export const ProposalFormSchema = z
  .object({
    /** "text" or "payout" */
    kind: z.enum(["text", "payout"]),
    recipient: z.string().trim().optional(),
    /** ETH amount as typed by the user, e.g. "0.5" */
    amount: z.string().trim().optional(),
    title: z
      .string()
      .trim()
      .min(PROPOSAL_TITLE_MIN_LENGTH, {
        message: `El título debe tener al menos ${PROPOSAL_TITLE_MIN_LENGTH} caracteres.`,
      })
      .max(PROPOSAL_TITLE_MAX_LENGTH, {
        message: `El título no puede superar los ${PROPOSAL_TITLE_MAX_LENGTH} caracteres.`,
      }),

    description: z
      .string()
      .trim()
      .min(PROPOSAL_DESCRIPTION_MIN_LENGTH, {
        message: `Explica la propuesta con al menos ${PROPOSAL_DESCRIPTION_MIN_LENGTH} caracteres.`,
      })
      .max(PROPOSAL_DESCRIPTION_MAX_LENGTH, {
        message: `La descripción no puede superar los ${PROPOSAL_DESCRIPTION_MAX_LENGTH} caracteres.`,
      }),

    votingDays: z
      .number()
      .int()
      .min(PROPOSAL_MIN_VOTING_DAYS, { message: `Mínimo ${PROPOSAL_MIN_VOTING_DAYS} días.` })
      .max(PROPOSAL_MAX_VOTING_DAYS, { message: `Máximo ${PROPOSAL_MAX_VOTING_DAYS} días.` }),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== "payout") return;

    const recipient = data.recipient ?? "";
    if (recipient.length === 0 || !isAddress(recipient)) {
      ctx.addIssue({
        code: "custom",
        path: ["recipient"],
        message: "Escribe una dirección válida (0x...).",
      });
    }

    const amount = data.amount ?? "";
    if (!/^\d+(\.\d{1,18})?$/.test(amount)) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Escribe un monto válido, por ejemplo 0.5" });
      return;
    }
    try {
      if (parseEther(amount) <= 0n) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "El monto debe ser mayor a cero." });
      }
    } catch {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "El monto no es válido." });
    }
  });

export type ProposalFormValues = z.infer<typeof ProposalFormSchema>;
