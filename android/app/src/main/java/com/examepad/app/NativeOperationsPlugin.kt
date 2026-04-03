package com.examepad.app

import android.speech.tts.TextToSpeech
import com.examepad.app.network.MeshUDPService
import com.examepad.app.security.KioskManager
import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import java.util.Locale
import java.util.UUID
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
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
    private val secureRandom = SecureRandom()

    private fun getAppUUID(): String {
        val prefs: SharedPreferences = context.getSharedPreferences("examepad_prefs", Context.MODE_PRIVATE)
        var uuid = prefs.getString("app_uuid", null)
        if (uuid == null) {
            uuid = UUID.randomUUID().toString()
            prefs.edit().putString("app_uuid", uuid).apply()
        }
        return uuid
    }

    private fun encryptAESGCM(plainText: String, associatedData: ByteArray): Pair<String, String> {
        val keyBytes = Base64.decode(BuildConfig.MESH_SECRET_KEY, Base64.DEFAULT)
        val secretKey = SecretKeySpec(keyBytes, "AES")
        
        val iv = ByteArray(12)
        secureRandom.nextBytes(iv)
        
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec)
        cipher.updateAAD(associatedData)
        
        val cipherText = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        
        return Pair(
            Base64.encodeToString(iv, Base64.NO_WRAP),
            Base64.encodeToString(cipherText, Base64.NO_WRAP)
        )
    }

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

    @PluginMethod
    fun broadcastNativeAnswer(call: PluginCall) {
        val examId = call.getString("examId") ?: ""
        val studentId = call.getString("studentId") ?: ""
        val questionId = call.getString("questionId") ?: ""
        val answerValue = call.getString("value") ?: ""
        val requestId = call.getString("requestId") ?: ""
        val savedAt = call.getString("savedAt") ?: ""
        
        val protocolVersion = 1
        val timestamp = System.currentTimeMillis() / 1000
        val sourceId = getAppUUID()

        // 1. Preparar Payload Interno (Cifrado)
        val internalData = JSObject()
        internalData.put("eid", examId)
        internalData.put("sid", studentId)
        internalData.put("qid", questionId)
        internalData.put("v", answerValue)
        internalData.put("at", savedAt)
        
        // 2. Preparar AAD (Metadados Externos Autenticados)
        val aadString = "$protocolVersion|$requestId|$timestamp|$sourceId"
        val aadBytes = aadString.toByteArray(Charsets.UTF_8)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // 3. Criptografia AES-GCM-256
                val (ivBase64, ctBase64) = encryptAESGCM(internalData.toString(), aadBytes)

                // 4. Montar Envelope Externo
                val envelope = JSObject()
                envelope.put("pv", protocolVersion)
                envelope.put("rid", requestId)
                envelope.put("ts", timestamp)
                envelope.put("src", sourceId)
                envelope.put("iv", ivBase64)
                envelope.put("ct", ctBase64)

                udpService.sendImmediate(envelope.toString())
                
                val ret = JSObject()
                ret.put("ok", true)
                ret.put("type", "UDP_BROADCAST")
                call.resolve(ret)
            } catch (e: Exception) {
                val ret = JSObject()
                ret.put("ok", false)
                ret.put("errorCode", "ENCRYPTION_ERROR")
                ret.put("errorMessage", e.message)
                call.resolve(ret)
            }
        }
    }
}
