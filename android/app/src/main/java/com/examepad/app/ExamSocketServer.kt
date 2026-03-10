package com.examepad.app

import android.util.Log
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ServerSocket
import java.net.Socket

class ExamSocketServer(private val port: Int = 8888, private val onMessageReceived: (String, String, JSONObject) -> Unit) {

    private val serverScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var serverSocket: ServerSocket? = null
    private var isRunning = false

    fun start() {
        isRunning = true
        serverScope.launch {
            try {
                serverSocket = ServerSocket(port)
                Log.d("ExamServer", "Servidor iniciado na porta $port")
                
                while (isRunning) {
                    val clientSocket = serverSocket?.accept()
                    clientSocket?.let { handleClient(it) }
                }
            } catch (e: Exception) {
                Log.e("ExamServer", "Erro no servidor: ${e.message}")
            }
        }
    }

    private fun handleClient(socket: Socket) {
        serverScope.launch {
            try {
                val studentIp = socket.inetAddress.hostAddress ?: ""
                val reader = BufferedReader(InputStreamReader(socket.inputStream))
                val line = reader.readLine()
                if (line != null) {
                    val json = JSONObject(line)
                    val studentId = json.optString("student_id", "UNKNOWN")
                    onMessageReceived(studentId, studentIp, json)
                }
                socket.close()
            } catch (e: Exception) {
                Log.e("ExamServer", "Erro ao processar cliente: ${e.message}")
            }
        }
    }

    fun stop() {
        isRunning = false
        serverSocket?.close()
        serverScope.cancel()
    }
}
