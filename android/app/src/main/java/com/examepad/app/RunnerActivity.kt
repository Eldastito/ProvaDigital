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
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.appcompat.app.AlertDialog
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
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
    private val MAX_WARNINGS = 2
    private lateinit var dbHelper: ExamDatabaseHelper
    private var socketClient: ExamSocketClient? = null
    private var socketServer: ExamSocketServer? = null
    
    private var isExamEnded = false
    private var teacherOverlay: View? = null
    private var nativeUiContainer: FrameLayout? = null
    private var scannerView: PreviewView? = null
    private lateinit var cameraExecutor: ExecutorService
    private var questionStatusTxt: TextView? = null

    // Variáveis BLE
    private var bluetoothAdapter: BluetoothAdapter? = null
    private val ROOM_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var lastBleSeenTime = System.currentTimeMillis()
    private val BLE_TIMEOUT_MS = 45000 // 45 segundos sem sinal = fora da sala
    
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            sendHeartbeat()
            checkBlePresence()
            heartbeatHandler.postDelayed(this, 15000)
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.CAMERA] == true) {
            startCamera()
        }
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            startBleScanning()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dbHelper = ExamDatabaseHelper(this)
        cameraExecutor = Executors.newSingleThreadExecutor()
        
        val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter

        hideSystemUI()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)

        val rootLayout = window.decorView.findViewById<ViewGroup>(android.R.id.content)
        nativeUiContainer = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        rootLayout.addView(nativeUiContainer)

        window.decorView.postDelayed({ setupScannerUI() }, 100)
    }

    private fun setupScannerUI() {
        nativeUiContainer?.removeAllViews()
        val scannerLayout = FrameLayout(this).apply { layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        scannerView = PreviewView(this).apply { layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        scannerLayout.addView(scannerView)
        val overlay = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setBackgroundColor(Color.parseColor("#CC000000")); layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        val hint = TextView(this).apply { text = "Aponte para o QR Code do Professor"; setTextColor(Color.WHITE); textSize = 20f; gravity = Gravity.CENTER; setPadding(40, 0, 40, 100) }
        overlay.addView(hint); scannerLayout.addView(overlay); nativeUiContainer?.addView(scannerLayout)

        val permissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        requestPermissionLauncher.launch(permissions.toTypedArray())
    }

    private fun startBleScanning() {
        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) return
        
        val scanner = bluetoothAdapter!!.bluetoothLeScanner
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(ROOM_UUID)).build()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_POWER).build()

        val scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                lastBleSeenTime = System.currentTimeMillis()
            }
        }
        
        try {
            scanner.startScan(listOf(filter), settings, scanCallback)
        } catch (e: SecurityException) {
            Log.e("PresenceBLE", "Sem permissão para escanear Bluetooth")
        }
    }

    private fun checkBlePresence() {
        if (System.currentTimeMillis() - lastBleSeenTime > BLE_TIMEOUT_MS) {
            // ALERTA: Aluno possivelmente fora da sala
            socketClient?.sendEvent("BLE_OUT_OF_RANGE", JSONObject())
            Toast.makeText(this, "Atenção: Mantenha-se dentro da sala de prova!", Toast.LENGTH_LONG).show()
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(scannerView?.surfaceProvider) }
                val imageAnalyzer = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build().also {
                    it.setAnalyzer(cameraExecutor) { imageProxy -> processImageProxy(imageProxy, cameraProvider) }
                }
                cameraProvider.unbindAll(); cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalyzer)
            } catch (e: Exception) { Log.e("Scanner", "Erro câmera", e) }
        }, ContextCompat.getMainExecutor(this))
    }

    @OptIn(ExperimentalGetImage::class)
    private fun processImageProxy(imageProxy: ImageProxy, cameraProvider: ProcessCameraProvider) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            BarcodeScanning.getClient().process(image).addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val rawValue = barcode.rawValue
                    if (rawValue != null && (rawValue.startsWith("192.") || rawValue.startsWith("10.") || rawValue.startsWith("172."))) {
                        runOnUiThread { cameraProvider.unbindAll(); finalizeConnection(rawValue) }
                        break
                    }
                }
            }.addOnCompleteListener { imageProxy.close() }
        }
    }

    private fun finalizeConnection(teacherIp: String) {
        nativeUiContainer?.removeAllViews()
        socketClient = ExamSocketClient(teacherIp)
        startExamFlow()
    }

    private fun startExamFlow() {
        socketServer = ExamSocketServer(9999) { _, _, message ->
            runOnUiThread {
                val type = message.optString("type")
                val payload = message.optJSONObject("payload") ?: JSONObject()
                when (type) {
                    "TEACHER_MESSAGE" -> showTeacherOverlay(payload.optString("message"))
                    "FORCE_FINISH" -> executeForcedFinish()
                    "CONFIRMATION_OK" -> handleHandshakeSuccess()
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
        bridge.webView.let { webView -> val p = webView.layoutParams; if (p is ViewGroup.MarginLayoutParams) { p.bottomMargin = 0; webView.layoutParams = p } }
    }

    private fun handleHandshakeSuccess() { runOnUiThread { Toast.makeText(this, "Recebimento confirmado!", Toast.LENGTH_SHORT).show(); finish() } }
    private fun sendHelpRequest() { socketClient?.sendEvent("HELP_REQUEST", JSONObject()); Toast.makeText(this, "Ajuda solicitada!", Toast.LENGTH_SHORT).show() }
    private fun showTeacherOverlay(text: String) {
        if (teacherOverlay != null) return
        val rootLayout = window.decorView.findViewById<ViewGroup>(android.R.id.content)
        val card = MaterialCardView(this).apply { radius = 32f; setCardBackgroundColor(Color.parseColor("#4f46e5")); cardElevation = 20f; val params = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { gravity = Gravity.TOP; setMargins(40, 100, 40, 0) }; this.layoutParams = params }
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(48, 48, 48, 48) }
        val title = TextView(this).apply { this.text = "AVISO DO PROFESSOR"; setTextColor(Color.WHITE); textSize = 12f; setTypeface(null, Typeface.BOLD) }
        val content = TextView(this).apply { this.text = text; setTextColor(Color.WHITE); textSize = 18f; setPadding(0, 16, 0, 32) }
        val btn = MaterialButton(this).apply { this.text = "OK, ENTENDI"; setBackgroundColor(Color.WHITE); setTextColor(Color.BLACK); setOnClickListener { rootLayout.removeView(card); teacherOverlay = null; sendHeartbeat(); hideSystemUI() } }
        layout.addView(title); layout.addView(content); layout.addView(btn); card.addView(layout); teacherOverlay = card; rootLayout.addView(card); sendHeartbeat()
    }
    private fun executeForcedFinish() { isExamEnded = true; AlertDialog.Builder(this).setTitle("PROVA ENCERRADA").setMessage("O tempo acabou.").setCancelable(false).setPositiveButton("Sair") { _, _ -> finish() }.show() }
    private fun sendHeartbeat() { val data = JSONObject().apply { put("battery", getBatteryLevel()); put("status", if (teacherOverlay != null) "MESSAGE_VIEW" else "ACTIVE") }; socketClient?.sendEvent("HEARTBEAT", data) }
    private fun getBatteryLevel(): Int { val bm = getSystemService(BATTERY_SERVICE) as android.os.BatteryManager; return bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY) }

    inner class ExamInterface {
        @JavascriptInterface
        fun saveAnswer(qId: String, valAns: String) { dbHelper.saveAnswer(qId, valAns); val data = JSONObject().apply { put("question_id", qId); put("value", valAns) }; socketClient?.sendEvent("ANSWER_SUBMIT", data) }
        @JavascriptInterface
        fun setQuestionInfo(info: String) { runOnUiThread { questionStatusTxt?.text = info } }
        @JavascriptInterface
        fun requestHelp() { sendHelpRequest() }
        @JavascriptInterface
        fun finishExam() { runOnUiThread { socketClient?.sendEvent("EXAM_FINISHED", JSONObject()) } }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
        else if (!isExamEnded && teacherOverlay == null && scannerView == null) { handleAppExitAttempt() }
    }

    private fun handleAppExitAttempt() {
        warningCount++; socketClient?.sendEvent("SECURITY_WARNING", JSONObject().apply { put("warning", warningCount) })
        if (warningCount >= MAX_WARNINGS) { isExamEnded = true; AlertDialog.Builder(this).setTitle("AMBIENTE VIOLADO").setMessage("Prova bloqueada.").setCancelable(false).setPositiveButton("Sair") { _, _ -> finish() }.show() }
        else { Toast.makeText(this, "Não saia da prova! ($warningCount/$MAX_WARNINGS)", Toast.LENGTH_LONG).show() }
    }

    private fun hideSystemUI() { window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN) }

    override fun onDestroy() { heartbeatHandler.removeCallbacks(heartbeatRunnable); socketClient?.stop(); socketServer?.stop(); cameraExecutor.shutdown(); super.onDestroy() }
}
