import { formatRelativeTime } from "~~/lib/utils";

// Same order as the Status and Choice enums in AgoraVotes.sol
export const PROPOSAL_STATUS = { Active: 0, Approved: 1, Rejected: 2, QuorumNotReached: 3, Executed: 4 } as const;
export const VOTE_CHOICE = { Against: 0, For: 1, Abstain: 2 } as const;
export const ACTION_KIND = { None: 0, PayETH: 1 } as const;

// Every class is written out in full so Tailwind can detect it.
export const PROPOSAL_STATUS_META: Record<number, { label: string; className: string }> = {
  [PROPOSAL_STATUS.Active]: {
    label: "En votación",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  [PROPOSAL_STATUS.Approved]: {
    label: "Aprobada",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  [PROPOSAL_STATUS.Rejected]: {
    label: "Rechazada",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  [PROPOSAL_STATUS.QuorumNotReached]: {
    label: "Sin quorum",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  [PROPOSAL_STATUS.Executed]: {
    label: "Ejecutada",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export const CHOICE_META: Record<number, { label: string; className: string }> = {
  [VOTE_CHOICE.For]: { label: "A favor", className: "bg-emerald-500 text-white dark:bg-emerald-600" },
  [VOTE_CHOICE.Against]: { label: "En contra", className: "bg-rose-500 text-white dark:bg-rose-600" },
  [VOTE_CHOICE.Abstain]: { label: "Abstención", className: "bg-slate-400 text-white dark:bg-slate-500" },
};

/** "Cierra dentro de 3 días", "Voto cerrado hace 2 horas". Undefined when the proposal is already finalized. */
export const getVotingDeadlineText = (status: number, deadline: bigint) => {
  if (status !== PROPOSAL_STATUS.Active) return undefined;

  const seconds = Number(deadline);
  const relative = formatRelativeTime(seconds);
  return seconds * 1000 < Date.now() ? `Voto cerrado ${relative}` : `Cierra ${relative}`;
};

/** A proposal as AgoraVotes.getProposal returns it */
export type ProposalAction = {
  /** 0 = none (text proposal), 1 = PayETH */
  kind: number;
  /** Recipient address for payouts, zero address for text */
  target: string;
  /** Amount in wei for payouts */
  value: bigint;
};

export type ProposalData = {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  status: number;
  createdAt: bigint;
  votingDeadline: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  totalMembersAtCreation: bigint;
  action: ProposalAction;
};

/** How a proposal is doing right now: counts, percentages and whether quorum is already met. */
export const summarizeProposal = (proposal: ProposalData, quorumPercent = 20) => {
  const totalVotes = Number(proposal.forVotes + proposal.againstVotes + proposal.abstainVotes);
  const totalMembers = Number(proposal.totalMembersAtCreation);
  const quorumVotes = Math.ceil((totalMembers * quorumPercent) / 100);

  const percent = (value: bigint) => (totalVotes === 0 ? 0 : (Number(value) * 100) / totalVotes);

  return {
    totalVotes,
    totalMembers,
    quorumVotes,
    quorumMet: totalVotes >= quorumVotes,
    quorumProgress: quorumVotes === 0 ? 100 : Math.min(100, (totalVotes * 100) / quorumVotes),
    forPercent: percent(proposal.forVotes),
    againstPercent: percent(proposal.againstVotes),
    abstainPercent: percent(proposal.abstainVotes),
  };
};
