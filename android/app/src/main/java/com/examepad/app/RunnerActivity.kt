package com.examepad.app

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.appcompat.app.AlertDialog
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import com.examepad.app.security.KioskManager
import com.getcapacitor.BridgeActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import org.json.JSONObject
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class RunnerActivity : BridgeActivity() {
    
    private var warningCount = 0
    private val MAX_WARNINGS = 3
    private lateinit var dbHelper: ExamDatabaseHelper
    private lateinit var kioskManager: KioskManager
    private var socketClient: ExamSocketClient? = null
    private var socketServer: ExamSocketServer? = null
    
    private var isExamEnded = false
    private var teacherOverlay: View? = null
    private var nativeUiContainer: FrameLayout? = null
    private var scannerView: PreviewView? = null
    private lateinit var cameraExecutor: ExecutorService
    private var questionStatusTxt: TextView? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var endedDialog: AlertDialog? = null

    // Variáveis BLE
    private var bluetoothAdapter: BluetoothAdapter? = null
    private val ROOM_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var lastBleSeenTime = System.currentTimeMillis()
    private val BLE_TIMEOUT_MS = 60000 
    private var isOutOfRangeAlertActive = false
    
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            sendHeartbeat()
            checkBlePresence()
            syncPendingAnswers()
            if (!isExamEnded) hideSystemUI()
            heartbeatHandler.postDelayed(this, 15000)
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.CAMERA] == true) startCamera()
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) startBleScanning()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dbHelper = ExamDatabaseHelper(this)
        kioskManager = KioskManager(this)
        cameraExecutor = Executors.newSingleThreadExecutor()
        
        val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!isExamEnded) {
                    Toast.makeText(this@RunnerActivity, "Acesso bloqueado durante a prova.", Toast.LENGTH_SHORT).show()
                } else if (endedDialog?.isShowing == true) {
                    // Modal está ativo
                } else {
                    finish()
                }
            }
        })

        hideSystemUI()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)

        val rootLayout = window.decorView.findViewById<ViewGroup>(android.R.id.content)
        nativeUiContainer = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        rootLayout.addView(nativeUiContainer)

        dbHelper.insertLog("APP_START", "Iniciando Scanner")
        window.decorView.postDelayed({ setupScannerUI() }, 100)
    }

    private fun setupScannerUI() {
        nativeUiContainer?.removeAllViews()
        val scannerLayout = FrameLayout(this).apply { layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        scannerView = PreviewView(this).apply { layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        scannerLayout.addView(scannerView)
        val overlay = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setBackgroundColor(Color.parseColor("#CC000000")); layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        overlay.addView(TextView(this).apply { text = "Aponte para o QR Code do Professor"; setTextColor(Color.WHITE); textSize = 20f; gravity = Gravity.CENTER; setPadding(40, 0, 40, 100) })
        scannerLayout.addView(overlay); nativeUiContainer?.addView(scannerLayout)

        val permissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        requestPermissionLauncher.launch(permissions.toTypedArray())
    }

    private fun startBleScanning() {
        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) return
        val scanner = bluetoothAdapter!!.bluetoothLeScanner ?: return
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(ROOM_UUID)).build()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_POWER).build()
        val scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) { 
                lastBleSeenTime = System.currentTimeMillis() 
                isOutOfRangeAlertActive = false
            }
        }
        try { scanner.startScan(listOf(filter), settings, scanCallback) } 
        catch (e: SecurityException) { Log.e("PresenceBLE", "Sem permissão BLE") }
    }

    private fun checkBlePresence() {
        if (System.currentTimeMillis() - lastBleSeenTime > BLE_TIMEOUT_MS) {
            if (!isOutOfRangeAlertActive) {
                isOutOfRangeAlertActive = true
                socketClient?.sendEvent("BLE_OUT_OF_RANGE", JSONObject(), this)
                dbHelper.insertLog("SECURITY_BLE", "Sinal perdido")
                runOnUiThread {
                    Toast.makeText(this, "Atenção: Mantenha-se dentro da sala de prova!", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(scannerView?.surfaceProvider) }
                val imageAnalyzer = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build().also {
                    it.setAnalyzer(cameraExecutor) { imageProxy -> processImageProxy(imageProxy) }
                }
                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalyzer)
            } catch (e: Exception) { Log.e("Scanner", "Erro câmera", e) }
        }, ContextCompat.getMainExecutor(this))
    }

    @OptIn(ExperimentalGetImage::class)
    private fun processImageProxy(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            BarcodeScanning.getClient().process(image).addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val rawValue = barcode.rawValue
                    if (rawValue != null && (rawValue.startsWith("192.") || rawValue.startsWith("10.") || rawValue.startsWith("172."))) {
                        runOnUiThread { finalizeConnection(rawValue) }
                        break
                    }
                }
            }.addOnCompleteListener { imageProxy.close() }
        }
    }

    private fun finalizeConnection(teacherIp: String) {
        cameraProvider?.unbindAll()
        cameraProvider = null
        scannerView = null
        nativeUiContainer?.removeAllViews()
        socketClient = ExamSocketClient(teacherIp)
        kioskManager.startKioskMode()
        dbHelper.insertLog("EXAM_CONNECTED", "Conectado ao IP: $teacherIp")
        startExamFlow()
    }

    private fun startExamFlow() {
        socketServer = ExamSocketServer(9999) { _, _, message ->
            runOnUiThread {
                val type = message.optString("type")
                val payload = message.optJSONObject("payload") ?: JSONObject()
                when (type) {
                    "TEACHER_MESSAGE" -> showTeacherOverlay(payload.optString("message"))
                    "FORCE_FINISH" -> executeForcedFinish(payload.optString("reason"))
                    "RESUME_EXAM" -> resumeExam()
                    "CONFIRMATION_OK" -> dbHelper.markAsSynced(payload.optString("question_id"))
                }
            }
        }
        socketServer?.start()
        setupActionButtons()
        bridge.webView.settings.apply {
            javaScriptEnabled = true; domStorageEnabled = true; databaseEnabled = true; allowFileAccess = true; allowContentAccess = true; allowFileAccessFromFileURLs = true; allowUniversalAccessFromFileURLs = true; mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        ViewCompat.setLayerType(bridge.webView, View.LAYER_TYPE_HARDWARE, null)
        bridge.webView.addJavascriptInterface(ExamInterface(), "AndroidExam")
        heartbeatHandler.post(heartbeatRunnable)
        window.decorView.postDelayed({ bridge.webView.loadUrl("https://localhost/native_runner.html") }, 300)
    }

    private fun setupActionButtons() {
        nativeUiContainer?.removeAllViews()
        questionStatusTxt = TextView(this).apply {
            text = ""; setTextColor(Color.WHITE); textSize = 13f; setTypeface(null, Typeface.BOLD)
            val params = FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL; setMargins(0, 0, 0, 65) }
            layoutParams = params
        }
        nativeUiContainer?.addView(questionStatusTxt)
        val helpBtn = MaterialButton(this).apply {
            text = "AJUDA"; setBackgroundColor(Color.parseColor("#f97316")); setTextColor(Color.WHITE); textSize = 11f; cornerRadius = 20; stateListAnimator = null; setPadding(35, 15, 35, 15); minHeight = 0; minimumHeight = 0
            val params = FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { gravity = Gravity.BOTTOM or Gravity.END; setMargins(0, 0, 40, 45) }
            layoutParams = params; setOnClickListener { sendHelpRequest() }
        }
        nativeUiContainer?.addView(helpBtn)
    }

    private fun sendHelpRequest() { 
        socketClient?.sendEvent("HELP_REQUEST", JSONObject(), this)
        dbHelper.insertLog("HELP_REQUESTED", "Aluno solicitou ajuda")
        Toast.makeText(this, "Ajuda solicitada!", Toast.LENGTH_SHORT).show() 
    }
    
    private fun syncPendingAnswers() {
        val unsynced = dbHelper.getUnsyncedAnswers()
        for (i in 0 until unsynced.length()) {
            val ans = unsynced.getJSONObject(i)
            val data = JSONObject().apply { put("question_id", ans.getString("question_id")); put("value", ans.getString("value")); put("is_retry", true) }
            socketClient?.sendEvent("ANSWER_SUBMIT", data, this)
        }
    }

    private fun showTeacherOverlay(text: String) {
        if (teacherOverlay != null) return
        val rootLayout = window.decorView.findViewById<ViewGroup>(android.R.id.content)
        val card = MaterialCardView(this).apply { radius = 32f; setCardBackgroundColor(Color.parseColor("#4f46e5")); cardElevation = 20f; val params = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { gravity = Gravity.TOP; setMargins(40, 100, 40, 0) }; this.layoutParams = params }
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(48, 48, 48, 48) }
        layout.addView(TextView(this).apply { this.text = "AVISO DO PROFESSOR"; setTextColor(Color.WHITE); textSize = 12f; setTypeface(null, Typeface.BOLD) })
        layout.addView(TextView(this).apply { this.text = text; setTextColor(Color.WHITE); textSize = 18f; setPadding(0, 16, 0, 32) })
        layout.addView(MaterialButton(this).apply { this.text = "OK, ENTENDI"; setBackgroundColor(Color.WHITE); setTextColor(Color.BLACK); setOnClickListener { rootLayout.removeView(card); teacherOverlay = null; sendHeartbeat(); hideSystemUI() } })
        card.addView(layout); teacherOverlay = card; rootLayout.addView(card); sendHeartbeat()
    }

    private fun executeForcedFinish(reason: String? = null) { 
        isExamEnded = true
        kioskManager.stopKioskMode()
        val displayReason = reason ?: "O tempo da sua prova acabou ou ela foi encerrada pelo professor."
        dbHelper.insertLog("EXAM_FORCED_FINISH", "Motivo: $displayReason")
        
        runOnUiThread {
            endedDialog?.dismiss()
            
            val builder = AlertDialog.Builder(this)
            builder.setTitle("PROVA ENCERRADA")
            builder.setMessage(displayReason)
            builder.setCancelable(false)
            
            // Usando um layout customizado para os botões para garantir visibilidade
            val buttonLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.END
                setPadding(20, 20, 40, 40)
            }
            
            val btnJustify = MaterialButton(this, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
                text = "JUSTIFICAR"
                setOnClickListener { showJustificationInput() }
                layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { marginEnd = 20 }
            }
            
            val btnExit = MaterialButton(this).apply {
                text = "CIENTE / SAIR"
                setOnClickListener { finish() }
            }
            
            buttonLayout.addView(btnJustify)
            buttonLayout.addView(btnExit)
            
            builder.setView(buttonLayout)
            endedDialog = builder.create()
            endedDialog?.show()
        }
    }

    private fun showJustificationInput() {
        val input = EditText(this).apply {
            hint = "Descreva sua justificativa aqui..."
            setPadding(40, 40, 40, 40)
            setTextColor(Color.BLACK)
            minLines = 3
            gravity = Gravity.TOP
        }
        val container = LinearLayout(this).apply { 
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
            addView(input)
        }

        AlertDialog.Builder(this)
            .setTitle("Justificar Encerramento")
            .setView(container)
            .setCancelable(false)
            .setPositiveButton("ENVIAR") { _, _ ->
                val text = input.text.toString()
                if (text.isNotEmpty()) {
                    socketClient?.sendEvent("STUDENT_JUSTIFICATION", JSONObject().apply { put("text", text) }, this)
                    dbHelper.insertLog("JUSTIFICATION_SENT", text)
                    Toast.makeText(this, "Justificativa enviada ao professor.", Toast.LENGTH_LONG).show()
                }
                executeForcedFinish("Justificativa enviada. Aguarde análise ou saia.")
            }
            .setNegativeButton("VOLTAR") { _, _ -> executeForcedFinish(null) }
            .show()
    }

    private fun resumeExam() {
        if (isExamEnded) {
            isExamEnded = false
            endedDialog?.dismiss()
            endedDialog = null
            kioskManager.startKioskMode()
            dbHelper.insertLog("EXAM_RESUMED", "Prova reativada pelo professor")
            Toast.makeText(this, "Sua prova foi reativada pelo professor!", Toast.LENGTH_LONG).show()
            hideSystemUI()
        }
    }

    private fun sendHeartbeat() { 
        val data = JSONObject().apply { 
            put("battery", getBatteryLevel())
            put("status", if (teacherOverlay != null) "MESSAGE_VIEW" else if (isExamEnded) "ENDED" else "ACTIVE")
            put("kiosk_active", kioskManager.isKioskModeActive())
            put("unsynced_count", dbHelper.getUnsyncedAnswers().length())
        }
        socketClient?.sendEvent("HEARTBEAT", data, this) 
    }

    private fun getBatteryLevel(): Int { val bm = getSystemService(BATTERY_SERVICE) as android.os.BatteryManager; return bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY) }

    inner class ExamInterface {
        @JavascriptInterface
        fun saveAnswer(qId: String, valAns: String) { 
            dbHelper.saveAnswer(qId, valAns, false)
            socketClient?.sendEvent("ANSWER_SUBMIT", JSONObject().apply { put("question_id", qId); put("value", valAns) }, this@RunnerActivity)
        }
        @JavascriptInterface
        fun setQuestionInfo(info: String) { runOnUiThread { questionStatusTxt?.text = info } }
        @JavascriptInterface
        fun requestHelp() { sendHelpRequest() }
        @JavascriptInterface
        fun finishExam() { 
            runOnUiThread { 
                isExamEnded = true
                kioskManager.stopKioskMode()
                socketClient?.sendEvent("EXAM_FINISHED", JSONObject(), this@RunnerActivity)
                endedDialog = AlertDialog.Builder(this@RunnerActivity)
                    .setTitle("PROVA FINALIZADA")
                    .setMessage("Sua prova foi enviada com sucesso para o cofre do professor.")
                    .setCancelable(false)
                    .setPositiveButton("VOLTAR AO INÍCIO") { _, _ -> finish() }
                    .show()
            } 
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
        else if (!isExamEnded && teacherOverlay == null && scannerView == null) handleAppExitAttempt()
    }

    private fun handleAppExitAttempt() {
        warningCount++
        socketClient?.sendEvent("SECURITY_WARNING", JSONObject().apply { put("warning_index", warningCount); put("reason", "LOST_FOCUS") }, this)
        dbHelper.insertLog("SECURITY_WARNING", "Saída detectada ($warningCount)")
        if (warningCount >= MAX_WARNINGS) { 
            executeForcedFinish("AMBIENTE VIOLADO: Múltiplas tentativas de saída detectadas. Sua prova foi bloqueada.")
        } else { Toast.makeText(this, "Aviso de Segurança: $warningCount/$MAX_WARNINGS", Toast.LENGTH_LONG).show() }
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        try {
            val closeIntent = android.content.Intent(android.content.Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
            sendBroadcast(closeIntent)
        } catch (e: Exception) {}
    }

    override fun onDestroy() { 
        heartbeatHandler.removeCallbacks(heartbeatRunnable); kioskManager.stopKioskMode()
        cameraProvider?.unbindAll()
        socketClient?.stop(); socketServer?.stop(); cameraExecutor.shutdown(); super.onDestroy()
    }
}
