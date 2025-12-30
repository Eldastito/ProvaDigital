
import React, { useState } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, Brain, X } from 'lucide-react';
import { AppState, Item, DifficultyLevel, ItemOrigin, Exam, QuestionType } from '../types';
import { Badge } from './ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchItems, fetchExams, deleteItem } from '../services/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

export interface ItemRowProps {
    item: Item;
    onSelect: (i: Item) => void;
    getItemHistory: (id: string) => any[];
    canEdit: boolean;
    canDelete: boolean;
    onDelete: (id: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onSelect, getItemHistory, canEdit, canDelete, onDelete }) => {
    const history = getItemHistory(item.id);
    const realUsageCount = history?.length || 0;
    
    let typeLabel = 'Múltipla Escolha';
    if (item.type === QuestionType.TRUE_FALSE) typeLabel = 'V ou F';
    if (item.type === QuestionType.ESSAY) typeLabel = 'Discursiva';
    if (item.type === QuestionType.REDACTION) typeLabel = 'Redação';

    return (
        <div className="flex items-center border-b border-slate-100 hover:bg-slate-50 transition px-8 py-5 text-sm group">
             <div className="flex-1 pr-6 min-w-0">
                 <div className="font-black text-slate-800 truncate cursor-pointer hover:text-indigo-600 text-base" onClick={() => onSelect(item)}>
                     {item.statement}
                 </div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.subject} • {typeLabel}</div>
             </div>
             <div className="w-32">
                <Badge color={item.difficulty === DifficultyLevel.EASY ? 'green' : item.difficulty === DifficultyLevel.MEDIUM ? 'yellow' : 'red'}>
                    {item.difficulty}
                </Badge>
             </div>
             <div className="w-24 text-slate-500 text-xs uppercase font-black">
                {item.origin === ItemOrigin.IA ? <span className="text-purple-600 flex items-center gap-1"><Brain size={14}/> IA</span> : 'Manual'}
             </div>
             <div className="w-24 text-center">
                <div className={`text-sm font-black ${realUsageCount > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{realUsageCount}x</div>
             </div>
             <div className="w-32 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm transition-all" onClick={() => onSelect(item)} title="Visualizar"><Eye size={18} /></button>
                {canEdit && <button className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-amber-600 shadow-sm transition-all" title="Editar"><Edit3 size={18} /></button>}
                {canDelete && <button className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-rose-600 shadow-sm transition-all" onClick={() => onDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>}
             </div>
        </div>
    );
};

export const ItemsListView = ({ state, onNew }: { state?: AppState, onNew: () => void }) => {
  const { currentUser } = useAppStore(); 
  const { canCreate, canEdit, canDelete } = usePermissions();
  const userTenantId = currentUser?.tenantId;

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems });
  const { data: exams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams });

  const delItemMutation = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => alert("Questão removida do banco.")
  });

  const [filterText, setFilterText] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const filteredItems = (items || []).filter(i => {
    if (i.tenantId !== userTenantId) return false;
    return i.statement.toLowerCase().includes(filterText.toLowerCase());
  });

  const getItemHistory = (itemId: string) => (exams || []).filter(e => e.items.some(ei => ei.itemId === itemId));

  if (itemsLoading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Acessando Banco de Itens...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-4xl font-black text-brand-dark tracking-tighter uppercase italic">Banco de Itens</h1>
            <p className="text-slate-500 font-medium text-lg mt-1">Curadoria e criação assistida de questões para a rede.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                    type="text" 
                    placeholder="Filtrar conteúdo..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-50 rounded-2xl outline-none text-sm font-bold shadow-inner focus:border-brand-primary transition-all"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>
            {canCreate('ITEM_BANK') && (
                <button onClick={onNew} className="btn-premium px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
                    <Plus size={20} /> Nova Questão
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center bg-slate-50/50 text-slate-400 font-black border-b border-slate-100 px-8 py-5 text-[10px] uppercase tracking-[0.2em]">
            <div className="flex-1 pr-6">Conteúdo / Enunciado</div>
            <div className="w-32">Dificuldade</div>
            <div className="w-24">Origem</div>
            <div className="w-24 text-center">Uso</div>
            <div className="w-32 text-right">Ações</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredItems.length > 0 ? (
                <div className="divide-y divide-slate-50">
                    {filteredItems.map(item => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            onSelect={setSelectedItem}
                            getItemHistory={getItemHistory}
                            canEdit={canEdit('ITEM_BANK')}
                            canDelete={canDelete('ITEM_BANK')}
                            onDelete={(id) => confirm("Excluir item permanentemente?") && delItemMutation.mutate(id)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="p-32 text-center text-slate-300 flex flex-col items-center">
                    <Search size={64} className="mb-4 opacity-10"/>
                    <p className="font-black uppercase tracking-widest text-xs italic">Nenhuma questão encontrada.</p>
                 </div>
            )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-slate-100 flex flex-col">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Visualização Técnica</div>
                    <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24}/></button>
                </div>
                <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-slate-800 leading-relaxed text-lg font-medium" dangerouslySetInnerHTML={{ __html: selectedItem.statement }}></div>
                    <div className="space-y-3">
                        {selectedItem.alternatives.map((alt, idx) => (
                            <div key={alt.id} className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-50'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65+idx)}</span> 
                                <span className="font-bold">{alt.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
