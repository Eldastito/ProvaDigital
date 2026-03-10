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
        
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 80, 48, 48)
            setBackgroundColor(android.graphics.Color.parseColor("#0f172a"))
        }

        val title = TextView(this).apply {
            text = "ExamePad"
            textSize = 28f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        root.addView(title)

        val subtitle = TextView(this).apply {
            text = "Selecione o modo de operação"
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#94a3b8"))
            setPadding(0, 8, 0, 64)
        }
        root.addView(subtitle)

        // BOTÃO DO ALUNO (Card)
        val studentCard = MaterialCardView(this).apply {
            setRadius(32f)
            setCardBackgroundColor(android.graphics.Color.parseColor("#1e293b"))
            setPadding(32, 32, 32, 32)
            val params = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            params.setMargins(0, 0, 0, 32)
            layoutParams = params
            setOnClickListener {
                startActivity(Intent(this@NativeStudentActivity, RunnerActivity::class.java))
            }
        }
        val studentLayout = LinearLayout(this).apply { 
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }
        studentLayout.addView(TextView(this).apply { text = "MODO ALUNO"; setTextColor(android.graphics.Color.WHITE); setTypeface(null, android.graphics.Typeface.BOLD) })
        studentLayout.addView(TextView(this).apply { text = "Iniciar realização de prova"; setTextColor(android.graphics.Color.GRAY); textSize = 12f })
        studentCard.addView(studentLayout)
        root.addView(studentCard)

        // BOTÃO DO PROFESSOR (Card)
        val profferCard = MaterialCardView(this).apply {
            setRadius(32f)
            setCardBackgroundColor(android.graphics.Color.parseColor("#1e293b"))
            setStrokeWidth(2)
            setStrokeColor(android.graphics.Color.parseColor("#6366f1")) // Indigo border
            val params = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            layoutParams = params
            setOnClickListener {
                startActivity(Intent(this@NativeStudentActivity, ProfferActivity::class.java))
            }
        }
        val profferLayout = LinearLayout(this).apply { 
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }
        profferLayout.addView(TextView(this).apply { text = "MODO PROFESSOR"; setTextColor(android.graphics.Color.parseColor("#6366f1")); setTypeface(null, android.graphics.Typeface.BOLD) })
        profferLayout.addView(TextView(this).apply { text = "Monitorar sala em tempo real"; setTextColor(android.graphics.Color.GRAY); textSize = 12f })
        profferCard.addView(profferLayout)
        root.addView(profferCard)

        setContentView(root)
    }
}
