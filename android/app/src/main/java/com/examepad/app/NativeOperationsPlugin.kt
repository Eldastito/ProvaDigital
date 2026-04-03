package com.examepad.app

import android.speech.tts.TextToSpeech
import com.examepad.app.network.MeshUDPService
import com.examepad.app.security.KioskManager
import java.util.Locale
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@CapacitorPlugin(name = "NativeOperations")
class NativeOperationsPlugin : Plugin() {

    private lateinit var kioskManager: KioskManager
    private val udpService = MeshUDPService()
    private var tts: TextToSpeech? = null

    override fun load() {
        kioskManager = KioskManager(activity)
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("pt", "BR")
            }
        }
    }

    @PluginMethod
    fun startKioskMode(call: PluginCall) {
        activity.runOnUiThread {
            kioskManager.startKioskMode()
            call.resolve()
        }
    }

    @PluginMethod
    fun stopKioskMode(call: PluginCall) {
        activity.runOnUiThread {
            kioskManager.stopKioskMode()
            call.resolve()
        }
    }

    @PluginMethod
    fun sendUDPTelemetry(call: PluginCall) {
        val payload = call.getString("payload") ?: ""
        udpService.sendImmediate(payload)
        call.resolve()
    }

    @PluginMethod
    fun getKioskStatus(call: PluginCall) {
        val ret = JSObject()
        ret.put("isActive", kioskManager.isKioskModeActive())
        call.resolve(ret)
    }

    @PluginMethod
    fun getBLEPresence(call: PluginCall) {
        val ret = JSObject()
        ret.put("source", "ble")
        ret.put("timestamp", System.currentTimeMillis())

        val currentActivity = activity
        if (currentActivity is RunnerActivity) {
            val lastSeen = currentActivity.getBleLastSeen()
            val timeout = currentActivity.getBleTimeout()
            val now = System.currentTimeMillis()
            
            val isPresent = (now - lastSeen) < timeout
            
            ret.put("ok", true)
            ret.put("present", isPresent)
            call.resolve(ret)
        } else {
            ret.put("ok", false)
            ret.put("present", false)
            ret.put("errorCode", "RUNNER_ACTIVITY_NOT_ACTIVE")
            ret.put("errorMessage", "BLE Presence available only in RunnerActivity")
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun saveNativeAnswer(call: PluginCall) {
        val examId = call.getString("examId") ?: ""
        val studentId = call.getString("studentId") ?: ""
        val questionId = call.getString("questionId") ?: ""
        val answerValue = call.getString("value") ?: ""
        val requestId = call.getString("requestId") ?: ""
        val savedAt = call.getString("savedAt") ?: ""

        if (questionId.isEmpty()) {
            val ret = JSObject()
            ret.put("ok", false)
            ret.put("persisted", false)
            ret.put("storage", "sqlite")
            ret.put("timestamp", System.currentTimeMillis())
            ret.put("errorCode", "INVALID_PAYLOAD")
            ret.put("errorMessage", "questionId is required")
            call.resolve(ret)
            return
        }

        // Truthful Success: resolve somente após o I/O real em background
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val db = ExamDatabaseHelper(context)
                withContext(Dispatchers.IO) {
                    db.saveAnswer(
                        questionId = questionId,
                        value = answerValue,
                        examId = examId,
                        studentId = studentId,
                        requestId = requestId,
                        savedAt = savedAt
                    )
                }
                
                val ret = JSObject()
                ret.put("ok", true)
                ret.put("persisted", true)
                ret.put("storage", "sqlite")
                ret.put("timestamp", System.currentTimeMillis())
                call.resolve(ret)
            } catch (e: Exception) {
                val ret = JSObject()
                ret.put("ok", true) // Ponte funcional, mas falha de persistência
                ret.put("persisted", false)
                ret.put("storage", "sqlite")
                ret.put("timestamp", System.currentTimeMillis())
                ret.put("errorCode", "SQLITE_ERROR")
                ret.put("errorMessage", e.message)
                call.resolve(ret)
            }
        }
    }
}
