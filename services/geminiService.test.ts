import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { QuestionType, DifficultyLevel } from '../types';

// Mocks globais para as funções do modelo
const generateContentMock = vi.fn();
const embedContentMock = vi.fn();
const listMock = vi.fn();

// Mock do SDK do Google GenAI using a class
vi.mock('@google/genai', () => {
    class MockGoogleGenAI {
        models = {
            generateContent: generateContentMock,
            embedContent: embedContentMock,
            list: listMock,
        };
        constructor() { }
        getGenerativeModel = vi.fn().mockReturnValue({
            generateContent: generateContentMock
        });
    }

    return {
        GoogleGenAI: MockGoogleGenAI,
        Type: {
            OBJECT: 'OBJECT',
            ARRAY: 'ARRAY',
            STRING: 'STRING',
            NUMBER: 'NUMBER',
            BOOLEAN: 'BOOLEAN',
        }
    };
});

describe('Gemini Service', () => {
    let mockGenAI: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        mockGenAI = new GoogleGenAI('fake-key');

        // Simular que a API Key existe no ambiente de teste
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
    });

    describe('generateQuestionsFromText', () => {
        it('deve gerar questões corretamente processando o retorno da IA', async () => {
            const mockResponse = {
                text: JSON.stringify({
                    questions: [
                        {
                            statement: 'Questão Teste',
                            alternatives: [
                                { text: 'A', isCorrect: true },
                                { text: 'B', isCorrect: false }
                            ],
                            justification: 'Porque sim',
                            difficulty: 'MEDIO',
                            bnccCode: 'EF01MA01'
                        }
                    ]
                })
            };

            mockGenAI.models.generateContent.mockResolvedValue(mockResponse);

            const result = await geminiService.generateQuestionsFromText(
                'Texto de contexto',
                1,
                QuestionType.MULTIPLE_CHOICE,
                DifficultyLevel.MEDIUM,
                'Matemática'
            );

            expect(result).toHaveLength(1);
            expect(result[0].statement).toBe('Questão Teste');
            expect(result[0].aiModel).toBeDefined();
            expect(mockGenAI.models.generateContent).toHaveBeenCalled();
        });

        it('deve lidar com falhas na extração de texto da IA', async () => {
            mockGenAI.models.generateContent.mockResolvedValue({ text: null });

            await expect(geminiService.generateQuestionsFromText(
                'Texto', 1, QuestionType.MULTIPLE_CHOICE, DifficultyLevel.MEDIUM, 'História'
            )).rejects.toThrow('A IA retornou uma resposta vazia');
        });
    });

    describe('gradeFullEssay', () => {
        it('deve retornar a estrutura de correção de redação completa', async () => {
            const mockEssayResponse = {
                text: JSON.stringify({
                    globalScore: 800,
                    competencies: [
                        { id: 1, name: 'C1', score: 160, maxScore: 200, feedback: 'Bom' }
                    ],
                    issues: [],
                    generalFeedback: 'Parabéns'
                })
            };

            mockGenAI.models.generateContent.mockResolvedValue(mockEssayResponse);

            const result = await geminiService.gradeFullEssay('Tema', 'Texto Motivador', 'Redação do Aluno');

            expect(result.globalScore).toBe(800);
            expect(result.competencies).toHaveLength(1);
            expect(result.generalFeedback).toBe('Parabéns');
        });
    });

    describe('batchGradeAnswers', () => {
        it('deve processar múltiplas respostas em lote', async () => {
            const mockBatchResponse = {
                text: JSON.stringify([
                    { id: '1', score: 1.0, feedback: 'Correto' },
                    { id: '2', score: 0.5, feedback: 'Parcial' }
                ])
            };

            mockGenAI.models.generateContent.mockResolvedValue(mockBatchResponse);

            const answers = [
                { id: '1', question: 'Q1', expectedAnswer: 'A', studentAnswer: 'A', maxScore: 1 },
                { id: '2', question: 'Q2', expectedAnswer: 'B', studentAnswer: 'C', maxScore: 1 }
            ];

            const result = await geminiService.batchGradeAnswers(answers);

            expect(result).toHaveLength(2);
            expect(result[0].score).toBe(1.0);
            expect(result[1].score).toBe(0.5);
        });

        it('deve retornar array vazio se não houver respostas para corrigir', async () => {
            const result = await geminiService.batchGradeAnswers([]);
            expect(result).toEqual([]);
            expect(mockGenAI.models.generateContent).not.toHaveBeenCalled();
        });
    });
});
