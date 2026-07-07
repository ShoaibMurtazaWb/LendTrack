/** Global header search is shown only on the dashboard. */
export function routeShowsGlobalSearch(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}
