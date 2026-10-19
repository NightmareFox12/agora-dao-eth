import Link from "next/link";
import { VoteBar } from "./VoteBar";
import { Clock, UserRound, Users } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardFooter, CardHeader } from "~~/components/ui/shadcn/card";
import { cn, shortAddress } from "~~/lib/utils";
import { PROPOSAL_STATUS_META, type ProposalData, getVotingDeadlineText, summarizeProposal } from "~~/lib/votes";

/** Compact view of a proposal, used in the list. */
export const ProposalCard: React.FC<{ proposal: ProposalData; href?: string }> = ({ proposal, href }) => {
  const statusMeta = PROPOSAL_STATUS_META[proposal.status];
  const summary = summarizeProposal(proposal);
  const deadlineText = getVotingDeadlineText(proposal.status, proposal.votingDeadline);

  const card = (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-normal">
            #{proposal.id.toString()}
          </Badge>
          <Badge className={cn("border-transparent", statusMeta?.className)}>{statusMeta?.label}</Badge>
        </div>
        <h3 className="m-0 font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">{proposal.title}</h3>
      </CardHeader>

      <CardContent className="space-y-3">
        <VoteBar
          forPercent={summary.forPercent}
          againstPercent={summary.againstPercent}
          abstainPercent={summary.abstainPercent}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-600" />
            {proposal.forVotes.toString()} a favor
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-500 dark:bg-rose-600" />
            {proposal.againstVotes.toString()} en contra
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {summary.totalVotes} de {summary.totalMembers}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <UserRound className="h-3.5 w-3.5" />
          {shortAddress(proposal.creator)}
        </span>
        {deadlineText !== undefined && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {deadlineText}
          </span>
        )}
      </CardFooter>
    </Card>
  );

  if (href === undefined) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {card}
    </Link>
  );
};
