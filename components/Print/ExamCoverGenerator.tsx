import React from 'react';
import { Exam, PrintConfig } from '../../types';

interface ExamCoverGeneratorProps {
    exam: Exam;
    schoolName: string;
    tenantName: string;
    printConfig: PrintConfig;
}

export const ExamCoverGenerator: React.FC<ExamCoverGeneratorProps> = ({
    exam,
    schoolName,
    tenantName,
    printConfig
}) => {
    const totalPoints = exam.items.reduce((acc, item) => acc + (item.customScore || 0), 0);

    const getCoverClass = () => {
        switch (printConfig.coverTemplate) {
            case 'modern':
                return 'exam-cover-modern';
            case 'minimalist':
                return 'exam-cover-minimalist';
            default:
                return 'exam-cover-formal';
        }
    };

    return (
        <div className={`exam-cover page-break-after ${getCoverClass()}`}>
            {/* Logo */}
            {printConfig.logoUrl && (
                <div className="logo-container">
                    <img
                        src={printConfig.logoUrl}
                        alt="Logo da Instituição"
                        className="logo"
                    />
                </div>
            )}

            {/* Institution Header */}
            <div className="institution-header">
                <div className="institution-name">{tenantName}</div>
                <div className="school-name">{schoolName}</div>
            </div>

            {/* Exam Title */}
            <div className="exam-title-box">
                <h1 className="exam-title">{exam.title}</h1>
                <div className="exam-subtitle">{exam.subject}</div>
            </div>

            {/* Metadata Grid */}
            <div className="metadata-grid">
                <div className="metadata-row">
                    <span className="metadata-label">Aluno(a):</span>
                    <span className="dotted-line"></span>
                </div>
                <div className="metadata-row">
                    <span className="metadata-label">Turma:</span>
                    <span className="dotted-line"></span>
                </div>
                <div className="metadata-row">
                    <span className="metadata-label">Data:</span>
                    <span className="metadata-value">___/___/______</span>
                </div>
                <div className="metadata-row">
                    <span className="metadata-label">Duração:</span>
                    <span className="metadata-value">{exam.durationMinutes} minutos</span>
                </div>
                <div className="metadata-row">
                    <span className="metadata-label">Pontuação Total:</span>
                    <span className="metadata-value">{totalPoints} pontos</span>
                </div>
                <div className="metadata-row">
                    <span className="metadata-label">Número de Questões:</span>
                    <span className="metadata-value">{exam.items.length}</span>
                </div>
            </div>

            {/* Instructions */}
            {printConfig.includeInstructions && (
                <div className="instructions-box">
                    <h3 className="instructions-title">INSTRUÇÕES GERAIS</h3>
                    <ul className="instructions-list">
                        <li>Leia atentamente todas as questões antes de começar a responder.</li>
                        <li>Use caneta esferográfica azul ou preta para preencher as respostas.</li>
                        <li>Não é permitido o uso de corretivo ou rasuras.</li>
                        <li>Questões objetivas devem ser respondidas na folha de respostas.</li>
                        <li>Questões discursivas devem ser respondidas no espaço indicado.</li>
                        <li>Mantenha seu material de prova em sigilo durante a aplicação.</li>
                        <li>Ao terminar, entregue a prova e a folha de respostas ao fiscal.</li>
                    </ul>
                    {exam.description && (
                        <div className="custom-instructions">
                            <strong>Instruções Específicas:</strong>
                            <p>{exam.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Security Notice */}
            <div className="security-notice">
                <p>
                    ⚠️ ATENÇÃO: É proibida a reprodução total ou parcial desta prova sem autorização prévia.
                    <br />
                    Código de Identificação: {exam.id.substring(0, 8).toUpperCase()}
                </p>
            </div>

            {/* Footer */}
            {printConfig.footerText && (
                <div className="cover-footer">
                    {printConfig.footerText}
                </div>
            )}
        </div>
    );
};
