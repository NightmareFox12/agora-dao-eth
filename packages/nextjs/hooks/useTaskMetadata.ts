import { useQuery } from "@tanstack/react-query";
import { fetchTaskMetadata } from "~~/lib/storage";

/** Long description, images, criteria and links of a task, checked against the hash in the contract. They never change, so they are cached for good. */
export const useTaskMetadata = (hash: string | undefined) =>
  useQuery({
    queryKey: ["task-metadata", hash],
    queryFn: () => fetchTaskMetadata(hash!),
    enabled: hash !== undefined && hash.length > 0,
    staleTime: Infinity,
    retry: 1,
  });
