import { RouteObject } from 'react-router-dom';
import { UserRole, Resource } from '../../types';
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
    icon: LucideIcon;
    label: string;
    path: string;
    resource?: Resource; // Para checagem de permissão extra
    roles?: UserRole[]; // Caso queira restringir dentro do módulo
}

export interface AppModule {
    id: string;
    allowedRoles: UserRole[];
    routes: RouteObject[];
    sidebarItems: SidebarItem[];
}
