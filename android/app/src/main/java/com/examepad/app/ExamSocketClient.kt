package com.examepad.app

import android.util.Log
import kotlinx.coroutines.*
import java.io.OutputStreamWriter
import java.net.InetSocketAddress
import java.net.Socket
import org.json.JSONObject

class ExamSocketClient(private val teacherIp: String, private val teacherPort: Int = 8888) {

    private val clientScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun sendEvent(type: String, data: JSONObject) {
        clientScope.launch {
            try {
                val socket = Socket()
                socket.connect(InetSocketAddress(teacherIp, teacherPort), 2000)
                
                val writer = OutputStreamWriter(socket.outputStream)
                val payload = JSONObject().apply {
                    put("type", type)
                    put("student_id", "STU_" + android.os.Build.SERIAL) // Identificador único
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
