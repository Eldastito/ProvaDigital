package com.examepad.app.security

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.util.Log

class KioskManager(private val activity: Activity) {

    private val TAG = "KioskManager"

    /**
     * Ativa o modo de bloqueio (Screen Pinning)
     */
    fun startKioskMode() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                activity.startLockTask()
                Log.d(TAG, "🔒 Kiosk Mode (Screen Pinning) ativado")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao ativar Kiosk Mode: ${e.message}")
        }
    }

    /**
     * Desativa o modo de bloqueio
     */
    fun stopKioskMode() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                activity.stopLockTask()
                Log.d(TAG, "🔓 Kiosk Mode desativado")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao desativar Kiosk Mode: ${e.message}")
        }
    }

    /**
     * Verifica se o app está bloqueado na tela
     */
    fun isKioskModeActive(): Boolean {
        val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            @Suppress("DEPRECATION")
            activityManager.isInLockTaskMode
        } else {
            false
        }
    }
}
