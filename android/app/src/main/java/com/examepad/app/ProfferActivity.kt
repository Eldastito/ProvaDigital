package com.examepad.app

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.net.wifi.WifiManager
import android.os.Bundle
import android.os.ParcelUuid
import android.text.format.Formatter
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import org.json.JSONObject
import java.util.*

class ProfferActivity : AppCompatActivity() {

    private lateinit var server: ExamSocketServer
    private lateinit var dbRoom: ProfferDatabaseHelper
    private lateinit var container: LinearLayout
    private lateinit var statsContainer: LinearLayout
    private val studentCards = mutableMapOf<String, StudentStatusView>()
    
    private var bluetoothAdapter: BluetoothAdapter? = null
    private val ROOM_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // ExamePad Presence UUID

    private val standardMessages = arrayOf(
        "Atenção: Faltam 30 minutos para o fim.",
        "Atenção: Faltam 15 minutos para o fim.",
        "Atenção: Faltam 5 minutos para o fim.",
        "Mantenha o foco apenas na sua prova.",
        "Silêncio no ambiente, por favor.",
        "Atenção: Sua conduta está sendo monitorada.",
        "Atenção: Não tente sair do aplicativo da prova.",
        "Levante a mão se precisar de auxílio técnico."
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        dbRoom = ProfferDatabaseHelper(this)
        
        // Inicializa Bluetooth para Presença BLE
        val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter
        startPresenceBeacon()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0f172a"))
            setPadding(32, 64, 32, 32)
        }

        val title = TextView(this).apply {
            text = "Cofre de Sala - Professor"
            setTextColor(Color.WHITE); textSize = 22f; setTypeface(null, Typeface.BOLD); setPadding(0, 0, 0, 16)
        }
        root.addView(title)

