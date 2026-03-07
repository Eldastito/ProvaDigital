package com.examepad.app.network

import android.util.Log
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import kotlin.concurrent.thread

class MeshUDPService {

    private val TAG = "MeshUDPService"
    private val PORT = 8888
    private var socket: DatagramSocket? = null
    private var isRunning = false

    /**
     * Inicia o broadcast UDP em uma thread separada
     */
    fun startBroadcast(payload: String) {
        if (isRunning) return
        
        isRunning = true
        thread {
            try {
                socket = DatagramSocket()
                socket?.broadcast = true
                val address = InetAddress.getByName("255.255.255.255")
                
                while (isRunning) {
                    val data = payload.toByteArray()
                    val packet = DatagramPacket(data, data.size, address, PORT)
                    socket?.send(packet)
                    
                    Log.d(TAG, "📡 UDP Telemetry Sent: $payload")
                    
                    // Intervalo de Heartbeat (5 segundos como no v4.1, ou menor se necessário)
                    Thread.sleep(5000)
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ UDP Error: ${e.message}")
            } finally {
                socket?.close()
                isRunning = false
            }
        }
    }

    /**
     * Envia um payload único (ex: evento crítico)
     */
    fun sendImmediate(payload: String) {
        thread {
            try {
                val socket = DatagramSocket()
                socket.broadcast = true
                val address = InetAddress.getByName("255.255.255.255")
                val data = payload.toByteArray()
                val packet = DatagramPacket(data, data.size, address, PORT)
                socket.send(packet)
                socket.close()
                Log.d(TAG, "⚡ UDP Immediate Sent: $payload")
            } catch (e: Exception) {
                Log.e(TAG, "❌ UDP Immediate Error: ${e.message}")
            }
        }
    }

    fun stopBroadcast() {
        isRunning = false
    }
}
