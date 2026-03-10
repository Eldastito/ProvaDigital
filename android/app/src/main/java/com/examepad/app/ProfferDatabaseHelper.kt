package com.examepad.app

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class ProfferDatabaseHelper(context: Context) : SQLiteOpenHelper(context, "proffer_room.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        // Tabela para consolidar todas as respostas de todos os alunos da sala
        db.execSQL("CREATE TABLE classroom_data (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "student_id TEXT," +
                "question_id TEXT," +
                "answer_value TEXT," +
                "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)")
        
        // Tabela para log de eventos da sala
        db.execSQL("CREATE TABLE room_logs (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "event TEXT," +
                "details TEXT," +
                "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)")
    }

    override fun onUpgrade(db_sq: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db_sq.execSQL("DROP TABLE IF EXISTS classroom_data")
        db_sq.execSQL("DROP TABLE IF EXISTS room_logs")
        onCreate(db_sq)
    }

    fun saveIncomingAnswer(studentId: String, qId: String, value: String) {
        val db = this.writableDatabase
        val cv = ContentValues().apply {
            put("student_id", studentId)
            put("question_id", qId)
            put("answer_value", value)
        }
        db.insert("classroom_data", null, cv)
    }

    fun logEvent(event: String, details: String) {
        val db = this.writableDatabase
        val cv = ContentValues().apply {
            put("event", event)
            put("details", details)
        }
        db.insert("room_logs", null, cv)
    }
}
