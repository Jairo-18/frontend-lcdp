export type Surface =
  | 'wall-left' | 'wall-back' | 'wall-right'
  | 'ceiling' | 'floor'
  | 'facade-left' | 'facade-right';

export type RoomView = 'alcoba' | 'sala' | 'cocina' | 'fachada';

export interface SurfaceConfig {
  key: Surface;
  label: string;
  icon: string;
  color: () => string;
  set: (h: string) => void;
}
