import React, { useState } from 'react';
import { 
    Download, 
    Database, 
    FileJson, 
    FileText, 
    ShieldCheck, 
    AlertCircle,
    Copy,
    ExternalLink
} from 'lucide-react';
import { dataExportService } from '../../services/dataExportService';

/**
 * DataSovereigntyView - Fase 7
 * Interface para exportação de dados estruturados e documentação técnica.
 * Garante o princípio de Anti Lock-in e Soberania Digital.
 */
export default function DataSovereigntyView() {
    const [isExporting, setIsExporting] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);

    const handleBulkExport = async () => {
        setIsExporting(true);
        try {
            // Em produção, aqui buscaríamos todos os dados do tenant via Supabase/Store
            const mockData = {
                exams: [],
                items: [],
                results: [],
                auditLogs: []
            };
            
            await dataExportService.exportSchoolBatch('SCHOOL_001', mockData);
            setLastExport(new Date().toLocaleString());
        } catch (error) {
            alert('Falha na exportação de soberania.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadDictionary = () => {
        dataExportService.exportDataDictionary();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Soberania & Interoperabilidade
                    </h1>
                </div>
                <p className="text-slate-500 max-w-2xl">
                    Garanta a posse total dos dados da sua instituição. Exporte trajetórias, 
                    resultados e definições técnicas seguindo o padrão **ExamePad 2031**.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card de Exportação Massiva */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Snapshot de Soberania (JSON)</h3>
                            <p className="text-xs text-slate-400">Exportação completa do Malote Digital</p>
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        Gere um arquivo JSON contendo todos os Itens, Provas, Resultados e Logs de Auditoria 
                        da sua escola. Este arquivo pode ser processado por qualquer software compatível.
                    </p>

                    <button 
                        onClick={handleBulkExport}
                        disabled={isExporting}
                        className="w-full py-3 bg-brand-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                        {isExporting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FileJson size={20} />
                        )}
                        {isExporting ? 'Processando Lote...' : 'Exportar Lote de Soberania'}
                    </button>
                    
                    {lastExport && (
                        <div className="mt-3 text-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            Último export: {lastExport}
                        </div>
                    )}
                </div>

                {/* Card de Dicionário de Dados */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Dicionário de Dados</h3>
                            <p className="text-xs text-slate-400">Documentação Técnica para Auditoria</p>
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        Acesse as definições técnicas de cada campo, métricas de TRI e esquemas de dados. 
                        Documento essencial para pesquisadores e auditores externos.
                    </p>

                    <button 
                        onClick={handleDownloadDictionary}
                        className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition"
                    >
                        <Download size={20} /> Baixar Dicionário Técnico
                    </button>
                </div>
            </div>

            {/* Seção de Anexo C - Trajetórias */}
            <div className="mt-10 bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-brand-accent mb-4">
                            < ShieldCheck size={14} /> Padrão de Interoperabilidade MEC/INEP
                        </div>
                        <h2 className="text-2xl font-black mb-3">Trajetória Pedagógica do Aluno</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Exporte o log completo de interação de cada aluno seguindo as diretrizes de 
                            interoperabilidade do Anexo C. Inclui tempos de resposta, proficiência Theta 
                            e metadados psicométricos para cada item.
                        </p>
                        <div className="flex gap-4">
                            <button className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-secondary transition flex items-center gap-2">
                                <Copy size={18} /> Copiar Schema JSON
                            </button>
                            <button className="px-6 py-3 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/5 transition flex items-center gap-2">
                                <ExternalLink size={18} /> Ver Documentação
                            </button>
                        </div>
                    </div>
                    <div className="w-full md:w-64 aspect-square bg-white/5 rounded-2xl border border-white/10 p-4 font-mono text-[10px] text-slate-500 overflow-hidden">
                        <pre>
{`{
  "version": "1.5",
  "trajectory": [
    {
      "itemId": "MAT_01",
      "theta": 0.45,
      "ts": "2026..."
    },
    ...
  ]
}`}
                        </pre>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>
            </div>

            <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    **Aviso de Segurança:** A exportação de soberania contém dados sensíveis. 
                    Certifique-se de armazenar estes arquivos em local seguro seguindo as normas da LGPD. 
                    Todos os acessos a esta página são registrados no log de auditoria global.
                </p>
            </div>
        </div>
    );
}
