export interface Menu {
  id: string;
  name: string;
  nameEn: string;
  path: string | null;
  icon: string | null;
  depth: number;
  order: number;
  requiredRole: 'USER' | 'ADMIN' | null;
  children: Menu[];
}
