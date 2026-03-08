package com.examepad.app

import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.ViewCompat
import com.getcapacitor.BridgeActivity

class RunnerActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Ativa Modo Imersivo Sticky (Esconde barras de sistema persistentemente)
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN)

        // Impede que a tela apague
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 1. Configurações de Software/Javascript (WebSettings)
        bridge.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportMultipleWindows(false)
            mediaPlaybackRequiresUserGesture = false
        }
        
        // 2. Configuração de Hardware (WebView/View)
        // Usamos ViewCompat para garantir compatibilidade e evitar erros de resolução do IDE
        ViewCompat.setLayerType(bridge.webView, View.LAYER_TYPE_HARDWARE, null)

        // Tenta iniciar o Lock Task (Fixação de tela) para evitar minimizar
        try {
            startLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Redireciona para o runner especial offline via esquema do Capacitor
        window.decorView.postDelayed({
            bridge.webView.loadUrl("https://localhost/native_runner.html")
        }, 500)
    }

    override fun onBackPressed() {
        // Bloqueia o botão voltar para evitar sair da prova acidentalmente
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN)
        }
    }
}
