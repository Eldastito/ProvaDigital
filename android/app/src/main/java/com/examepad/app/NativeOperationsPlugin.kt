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
    fun speakText(call: PluginCall) {
        val text = call.getString("text") ?: ""
        if (text.isNotEmpty()) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ExamePadTTS")
        }
        call.resolve()
    }
}
