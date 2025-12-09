
import Dexie, { Table } from 'dexie';
import { ExamEvent, StoredSession } from '../types';

// Definição do Banco de Dados Offline para o Tablet
// Usa IndexedDB por baixo do pano, permitindo armazenar megabytes de dados
export class OfflineDatabase extends Dexie {
  examEvents!: Table<ExamEvent, string>; // 'eventId' é a chave primária
  studentSessions!: Table<StoredSession, string>; // 'sessionId' é a chave

  constructor() {
    super('ExamePadOfflineDB');
    // Cast 'this' to any to allow version() call if context is tricky in some environments
    // Standard Dexie usage: this.version(1).stores(...)
    (this as any).version(1).stores({
      examEvents: 'eventId, status, date', // Índices para busca rápida
      studentSessions: 'sessionId, studentId, eventId, synced'
    });
  }
}

export const db = new OfflineDatabase();

// Helper functions para simular a transição do localStorage para Dexie
export const saveEventToDb = async (event: ExamEvent) => {
    try {
        await db.examEvents.put(event);
        console.log(`[DB] Evento ${event.eventId} salvo com segurança.`);
    } catch (e) {
        console.error("Erro ao salvar no IndexedDB", e);
    }
};

export const saveSession = async (session: StoredSession) => {
    try {
        await db.studentSessions.put(session);
        console.log(`[DB] Sessão ${session.sessionId} salva localmente.`);
    } catch (e) {
        console.error("Erro ao salvar sessão", e);
    }
};

export const getEventsFromDb = async (): Promise<ExamEvent[]> => {
    try {
        return await db.examEvents.toArray();
    } catch (e) {
        console.error("Erro ao ler do IndexedDB", e);
        return [];
    }
};

export const getStoredSessionsCount = async (): Promise<number> => {
    try {
        return await db.studentSessions.count();
    } catch (e) {
        return 0;
    }
};

export const clearDb = async () => {
    await db.examEvents.clear();
    await db.studentSessions.clear();
};