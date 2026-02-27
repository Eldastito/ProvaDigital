import React, { useState } from 'react';
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
    Image as ImageIcon
} from 'lucide-react';
import { Interactive3DViewer } from '../../components/3d/Interactive3DViewer';

type MediaType = '3D_MODEL' | 'VIDEO' | 'DOCUMENT' | 'MIND_MAP';

interface MediaItem {
    id: string;
    title: string;
    type: MediaType;
    category: string;
    url: string;
    thumbnail?: string;
    description?: string;
}

// Temporary Mock Data for the Library
const MOCK_LIBRARY: MediaItem[] = [
    {
        id: '1',
        title: 'Anatomia do Coração Humano',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:3f8072336ce94d18b3d0d055a1ece089?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Modelo 3D interativo do coração humano com separador anatômico.'
    },
    {
        id: '2',
        title: 'Sistema do Corpo Humano',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:9311f4f8fa1a4fe4bb0027ff7e8fd795?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Corpo humano completo para dissecação virtual dos sistemas.'
    },
    {
        id: '3',
        title: 'Cérebro Humano 3D',
        type: '3D_MODEL',
        category: 'Biologia',
        url: 'sketchfab:d84f98de4a0a4d509d5df6e52936823c?autostart=1&ui_inspector=1&ui_infos=0',
        description: 'Estrutura detalhada do cérebro humano com visualização de hemisférios e lobos.'
    },
    {
        id: '4',
        title: 'Aulas INEP: Metodologia TRI',
        type: 'VIDEO',
        category: 'Pedagogia',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
        description: 'Explicação didática sobre como funciona a Teoria de Resposta ao Item.'
    },
    {
        id: '5',
        title: 'Slides: Revolução Industrial (PPT)',
        type: 'DOCUMENT',
        category: 'História',
        // Using Google Docs Viewer for a public PPT file (Placeholder URL)
        url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf&embedded=true',
        description: 'Material de apoio completo sobre a 1ª e 2ª Revolução Industrial.'
    },
    {
        id: '6',
        title: 'Mapa Mental: Ciclo da Água',
        type: 'MIND_MAP',
        category: 'Geografia / Ciências',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Watercyclesummary.jpg/1200px-Watercyclesummary.jpg',
        description: 'Esquema visual detalhando os processos de evaporação, condensação e precipitação.'
    }
];

export const ProjectionLabView = () => {
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<MediaType | 'ALL'>('ALL');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const filteredLibrary = MOCK_LIBRARY.filter(item => {
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

    const renderMedia = (item: MediaItem) => {
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
                        src={item.url}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={item.title}
                    />
                );
            case 'DOCUMENT':
                return (
                    <iframe
                        src={item.url}
                        className="w-full h-full border-0 bg-white"
                        title={item.title}
                    />
                );
            case 'MIND_MAP':
                return (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8 overflow-auto">
                        <img
                            src={item.url}
                            alt={item.title}
                            className="max-w-full max-h-full object-contain shadow-lg border border-slate-200"
                        />
                    </div>
                );
            default:
                return <div className="flex items-center justify-center h-full">Mídia não suportada</div>;
        }
    };

    const getIconForType = (type: MediaType) => {
        switch (type) {
            case '3D_MODEL': return <Box size={16} />;
            case 'VIDEO': return <Youtube size={16} />;
            case 'DOCUMENT': return <FileText size={16} />;
            case 'MIND_MAP': return <ImageIcon size={16} />;
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
                                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === '3D_MODEL' ? 'bg-blue-100 text-blue-600' :
                                            item.type === 'VIDEO' ? 'bg-red-100 text-red-600' :
                                                item.type === 'DOCUMENT' ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-purple-100 text-purple-600'
                                            }`}>
                                            {getIconForType(item.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 rounded-sm border border-slate-100">{item.category}</span>
                                            </div>
                                            <h3 className="font-semibold text-sm text-slate-800 truncate" title={item.title}>{item.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                                        </div>
                                    </div>
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
        </div>
    );
};