        statsContainer = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; setPadding(0, 0, 0, 32) }
        root.addView(statsContainer)
        updateStats(0, 0, 0)

        val commandLayout = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; setPadding(0, 0, 0, 32) }
        val btnShowQR = MaterialButton(this).apply { text = "GERAR QR"; setBackgroundColor(Color.parseColor("#10b981")); layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { marginEnd = 8 }; setOnClickListener { showAccessQRCode() } }
        val btnBroadcast = MaterialButton(this).apply { text = "AVISO GERAL"; setBackgroundColor(Color.parseColor("#6366f1")); layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { marginEnd = 8 }; setOnClickListener { showBroadcastDialog() } }
        val btnFinishAll = MaterialButton(this).apply { text = "FECHAR SALA"; setBackgroundColor(Color.RED); layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f); setOnClickListener { confirmFinishAll() } }
        commandLayout.addView(btnShowQR); commandLayout.addView(btnBroadcast); commandLayout.addView(btnFinishAll)
        root.addView(commandLayout)

        val scrollView = ScrollView(this)
        container = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        scrollView.addView(container); root.addView(scrollView)

        setContentView(root)

        server = ExamSocketServer { studentId, studentIp, message -> handleIncomingMessage(studentId, studentIp, message) }
        server.start()
    }

    private fun startPresenceBeacon() {
        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) return
        
        val advertiser = bluetoothAdapter!!.bluetoothLeAdvertiser
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(false)
            .setTimeout(0)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(ROOM_UUID))
            .build()

        advertiser.startAdvertising(settings, data, object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                Log.d("PresenceBLE", "Beacon de presença iniciado com sucesso")
            }
            override fun onStartFailure(errorCode: Int) {
                Log.e("PresenceBLE", "Falha ao iniciar Beacon: $errorCode")
            }
        })
    }

    private fun handleIncomingMessage(studentId: String, studentIp: String, message: JSONObject) {
        val type = message.optString("type")
        val payload = message.optJSONObject("payload") ?: JSONObject()
        if (type == "ANSWER_SUBMIT") {
            dbRoom.saveIncomingAnswer(studentId, payload.optString("question_id"), payload.optString("value"))
            sendHandshakeConfirmation(studentIp, payload.optString("question_id"))
        }
        runOnUiThread { updateStudentDashboard(studentId, studentIp, message) }
    }

    private fun sendHandshakeConfirmation(studentIp: String, questionId: String) {
        val client = ExamSocketClient(studentIp, 9999)
        val data = JSONObject().apply { put("question_id", questionId); put("status", "RECEIVED") }
        client.sendEvent("CONFIRMATION_OK", data)
    }

    private fun updateStats(total: Int, finished: Int, alerts: Int) {
        statsContainer.removeAllViews()
        fun createStatItem(label: String, value: String, color: Int): LinearLayout {
            return LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                addView(TextView(this@ProfferActivity).apply { text = value; setTextColor(color); textSize = 24f; setTypeface(null, Typeface.BOLD) })
                addView(TextView(this@ProfferActivity).apply { text = label; setTextColor(Color.GRAY); textSize = 10f })
            }
        }
        statsContainer.addView(createStatItem("CONECTADOS", total.toString(), Color.WHITE))
        statsContainer.addView(createStatItem("ENTREGUES", finished.toString(), Color.CYAN))
        statsContainer.addView(createStatItem("ALERTAS", alerts.toString(), if (alerts > 0) Color.RED else Color.GRAY))
    }

    private fun updateStudentDashboard(studentId: String, studentIp: String, message: JSONObject) {
        val type = message.optString("type")
        val payload = message.optJSONObject("payload") ?: JSONObject()
        if (!studentCards.containsKey(studentId)) {
            val card = StudentStatusView(studentId, studentIp)
            studentCards[studentId] = card
            container.addView(card.view, 0)
        }
        val card = studentCards[studentId]!!
        card.currentIp = studentIp
        when (type) {
            "HEARTBEAT" -> {
                val battery = payload.optInt("battery")
                val status = payload.optString("status")
                if (status == "MESSAGE_VIEW") card.updateStatus("LENDO", Color.YELLOW, "Bat: $battery%")
                else card.updateStatus("Ativo", Color.parseColor("#10b981"), "Bat: $battery%")
            }
            "HELP_REQUEST" -> card.updateStatus("PEDIU AJUDA", Color.parseColor("#f97316"), "Auxílio solicitado")
            "SECURITY_WARNING" -> { card.warningCount++; card.updateStatus("ALERTA", Color.RED, "Violações: ${card.warningCount}") }
            "EXAM_FINISHED" -> { card.isFinished = true; card.updateStatus("FINALIZADO", Color.CYAN, "Dados no Cofre") }
            "ANSWER_SUBMIT" -> card.updateLastAction("Salvo: ${payload.optString("question_id")}")
            "BLE_OUT_OF_RANGE" -> card.updateStatus("FORA DA SALA", Color.RED, "Sinal BLE perdido!")
        }
        updateStats(studentCards.size, studentCards.values.count { it.isFinished }, studentCards.values.count { it.warningCount > 0 })
    }

    inner class StudentStatusView(val id: String, var currentIp: String) {
        var isFinished = false; var warningCount = 0
        val view: MaterialCardView = MaterialCardView(this@ProfferActivity).apply {
            setCardBackgroundColor(Color.parseColor("#1e293b")); radius = 24f; strokeWidth = 2; setStrokeColor(Color.parseColor("#334155"))
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { setMargins(0, 0, 0, 24) }
        }
        private val nameTxt: TextView; private val statusTxt: TextView; private val actionTxt: TextView
        init {
            val layout = LinearLayout(this@ProfferActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(40, 40, 40, 40) }
            val shortId = if (id.length > 6) id.substring(id.length - 6) else id
            nameTxt = TextView(this@ProfferActivity).apply { text = "Aluno: $shortId"; setTextColor(Color.WHITE); textSize = 16f; setTypeface(null, Typeface.BOLD) }
            statusTxt = TextView(this@ProfferActivity).apply { text = "Conectado"; setTextColor(Color.GRAY); textSize = 12f }
            actionTxt = TextView(this@ProfferActivity).apply { text = "IP: $currentIp"; setTextColor(Color.parseColor("#94a3b8")); textSize = 11f; setPadding(0, 8, 0, 24) }
            val btnLayout = LinearLayout(this@ProfferActivity).apply { orientation = LinearLayout.HORIZONTAL }
            val btnMsg = MaterialButton(this@ProfferActivity).apply { text = "AVISO"; setBackgroundColor(Color.parseColor("#6366f1")); layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { marginEnd = 8 }; setOnClickListener { showIndividualMessageDialog() } }
            val btnFinish = MaterialButton(this@ProfferActivity).apply { text = "ENCERRAR"; setBackgroundColor(Color.RED); layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f); setOnClickListener { confirmForcedFinish() } }
            btnLayout.addView(btnMsg); btnLayout.addView(btnFinish); layout.addView(nameTxt); layout.addView(statusTxt); layout.addView(actionTxt); layout.addView(btnLayout); view.addView(layout)
        }
        private fun showIndividualMessageDialog() { AlertDialog.Builder(this@ProfferActivity).setTitle("Aviso").setItems(standardMessages) { _, which -> sendMessageToStudent("TEACHER_MESSAGE", standardMessages[which]) }.setNegativeButton("Voltar", null).show() }
        private fun confirmForcedFinish() { AlertDialog.Builder(this@ProfferActivity).setTitle("Encerrar este aluno?").setPositiveButton("Sim") { _, _ -> sendMessageToStudent("FORCE_FINISH", "") }.setNegativeButton("Não", null).show() }
        fun sendMessageToStudent(type: String, text: String) { val client = ExamSocketClient(currentIp, 9999); val data = JSONObject().apply { put("message", text) }; client.sendEvent(type, data) }
        fun updateStatus(status: String, color: Int, meta: String) {
            statusTxt.text = status; statusTxt.setTextColor(color); actionTxt.text = "$meta | IP: $currentIp"
            if (status == "Ativo") { view.setStrokeColor(Color.parseColor("#334155")) }
            else if (color == Color.RED) { view.setStrokeColor(Color.RED) }
        }
        fun updateLastAction(action: String) { actionTxt.text = "$action | IP: $currentIp" }
    }

    private fun showAccessQRCode() {
        val wm = applicationContext.getSystemService(WIFI_SERVICE) as WifiManager
        val ip = Formatter.formatIpAddress(wm.connectionInfo.ipAddress)
        if (ip == "0.0.0.0") return
        val bitmap = generateQRCode(ip)
        val imgView = ImageView(this).apply { setImageBitmap(bitmap); setPadding(64, 64, 64, 64); adjustViewBounds = true }
        AlertDialog.Builder(this).setTitle("Acesso à Sala").setMessage("IP: $ip").setView(imgView).setPositiveButton("Fechar", null).show()
    }

    private fun generateQRCode(text: String): Bitmap {
        val writer = QRCodeWriter(); val bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, 512, 512)
        val bitmap = Bitmap.createBitmap(512, 512, Bitmap.Config.RGB_565)
        for (x in 0 until 512) { for (y in 0 until 512) { bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) Color.BLACK else Color.WHITE) } }
        return bitmap
    }

    private fun showBroadcastDialog() {
        if (studentCards.isEmpty()) return
        AlertDialog.Builder(this).setTitle("Aviso Geral").setItems(standardMessages) { _, which -> studentCards.values.forEach { it.sendMessageToStudent("TEACHER_MESSAGE", standardMessages[which]) } }.setNegativeButton("Voltar", null).show()
    }

    private fun confirmFinishAll() {
        if (studentCards.isEmpty()) return
        AlertDialog.Builder(this).setTitle("FECHAR SALA?").setMessage("Confirma o fechamento?").setPositiveButton("Sim") { _, _ -> studentCards.values.forEach { it.sendMessageToStudent("FORCE_FINISH", "") } }.setNegativeButton("Não", null).show()
    }

    override fun onDestroy() { server.stop(); super.onDestroy() }
}
