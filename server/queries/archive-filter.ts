export type ArchiveVisibility = "active" | "all" | "archived";

type ArchiveFilterQuery<TQuery> = {
  is(column: string, value: null): TQuery;
  not(column: string, operator: "is", value: null): TQuery;
};

export function applyArchiveVisibility<TQuery extends ArchiveFilterQuery<TQuery>>(
  query: TQuery,
  visibility: ArchiveVisibility = "active",
) {
  if (visibility === "all") {
    return query;
  }

  if (visibility === "archived") {
    return query.not("archived_at", "is", null);
  }

  return query.is("archived_at", null);
}
