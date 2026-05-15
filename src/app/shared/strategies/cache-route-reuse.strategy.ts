import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CacheRouteReuseStrategy implements RouteReuseStrategy {
  private _cache = new Map<object, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.data['reuse'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.routeConfig && handle) {
      this._cache.set(route.routeConfig, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return (
      route.data['reuse'] === true &&
      !!route.routeConfig &&
      this._cache.has(route.routeConfig)
    );
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig) return null;
    return this._cache.get(route.routeConfig) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  /** Fuerza re-fetch en la próxima visita a una ruta específica (por path). */
  invalidate(path: string): void {
    for (const [routeConfig, handle] of this._cache) {
      if ((routeConfig as { path?: string }).path === path) {
        this._cache.delete(routeConfig);
        (handle as { componentRef?: { destroy(): void } }).componentRef?.destroy();
        break;
      }
    }
  }
}
