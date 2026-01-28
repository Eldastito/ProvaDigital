import React from 'react';
import { Search, Filter } from 'lucide-react';
import { UserRole } from '../../../types';
import { translateUserRole } from '../../../utils/translations';

interface UserFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    roleFilter: UserRole | 'ALL';
    onRoleFilterChange: (value: UserRole | 'ALL') => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleFilterChange
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none appearance-none bg-white font-medium text-slate-700"
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value as UserRole | 'ALL')}
                >
                    <option value="ALL">Todas as Funções</option>
                    {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{translateUserRole(role)}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
