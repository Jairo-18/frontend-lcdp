import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CacheRouteReuseStrategy implements RouteReuseStrategy {
  private readonly _cache = new Map<string, DetachedRouteHandle>();

  private _key(route: ActivatedRouteSnapshot): string | null {
    return (route.data['reuseKey'] as string) ?? null;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!this._key(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const key = this._key(route);
    if (key && handle) this._cache.set(key, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this._key(route);
    return !!(key && this._cache.has(key));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this._key(route);
    return key ? (this._cache.get(key) ?? null) : null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  /** Elimina la entrada del caché para que la próxima visita recree el componente. */
  invalidate(key: string): void {
    const handle = this._cache.get(key);
    if (handle) {
      this._cache.delete(key);
      (handle as { componentRef?: { destroy(): void } }).componentRef?.destroy();
    }
  }
}
