import React, { useState } from 'react';
import { BookHeart, Zap, Users, Star } from 'lucide-react';
import { useSafeAppStore } from '../../../../store/useAppStore';
import { User, MentorshipStatus, GamifiedEventStatus } from '../../../../types';
import { translateGamifiedEventStatus } from '../../../../utils/translations';
import { useToast } from '../../../../components/ui/Toast';

interface MentorshipBoardProps {
    student: User;
    isParent: boolean;
}

export const MentorshipBoard: React.FC<MentorshipBoardProps> = ({ student, isParent }) => {
    const state = useSafeAppStore();
    const { addMentorshipRequest, acceptMentorshipRequest, confirmMentorship, updateUserProfile } = state;
    const extendedProfile = state.userProfiles?.find(p => p.userId === student.id);

    const handleCreateRequest = () => {
        const desc = prompt("Descreva sua dúvida (ex: Equações de 2º grau):");
        if (desc) {
            addMentorshipRequest({
                id: Math.random().toString(36).substr(2, 9),
                studentId: student.id,
                studentName: student.name,
                subject: 'Geral', // Hardcoded for now
                description: desc,
                status: 'ABERTO' as any,
                rewardXp: 200,
                createdAt: new Date().toISOString()
            });
            toast.success("Pedido criado! Aguarde um mentor aceitar.");
        }
    };

    const handleAcceptMentorship = (reqId: string) => {
        if (confirm("Aceitar esta mentoria? Você ganhará XP após o aluno confirmar com o PIN.")) {
            acceptMentorshipRequest(reqId, student.id, student.name);
        }
    };

    const handleConfirmMentorship = (reqId: string, pin: string) => {
        const success = confirmMentorship(reqId, pin);
        if (success) {
            toast.info("🎉 Mentoria validada e Concluída! Você ganhou +200 XP!");
            if (extendedProfile) {
                updateUserProfile({
                    ...extendedProfile,
                    xp: (extendedProfile.xp || 0) + 200,
                    owlCoins: (extendedProfile.owlCoins || 0) + 50
                });
            }
        } else {
            toast.info("PIN incorreto. Peça ao aluno o número de 4 dígitos.");
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden mb-6">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <BookHeart className="text-pink-500" /> Quadro de Mentoria
                    </h3>
                    <p className="text-sm text-indigo-700">Ajude colegas e ganhe XP ou peça ajuda para subir sua nota!</p>
                </div>
                {!isParent && (
                    <button
                        onClick={handleCreateRequest}
                        className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-indigo-200 hover:bg-indigo-50 transition flex items-center gap-2"
                    >
                        <Zap size={16} /> Pedir Ajuda
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {(!state.mentorships || state.mentorships.length === 0) && (
                    <div className="col-span-full text-center py-8 text-indigo-300">
                        <Users size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhum pedido de ajuda no momento.</p>
                        <p className="text-xs">Seja o primeiro a pedir!</p>
                    </div>
                )}

                {(state.mentorships || []).filter(m => m.status === 'ABERTO').map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{m.subject}</span>
                            <span className="text-amber-500 font-bold text-xs flex items-center gap-1"><Star size={10} fill="currentColor" /> +{m.rewardXp} XP</span>
                        </div>
                        <h4 className="font-bold text-indigo-900 leading-tight mb-1">{m.description}</h4>
                        <div className="text-xs text-indigo-500 mb-4">Por: {m.studentName}</div>

                        {m.studentId !== student.id && !isParent ? (
                            <button
                                onClick={() => handleAcceptMentorship(m.id)}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
                            >
                                Aceitar Mentoria
                            </button>
                        ) : (
                            <div className="text-center text-xs text-slate-400 font-bold py-2 border rounded bg-slate-50">
                                {isParent ? 'Apenas Visualização' : 'Seu Pedido'}
                            </div>
                        )}
                    </div>
                ))}

                {(state.mentorships || []).filter(m => m.status === MentorshipStatus.IN_PROGRESS && (m.studentId === student.id || m.mentorId === student.id)).map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-emerald-500">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{translateGamifiedEventStatus(GamifiedEventStatus.LIVE)}</div>
                        <h4 className="font-bold text-slate-800 leading-tight mb-2">{m.description}</h4>

                        {m.studentId === student.id ? (
                            <div className="bg-slate-100 p-3 rounded text-center">
                                <div className="text-xs text-slate-500 mb-1">Informe este PIN ao mentor ao final:</div>
                                <div className="text-2xl font-black text-slate-800 tracking-widest">{m.verificationPin || '****'}</div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Insira o PIN do aluno para finalizar:</div>
                                <div className="flex gap-2">
                                    <input id={'pin-' + m.id} type="text" maxLength={4} className="w-full text-center font-bold border rounded p-1" placeholder="PIN" />
                                    <button
                                        onClick={() => {
                                            const val = (document.getElementById('pin-' + m.id) as HTMLInputElement).value;
                                            handleConfirmMentorship(m.id, val);
                                        }}
                                        className="bg-emerald-500 text-white px-3 rounded font-bold"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <BookHeart size={150} className="absolute -right-10 -bottom-10 text-indigo-100 opacity-50 rotate-12 pointer-events-none" />
        </div>
    );
};
