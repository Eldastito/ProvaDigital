
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, X } from 'lucide-react';
import { parseCSV, validateAndImportData, getTemplateUrl, ImportType, ImportResult } from '../../services/importService';
import { useAppStore } from '../../store/useAppStore';

export const BulkImportView = () => {
    const { currentUser } = useAppStore();
    const [importType, setImportType] = useState<ImportType>('STUDENTS');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser?.tenantId) return;

        setLoading(true);
        try {
            const parsedData = await parseCSV(file);
            const importResult = await validateAndImportData(parsedData, importType, currentUser.tenantId);
            setResult(importResult);
        } catch (error) {
            console.error(error);
            alert("Erro ao processar arquivo");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const url = getTemplateUrl(importType);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_${importType.toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                        Importação em Massa
                    </h1>
                    <p className="text-gray-500 mt-2">Cadastre centenas de registros de uma vez via CSV.</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary/10 transition-colors"
                >
                    <Download size={18} /> Baixar Modelo
                </button>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-4">
                {(['STUDENTS', 'CLASSES', 'SCHOOLS'] as ImportType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => { setImportType(type); setFile(null); setResult(null); }}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${importType === type
                                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                                : 'border-gray-200 hover:border-brand-primary/50 text-gray-500'}`}
                    >
                        {type === 'STUDENTS' && <FileText size={24} />}
                        {type === 'CLASSES' && <FileText size={24} />}
                        {type === 'SCHOOLS' && <FileText size={24} />}
                        <span className="font-semibold">{type === 'STUDENTS' ? 'Alunos' : type === 'CLASSES' ? 'Turmas' : 'Escolas'}</span>
                    </button>
                ))}
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50 hover:bg-white transition-colors">
                {!file ? (
                    <label className="cursor-pointer block">
                        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700">Clique para selecionar o CSV</h3>
                        <p className="text-gray-400 mt-2 text-sm">Ou arraste o arquivo aqui</p>
                        <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    </label>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-lg font-medium text-gray-700 bg-white p-4 rounded-lg shadow-sm w-fit mx-auto">
                            <FileText className="text-brand-secondary" />
                            {file.name}
                            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 ml-2">
                                <X size={20} />
                            </button>
                        </div>

                        {!result && (
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95
                                    ${loading ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-brand-primary/30'}
                                `}
                            >
                                {loading ? 'Processando...' : 'Iniciar Importação'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100 grid grid-cols-2 gap-8 bg-gray-50/50">
                        <div className="flex items-center gap-4 text-green-600">
                            <div className="p-3 bg-green-100 rounded-full"><CheckCircle size={24} /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sucesso</p>
                                <p className="text-3xl font-bold">{result.success}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-red-500">
                            <div className="p-3 bg-red-100 rounded-full"><AlertTriangle size={24} /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Erros</p>
                                <p className="text-3xl font-bold">{result.errors.length}</p>
                            </div>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="max-h-64 overflow-y-auto p-4 custom-scrollbar">
                            <h4 className="text-sm font-bold text-gray-500 mb-3 px-2">Log de Erros:</h4>
                            <div className="space-y-2">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-100">
                                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-red-200">Linha {err.row}</span>
                                        <span>{err.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
