import React, { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppState, Exam, QuestionType, PrintConfig } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';
import { useSafeAppStore } from '../../store/useAppStore';
import { RichTextRenderer } from '../../components/RichTextRenderer';
import { sanitizeDescription } from '../../utils/helpers';
import { ExamCoverGenerator } from '../../components/Print/ExamCoverGenerator';
import { AnswerSheetGenerator } from '../../components/Print/AnswerSheetGenerator';
import '../../styles/print.css';

export const PrintableExamView = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const state = useSafeAppStore();

  const onBack = () => navigate(-1);
  const exam = state.exams.find(e => e.id === examId);

  if (!exam) return <div>Prova não encontrada.</div>;

  const school = state.schools.find(s => s.id === exam.schoolId);
  const tenant = state.tenants.find(t => t.id === exam.tenantId);
  const creator = state.users.find(u => u.id === exam.creatorId);

  // Hydrate items based on exam config
  const examItems = exam.items.map(config => {
    const originalItem = state.items.find(i => i.id === config.itemId);
    return originalItem ? { ...originalItem, ...config } : null;
  }).filter(Boolean) as any[];

  // Sort by order
  examItems.sort((a, b) => a.order - b.order);

  // Default print config if not set
  const printConfig: PrintConfig = exam.printConfig || {
    includeCover: true,
    includeAnswerSheet: true,
    includeInstructions: true,
    coverTemplate: 'formal',
    showPointValues: true,
    showBNCC: false
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-8 print:p-0 font-serif text-slate-900">
      {/* Toolbar - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2 font-bold transition"
        >
          <Printer size={20} /> Imprimir Prova
        </button>
      </div>

      {/* A4 Page Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none min-h-[297mm] p-[20mm] print:p-0">

        {/* Cover Page (Phase 10) */}
        {printConfig.includeCover && (
          <ExamCoverGenerator
            exam={exam}
            schoolName={school?.name || 'Escola não identificada'}
            tenantName={tenant?.name || 'Rede de Ensino'}
            printConfig={printConfig}
          />
        )}

        {/* Exam Header (if no cover) */}
        {!printConfig.includeCover && (
          <header className="exam-header border-b-2 border-black pb-6 mb-8 text-center">
            <div className="uppercase font-bold text-xl mb-1">{tenant?.name || 'Rede de Ensino'}</div>
            <div className="font-bold text-lg mb-4">{school?.name || 'Escola não identificada'}</div>

            <div className="flex justify-between text-sm text-left border-t border-black pt-4 mt-2">
              <div className="w-2/3 space-y-2">
                <div className="flex">
                  <span className="font-bold w-20">Aluno(a):</span>
                  <div className="flex-1 border-b border-black border-dotted"></div>
                </div>
                <div className="flex">
                  <span className="font-bold w-20">Professor:</span>
                  <span className="flex-1">{creator?.name || '_______________________'}</span>
                </div>
              </div>
              <div className="w-1/3 pl-8 space-y-2">
                <div className="flex">
                  <span className="font-bold w-16">Turma:</span>
                  <span className="flex-1 border-b border-black border-dotted"></span>
                </div>
                <div className="flex">
                  <span className="font-bold w-16">Data:</span>
                  <span className="flex-1 border-b border-black border-dotted">___/___/____</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-16">Nota:</span>
                  <span className="flex-1 border-b border-black border-dotted"></span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xl font-bold uppercase tracking-wider bg-slate-100 print:bg-transparent py-2 border border-black rounded-sm">
              {exam.title}
            </div>
          </header>
        )}

        {/* Instructions */}
        {exam.description && (
          <div className="mb-8 text-sm italic border p-3 rounded border-slate-300 print:border-slate-400">
            <strong>Instruções:</strong> {sanitizeDescription(exam.description)}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-8">
          {examItems.map((item, index) => (
            <div key={item.id} className="question-block page-break-inside-avoid">
              <div className="flex gap-2 mb-2">
                <span className="question-number font-bold text-lg">{index + 1}.</span>
                <div className="flex-1">
                  <p className="question-statement text-base leading-relaxed whitespace-pre-wrap">{item.statement}</p>
                  {item.imageUrl && (
                    <div className="my-3 flex justify-center">
                      <img src={item.imageUrl} alt={`Questão ${index + 1}`} className="max-h-64 border border-slate-200" />
                    </div>
                  )}
                  {printConfig.showBNCC && item.bnccCode && (
                    <div className="text-xs text-slate-500 italic mt-1">BNCC: {item.bnccCode}</div>
                  )}
                </div>
                {printConfig.showPointValues && (
                  <div className="question-points text-xs font-bold pt-1">({item.customScore || item.score} pts)</div>
                )}
              </div>

              {/* Multiple Choice or True/False */}
              {(item.type === QuestionType.MULTIPLE_CHOICE || item.type === QuestionType.TRUE_FALSE) && (
                <div className="alternatives-list pl-8 space-y-1 mt-3">
                  {item.alternatives.map((alt: any, altIdx: number) => (
                    <div key={alt.id} className="alternative-item flex items-start gap-3">
                      <div className="alternative-letter font-bold min-w-[20px] text-sm pt-0.5">
                        {item.type === QuestionType.TRUE_FALSE ? '▢' : String.fromCharCode(97 + altIdx) + ')'}
                      </div>
                      <div className="alternative-text text-sm pt-0.5">{alt.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Essay */}
              {(item.type === QuestionType.ESSAY) && (
                <div className="essay-lines mt-4 space-y-4 pl-8">
                  {Array.from({ length: item.minLines || 5 }).map((_, i) => (
                    <div key={i} className="essay-line border-b border-slate-300 w-full h-6"></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Page 1 */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-400 print:fixed print:bottom-0 print:left-0 print:w-full print:bg-white print:pb-4">
          Gerado via ExamePad SaaS • {new Date().getFullYear()}
        </div>

        {/* ANSWER KEY PAGE BREAK */}
        <div className="print:break-before-page mt-16 border-t-4 border-dashed border-slate-300 pt-8 print:border-none print:pt-0">
          <div className="print:hidden bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 mb-8 text-center rounded-lg font-bold">
            Abaixo visualização do Gabarito (Será impresso em folha separada)
          </div>

          <h2 className="text-2xl font-bold text-center mb-6 uppercase">Gabarito Oficial</h2>
          <div className="mb-4 text-center font-medium">{exam.title} - {school?.name}</div>

          <table className="w-full max-w-lg mx-auto border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-black p-2 w-16 text-center">Questão</th>
                <th className="border border-black p-2 text-center">Gabarito</th>
                <th className="border border-black p-2 text-center">Valor</th>
                <th className="border border-black p-2 text-left">Tipo / Tópico</th>
              </tr>
            </thead>
            <tbody>
              {examItems.map((item, index) => {
                let answerDisplay = '-';
                if (item.type === QuestionType.MULTIPLE_CHOICE) {
                  const correctAlt = item.alternatives.find((a: any) => a.isCorrect);
                  answerDisplay = correctAlt ? String.fromCharCode(97 + item.alternatives.indexOf(correctAlt)).toUpperCase() : '?';
                } else if (item.type === QuestionType.TRUE_FALSE) {
                  const correctAlt = item.alternatives.find((a: any) => a.isCorrect);
                  answerDisplay = correctAlt ? (correctAlt.text === 'Verdadeiro' ? 'V' : 'F') : '?';
                } else {
                  answerDisplay = '(Discursiva)';
                }

                return (
                  <tr key={item.id}>
                    <td className="border border-black p-2 text-center font-bold">{index + 1}</td>
                    <td className="border border-black p-2 text-center font-bold text-lg">{answerDisplay}</td>
                    <td className="border border-black p-2 text-center">{item.customScore || item.score}</td>
                    <td className="border border-black p-2 text-xs">{item.type === QuestionType.ESSAY ? 'Discursiva' : item.subject}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 max-w-lg mx-auto">
            <h3 className="font-bold text-sm mb-2 uppercase">Justificativas / Critérios de Correção</h3>
            <div className="space-y-3">
              {examItems.map((item, idx) => (
                <div key={item.id} className="text-xs border-b border-slate-200 pb-2">
                  <span className="font-bold mr-2 text-base">{idx + 1}.</span>
                  <span className="text-slate-700 italic">{item.correctAnswerJustification || 'Sem justificativa cadastrada.'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Answer Sheet (Phase 10) */}
        {printConfig.includeAnswerSheet && (
          <AnswerSheetGenerator
            exam={exam}
            items={examItems}
          />
        )}

      </div>
    </div>
  );
};
