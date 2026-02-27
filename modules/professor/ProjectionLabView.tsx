import React, { useState, useEffect } from 'react';
import {
    MonitorPlay,
    Library,
    Search,
    Filter,
    Maximize,
    Minimize,
    FileText,
    Youtube,
    Box,
    Share2,
    Image as ImageIcon,
    Plus,
    Trash2,
    X,
    Loader2
} from 'lucide-react';
import { Interactive3DViewer } from '../../components/3d/Interactive3DViewer';
import { useAppStore } from '../../store/useAppStore';
import { ProjectionMaterial } from '../../types';
import { supabase } from '../../services/supabaseClient';

const DEFAULT_MATERIALS: ProjectionMaterial[] = [
    {
        id: 'sys-1',
        title: 'Anatomia do Coração Humano',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:3f8072336ce94d18b3d0d055a1ece089?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Modelo 3D interativo do coração humano com separador anatômico.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    },
    {
        id: 'sys-2',
        title: 'Sistema do Corpo Humano',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:9311f4f8fa1a4fe4bb0027ff7e8fd795?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Corpo humano completo para dissecação virtual dos sistemas.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    },
    {
        id: 'sys-3',
        title: 'Cérebro Humano 3D',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:7a27c17fd6c0488bb31ab093236a47fb?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Estrutura detalhada do cérebro humano com visualização de hemisférios e lobos.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    },
    {
        id: 'sys-4',
        title: 'Aulas INEP: Metodologia TRI',
        type: 'VIDEO',
        category: 'Pedagogia',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'Explicação didática sobre como funciona a Teoria de Resposta ao Item.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    },
    {
        id: 'sys-5',
        title: 'Slides: Revolução Industrial (PPT)',
        type: 'DOCUMENT',
        category: 'História',
        url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf&embedded=true',
        description: 'Material de apoio completo sobre a 1ª e 2ª Revolução Industrial.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    },
    {
        id: 'sys-6',
        title: 'Mapa Mental: Ciclo da Água',
        type: 'MIND_MAP',
        category: 'Geografia / Ciências',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Watercyclesummary.jpg/1200px-Watercyclesummary.jpg',
        description: 'Esquema visual detalhando os processos de evaporação, condensação e precipitação.',
        tenantId: 'system', schoolId: 'system', ownerId: 'system'
    }
];

export const ProjectionLabView = () => {
    const {
        projectionMaterials,
        loadProjectionMaterials,
        addProjectionMaterial,
        deleteProjectionMaterial,
        currentUser,
        schools,
        loadSchools
    } = useAppStore();

    const [selectedItem, setSelectedItem] = useState<ProjectionMaterial | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ProjectionMaterial['type'] | 'ALL'>('ALL');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Add Material Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMaterial, setNewMaterial] = useState<Partial<ProjectionMaterial>>({
        type: 'VIDEO',
        title: '',
        category: '',
        url: '',
        description: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadProjectionMaterials();
        loadSchools();
    }, [loadProjectionMaterials, loadSchools]);

    const combinedLibrary = [...DEFAULT_MATERIALS, ...projectionMaterials];
    const filteredLibrary = combinedLibrary.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || item.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const toggleFullscreen = () => {
        const elem = document.getElementById('projection-container');
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    React.useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        setIsSubmitting(true);
        try {
            const fallbackSchoolId = schools && schools.length > 0 ? schools[0].id : undefined;
            const fallbackTenantId = schools && schools.length > 0 ? schools[0].tenantId : undefined;

            const userAny = currentUser as any;
            const resolvedTenantId = currentUser.tenantId || userAny.tenant_id || fallbackTenantId;
            let resolvedSchoolId = currentUser.schoolId || userAny.school_id || fallbackSchoolId;

            // Failsafe: se ainda não achou schoolId, busca a 1ª escola do tenant logado no Supabase
            if (!resolvedSchoolId && resolvedTenantId) {
                const { data: firstSchool } = await supabase
                    .from('schools')
                    .select('id')
                    .eq('tenant_id', resolvedTenantId)
                    .limit(1)
                    .single();
                if (firstSchool) {
                    resolvedSchoolId = firstSchool.id;
                }
            }

            if (!resolvedTenantId || !resolvedSchoolId) {
                alert("Erro: Não foi possível identificar a Escola ou Tenant para vincular este material. O usuário precisa estar vinculado a uma escola.");
                setIsSubmitting(false);
                return;
            }

            let materialUrl = newMaterial.url!;

            if (newMaterial.type === 'MIND_MAP' && selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${resolvedTenantId}/${resolvedSchoolId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('lab_materials')
                    .upload(filePath, selectedFile);

                if (uploadError) {
                    throw new Error("Erro ao fazer upload da imagem.");
                }

                const { data: publicUrlData } = supabase.storage
                    .from('lab_materials')
                    .getPublicUrl(filePath);

                materialUrl = publicUrlData.publicUrl;
            }

            await addProjectionMaterial({
                tenantId: resolvedTenantId,
                schoolId: resolvedSchoolId,
                ownerId: currentUser.id,
                title: newMaterial.title!,
                type: newMaterial.type as any,
                category: newMaterial.category || 'Geral',
                url: materialUrl,
                description: newMaterial.description
            });
            setIsAddModalOpen(false);
            setNewMaterial({ type: 'VIDEO', title: '', category: '', url: '', description: '' });
            setSelectedFile(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar material.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, material: ProjectionMaterial) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir "${material.title}"?`)) {
            try {
                await deleteProjectionMaterial(material.id, currentUser?.id || '');
                if (selectedItem?.id === material.id) {
                    setSelectedItem(null);
                }
            } catch (err) {
                alert("Erro ao excluir material.");
            }
        }
    };

    const renderMedia = (item: ProjectionMaterial) => {
        const getEmbedUrl = (url: string, type: string) => {
            if (!url) return '';
            try {
                if (type === 'VIDEO') {
                    if (url.includes('youtube.com/watch?v=')) {
                        const videoId = url.split('v=')[1]?.split('&')[0];
                        return `https://www.youtube.com/embed/${videoId}`;
                    }
                    if (url.includes('youtu.be/')) {
                        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                        return `https://www.youtube.com/embed/${videoId}`;
                    }
                }
                if (type === 'DOCUMENT') {
                    if (url.includes('canva.com/design/')) {
                        // Converte links normais de design do Canva para a versão incorporável (?embed)
                        const match = url.match(/(canva\.com\/design\/[a-zA-Z0-9_-]+)/);
                        if (match) {
                            return `https://www.${match[1]}/view?embed`;
                        }
                    }
                    // Check se é Google Docs ou se já foi tratado
                    if (!url.includes('docs.google.com/viewer') && !url.includes('canva.com') && !url.includes('docs.google.com/presentation')) {
                        // Usa o leitor de PDF/PPT do Google
                        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                    }
                }
            } catch (e) {
                console.error("Erro ao parsear URL", e);
            }
            return url;
        };

        switch (item.type) {
            case '3D_MODEL':
                return (
                    <div className="w-full h-full bg-slate-900">
                        <Interactive3DViewer preset={item.url} description={item.title} />
                    </div>
                );
            case 'VIDEO':
                return (
                    <iframe
                        src={getEmbedUrl(item.url, item.type)}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={item.title}
                    />
                );
            case 'DOCUMENT':
                return (
                    <iframe
                        src={getEmbedUrl(item.url, item.type)}
                        className="w-full h-full border-0 bg-white"
                        title={item.title}
                    />
                );
            case 'MIND_MAP': {
                const isDirectImage = item.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/) || item.url.startsWith('data:image');
                // Se for uma imagem direta, renderiza a tag <img>
                if (isDirectImage && !item.url.includes('canva.com')) {
                    return (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8 overflow-auto">
                            <img
                                src={item.url}
                                alt={item.title}
                                className="max-w-full max-h-full object-contain shadow-lg border border-slate-200"
                            />
                        </div>
                    );
                }

                // Se não for imagem direta (ex: link do Canva, PDF, arquivo Drive), tenta usar iframe
                return (
                    <iframe
                        src={getEmbedUrl(item.url, 'DOCUMENT')} // Reusa o parser de documento para transformar links Canva/Drive
                        className="w-full h-full border-0 bg-slate-50"
                        title={item.title}
                    />
                );
            }
            default:
                return <div className="flex items-center justify-center h-full">Mídia não suportada</div>;
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case '3D_MODEL': return <Box size={16} />;
            case 'VIDEO': return <Youtube size={16} />;
            case 'DOCUMENT': return <FileText size={16} />;
            case 'MIND_MAP': return <ImageIcon size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <MonitorPlay size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laboratório de Projeção</h1>
                        <p className="text-sm text-slate-500">Ferramenta para exibição de mídias riicas em sala de aula.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Adicionar Material
                </button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Lado Esquerdo: Biblioteca */}
                <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-1/2 lg:h-full shrink-0">
                    <div className="p-4 border-b border-slate-100 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar materiais..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setActiveFilter('3D_MODEL')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === '3D_MODEL' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Box size={14} /> Modelos 3D
                            </button>
                            <button
                                onClick={() => setActiveFilter('VIDEO')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'VIDEO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Youtube size={14} /> Vídeos
                            </button>
                            <button
                                onClick={() => setActiveFilter('DOCUMENT')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'DOCUMENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <FileText size={14} /> Documentos
                            </button>
                            <button
                                onClick={() => setActiveFilter('MIND_MAP')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'MIND_MAP' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <ImageIcon size={14} /> Mapas Mentais
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredLibrary.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Library size={32} className="mx-auto mb-3 opacity-50" />
                                <p>Nenhum material encontrado.</p>
                            </div>
                        ) : (
                            filteredLibrary.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md relative group ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === '3D_MODEL' ? 'bg-blue-100 text-blue-600' :
                                            item.type === 'VIDEO' ? 'bg-red-100 text-red-600' :
                                                item.type === 'DOCUMENT' ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-purple-100 text-purple-600'
                                            }`}>
                                            {getIconForType(item.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 rounded-sm border border-slate-100">{item.category}</span>
                                            </div>
                                            <h3 className="font-semibold text-sm text-slate-800 truncate" title={item.title}>{item.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                                        </div>
                                    </div>

                                    {currentUser?.id === item.ownerId && item.ownerId !== 'system' && (
                                        <button
                                            onClick={(e) => handleDelete(e, item)}
                                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                            title="Excluir Material"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Lado Direito: Projetor */}
                <div className="flex-1 bg-slate-100 p-4 lg:p-6 flex flex-col h-1/2 lg:h-full">
                    {selectedItem ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full" id="projection-container">

                            {/* Barra de Ferramentas do Projetor (Visível apenas quando NOT fullscreen ou flutuante) */}
                            <div className={`bg-slate-900 text-white px-4 py-3 flex items-center justify-between transition-all ${isFullscreen ? 'opacity-0 hover:opacity-100 absolute top-0 left-0 right-0 z-50 bg-opacity-80' : ''}`}>
                                <div className="flex items-center gap-3">
                                    {getIconForType(selectedItem.type)}
                                    <h2 className="font-medium truncate pr-4">{selectedItem.title}</h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleFullscreen}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-colors rounded-lg font-medium text-sm text-white focus:ring-4 focus:ring-orange-500/20"
                                    >
                                        {isFullscreen ? (
                                            <><Minimize size={16} /> Sair do Projetor</>
                                        ) : (
                                            <><Maximize size={16} /> Modo Projetor</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Área de Mídia */}
                            <div className="flex-1 relative bg-slate-50">
                                {renderMedia(selectedItem)}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <MonitorPlay size={48} className="mb-4 text-slate-300" />
                            <p className="text-lg font-medium text-slate-600 mb-2">Projetor Desligado</p>
                            <p className="max-w-md text-center">Selecione um material na biblioteca ao lado para iniciar a projeção no formato Tela Cheia para seus alunos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Adicionar Material */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" />
                                Cadastrar Novo Material
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="add-material-form" onSubmit={handleAddSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Título do Material *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newMaterial.title}
                                        onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: Sistema Solar 3D"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Mídia *</label>
                                        <select
                                            value={newMaterial.type}
                                            onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="VIDEO">Vídeo (YouTube/Vimeo)</option>
                                            <option value="3D_MODEL">Modelo 3D (Sketchfab)</option>
                                            <option value="DOCUMENT">Documento (PDF/PPT/DOC)</option>
                                            <option value="MIND_MAP">Mapa Mental (Imagem)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                        <input
                                            type="text"
                                            value={newMaterial.category}
                                            onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ex: Ciências"
                                        />
                                    </div>
                                </div>
                                <div>
                                    {newMaterial.type === 'MIND_MAP' ? (
                                        <>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mídia do Mapa Mental *</label>
                                            <div className="flex flex-col gap-3">
                                                <div className={`border-2 border-dashed ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'} rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors relative`}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setSelectedFile(file);
                                                                setNewMaterial({ ...newMaterial, url: 'upload' });
                                                            }
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex flex-col items-center gap-1">
                                                        <ImageIcon size={24} className={selectedFile ? 'text-emerald-500' : 'text-slate-400'} />
                                                        <span className={`text-sm font-medium ${selectedFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                            {selectedFile ? selectedFile.name : 'Clique para enviar uma imagem do computador'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <hr className="flex-1 border-slate-200" />
                                                    <span className="text-xs text-slate-400 font-medium">Ou use um Link do Canva / Web</span>
                                                    <hr className="flex-1 border-slate-200" />
                                                </div>

                                                <input
                                                    type="url"
                                                    value={newMaterial.url === 'upload' ? '' : newMaterial.url}
                                                    onChange={e => {
                                                        setSelectedFile(null);
                                                        setNewMaterial({ ...newMaterial, url: e.target.value });
                                                    }}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Ex: https://canva.com/..."
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link *</label>
                                            <input
                                                type="url"
                                                required
                                                value={newMaterial.url}
                                                onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={
                                                    newMaterial.type === 'VIDEO' ? 'https://www.youtube.com/embed/...' :
                                                        newMaterial.type === '3D_MODEL' ? 'sketchfab:ID_AQUI?autostart=1...' :
                                                            'https://...'
                                                }
                                            />
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                {newMaterial.type === 'VIDEO' && 'Para vídeos do YouTube, use o link de incorporação (embed).'}
                                                {newMaterial.type === '3D_MODEL' && 'Use o ID da API do Sketchfab com o prefixo sketchfab:'}
                                                {newMaterial.type === 'DOCUMENT' && 'Para slides, use o Google Docs Viewer ou link público do PDF.'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Breve Descrição</label>
                                    <textarea
                                        value={newMaterial.description}
                                        onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                                        placeholder="Opcional. Adicione contexto para este material."
                                    ></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="add-material-form"
                                disabled={isSubmitting || !newMaterial.title || (!newMaterial.url && !selectedFile)}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Salvar na Biblioteca
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
