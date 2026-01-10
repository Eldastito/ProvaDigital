import React, { useState } from 'react';
import { AppState } from '../../types';
import { Gamepad2, Plus, Edit2, Trash2, Eye, EyeOff, BarChart3, Save, X } from 'lucide-react';

interface GovernanceViewProps {
    state: AppState;
}

interface ArcadeGame {
    id: string;
    titulo: string;
    descricao: string;
    url: string;
    categoria: string;
    thumbnailUrl?: string;
    ativo: boolean;
    totalJogadas: number;
}

const FormJogo = ({ jogo, onSalvar, onCancelar, categorias }: {
    jogo: Partial<ArcadeGame>,
    onSalvar: (j: Partial<ArcadeGame>) => void,
    onCancelar: () => void,
    categorias: string[]
}) => {
    const [form, setForm] = useState(jogo);

    return (
        <div className="bg-white border-2 border-brand-primary rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Gamepad2 size={20} className="text-brand-primary" />
                {jogo.id ? 'Editar Jogo' : 'Novo Jogo'}
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                    <input
                        type="text"
                        value={form.titulo || ''}
                        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                        placeholder="Ex: Math Quest"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">URL do Jogo</label>
                    <input
                        type="url"
                        value={form.url || ''}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                    <select
                        value={form.categoria || 'Matemática'}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    >
                        {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                    <textarea
                        value={form.descricao || ''}
                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                        rows={3}
                        placeholder="Breve descrição do jogo..."
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onSalvar(form)}
                        className="flex-1 bg-brand-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-secondary transition flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Salvar
                    </button>
                    <button
                        onClick={onCancelar}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-100 transition flex items-center gap-2"
                    >
                        <X size={16} /> Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

import { useAppStore } from '../../store/useAppStore';

export const GovernanceView = () => {
    const state = useAppStore();
    const [jogos, setJogos] = useState<ArcadeGame[]>([
        {
            id: '1',
            titulo: 'Math Quest',
            descricao: 'Aventura matemática educativa',
            url: 'https://example.com/math-quest',
            categoria: 'Matemática',
            ativo: true,
            totalJogadas: 847
        },
        {
            id: '2',
            titulo: 'Word Wizard',
            descricao: 'Jogo de vocabulário e ortografia',
            url: 'https://example.com/word-wizard',
            categoria: 'Português',
            ativo: true,
            totalJogadas: 623
        }
    ]);

    const [editando, setEditando] = useState<string | null>(null);
    const [novoJogo, setNovoJogo] = useState<Partial<ArcadeGame> | null>(null);

    const categorias = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Lógica'];

    const handleSalvar = (jogo: Partial<ArcadeGame>) => {
        if (jogo.id) {
            // Editar existente
            setJogos(jogos.map(j => j.id === jogo.id ? { ...j, ...jogo } as ArcadeGame : j));
            setEditando(null);
        } else {
            // Adicionar novo
            const novo: ArcadeGame = {
                id: Date.now().toString(),
                titulo: jogo.titulo || '',
                descricao: jogo.descricao || '',
                url: jogo.url || '',
                categoria: jogo.categoria || 'Matemática',
                ativo: true,
                totalJogadas: 0
            };
            setJogos([...jogos, novo]);
            setNovoJogo(null);
        }
    };

    const handleDeletar = (id: string) => {
        if (confirm('Tem certeza que deseja remover este jogo?')) {
            setJogos(jogos.filter(j => j.id !== id));
        }
    };

    const toggleAtivo = (id: string) => {
        setJogos(jogos.map(j => j.id === id ? { ...j, ativo: !j.ativo } : j));
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <Gamepad2 size={32} className="text-brand-primary" />
                    Governança & Auditoria
                </h1>
                <p className="text-slate-600 mt-2">Gerencie os jogos do Arcade Zone disponíveis para os alunos</p>
            </div>

            {/* Botão Adicionar */}
            {!novoJogo && !editando && (
                <button
                    onClick={() => setNovoJogo({})}
                    className="mb-6 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Adicionar Novo Jogo
                </button>
            )}

            {/* Formulário Novo Jogo */}
            {novoJogo && (
                <div className="mb-6">
                    <FormJogo
                        jogo={novoJogo}
                        onSalvar={handleSalvar}
                        onCancelar={() => setNovoJogo(null)}
                        categorias={categorias}
                    />
                </div>
            )}

            {/* Lista de Jogos */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={20} /> Jogos Cadastrados ({jogos.length})
                </h2>

                {jogos.map(jogo => (
                    <div key={jogo.id}>
                        {editando === jogo.id ? (
                            <FormJogo
                                jogo={jogo}
                                onSalvar={handleSalvar}
                                onCancelar={() => setEditando(null)}
                                categorias={categorias}
                            />
                        ) : (
                            <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg text-slate-800">{jogo.titulo}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${jogo.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {jogo.ativo ? '✓ Ativo' : '✗ Inativo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{jogo.descricao}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="font-bold">📚 {jogo.categoria}</span>
                                            <span>🎮 {jogo.totalJogadas} jogadas</span>
                                            <a href={jogo.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                                                🔗 Ver jogo
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => toggleAtivo(jogo.id)}
                                            className={`p-2 rounded-lg transition ${jogo.ativo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            title={jogo.ativo ? 'Desativar' : 'Ativar'}
                                        >
                                            {jogo.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => setEditando(jogo.id)}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletar(jogo.id)}
                                            className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition"
                                            title="Deletar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
