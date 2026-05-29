// TanStack Query hooks. Mutations invalidate the relevant caches.
// Spec: docs/features/0003-local-web-server.md

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Entry, ListQuery, NewEntry } from "@opendiary/core";
import { api } from "./client.ts";

const keys = {
  entries: (query: ListQuery) => ["entries", query] as const,
  entry: (id: string) => ["entry", id] as const,
};

export function useEntries(query: ListQuery = {}) {
  return useQuery({ queryKey: keys.entries(query), queryFn: () => api.list(query) });
}

export function useEntry(id: string | null) {
  return useQuery({
    queryKey: keys.entry(id ?? ""),
    queryFn: () => api.get(id as string),
    enabled: id != null,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: NewEntry) => api.create(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Entry> }) => api.update(id, patch),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: keys.entry(entry.id) });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}
