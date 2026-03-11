package com.examepad.app

import android.content.Context
import android.provider.Settings
import android.util.Log
import kotlinx.coroutines.*
import java.io.OutputStreamWriter
import java.net.InetSocketAddress
import java.net.Socket
import org.json.JSONObject

class ExamSocketClient(private val teacherIp: String, private val teacherPort: Int = 8888) {

    private val clientScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun sendEvent(type: String, data: JSONObject, context: Context? = null) {
        clientScope.launch {
            try {
                val socket = Socket()
                socket.connect(InetSocketAddress(teacherIp, teacherPort), 2000)
                
                // Tenta pegar um ID mais confiável
                val deviceId = if (context != null) {
                    Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
                } else {
                    android.os.Build.MODEL + "_" + android.os.Build.ID
                }

                val writer = OutputStreamWriter(socket.outputStream)
                val payload = JSONObject().apply {
                    put("type", type)
                    put("student_id", deviceId)
                    put("payload", data)
                    put("timestamp", System.currentTimeMillis())
                }

                writer.write(payload.toString() + "\n")
                writer.flush()
                socket.close()
                Log.d("ExamSocket", "Evento $type enviado com sucesso para $teacherIp")
            } catch (e: Exception) {
                Log.e("ExamSocket", "Falha ao enviar evento $type: ${e.message}")
            }
        }
    }

    fun stop() {
        clientScope.cancel()
    }
}
