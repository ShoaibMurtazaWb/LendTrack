/** App routes that render their own page-level search — hide the shell search there. */
export const ROUTES_WITH_PAGE_SEARCH = ["/loans", "/contacts"] as const;

export function routeHasPageSearch(pathname: string): boolean {
  return ROUTES_WITH_PAGE_SEARCH.some((route) => pathname.startsWith(route));
}
