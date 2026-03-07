package com.examepad.app

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class NativeStudentActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Layout Programático para garantir carregamento sem XML se houver erro de compilação de resource
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 80, 48, 48)
            setBackgroundColor(android.graphics.Color.parseColor("#0f172a")) // Deep Navy
        }

        // Header
        val title = TextView(this).apply {
            text = "Minhas Provas"
            textSize = 28f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        root.addView(title)

        val subtitle = TextView(this).apply {
            text = "Ambiente 100% Seguro e Offline"
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#94a3b8"))
            setPadding(0, 8, 0, 64)
        }
        root.addView(subtitle)

        // Card de Prova Disponível
        val examCard = MaterialCardView(this).apply {
            setRadius(32f)
            setCardBackgroundColor(android.graphics.Color.parseColor("#1e293b"))
            setStrokeWidth(2)
            setStrokeColor(android.graphics.Color.parseColor("#334155"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val cardContent = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val examName = TextView(this).apply {
            text = "Avaliação Diagnóstica Integrada"
            textSize = 18f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        cardContent.addView(examName)

        val examMeta = TextView(this).apply {
            text = "CIÊNCIAS | 10 Questões | 3D Habilitado"
            textSize = 12f
            setTextColor(android.graphics.Color.parseColor("#10b981")) // Mint
            setPadding(0, 8, 0, 32)
        }
        cardContent.addView(examMeta)

        val btnStart = MaterialButton(this).apply {
            setText("INICIAR PROVA")
            setCornerRadius(16)
            setBackgroundColor(android.graphics.Color.parseColor("#6366f1"))
            setOnClickListener {
                startActivity(Intent(this@NativeStudentActivity, RunnerActivity::class.java))
            }
        }
        cardContent.addView(btnStart)

        examCard.addView(cardContent)
        root.addView(examCard)

        setContentView(root)
    }
}
