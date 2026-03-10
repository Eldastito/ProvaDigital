package com.examepad.app

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.text.SimpleDateFormat
import java.util.*

class ExamDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "examepad_local.db"
        private const val DATABASE_VERSION = 1

        // Tabela de Logs de Auditoria
        const val TABLE_LOGS = "audit_logs"
        const val COL_LOG_ID = "id"
        const val COL_LOG_TIMESTAMP = "timestamp"
        const val COL_LOG_EVENT = "event"
        const val COL_LOG_DESCRIPTION = "description"

        // Tabela de Respostas (Autosave)
        const val TABLE_ANSWERS = "student_answers"
        const val COL_ANS_ID = "question_id"
        const val COL_ANS_VALUE = "answer_value"
        const val COL_ANS_SYNCED = "is_synced"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createLogsTable = ("CREATE TABLE $TABLE_LOGS (" +
                "$COL_LOG_ID INTEGER PRIMARY KEY AUTOINCREMENT," +
                "$COL_LOG_TIMESTAMP TEXT," +
                "$COL_LOG_EVENT TEXT," +
                "$COL_LOG_DESCRIPTION TEXT)")

        val createAnswersTable = ("CREATE TABLE $TABLE_ANSWERS (" +
                "$COL_ANS_ID TEXT PRIMARY KEY," +
                "$COL_ANS_VALUE TEXT," +
                "$COL_ANS_SYNCED INTEGER DEFAULT 0)")

        db.execSQL(createLogsTable)
        db.execSQL(createAnswersTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_LOGS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_ANSWERS")
        onCreate(db)
    }

    fun insertLog(event: String, description: String) {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COL_LOG_TIMESTAMP, SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()))
            put(COL_LOG_EVENT, event)
            put(COL_LOG_DESCRIPTION, description)
        }
        db.insert(TABLE_LOGS, null, values)
    }

    fun saveAnswer(questionId: String, value: String) {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COL_ANS_ID, questionId)
            put(COL_ANS_VALUE, value)
            put(COL_ANS_SYNCED, 0)
        }
        // Use conflict replace para atuar como update se já existir
        db.insertWithOnConflict(TABLE_ANSWERS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }
}
