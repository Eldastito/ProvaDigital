-- =====================================================
-- RISK CALCULATION VIEW (Otimização Dashboard)
-- =====================================================
-- Esta View calcula o risco de cada aluno diretamente no banco,
-- eliminando a necessidade de processar no frontend.

CREATE OR REPLACE VIEW public.student_risk_assessment AS
WITH student_stats AS (
    -- Calcular média de notas por aluno
    SELECT 
        s.id AS student_id,
        s.name AS student_name,
        s.class_id,
        s.school_id,
        s.tenant_id,
        COALESCE(AVG(er.total_score), 0) AS avg_score,
        COUNT(er.id) AS exam_count,
        -- Simular frequência baseada no hash do ID (temporário até termos dados reais)
        -- Normaliza para 60-100%
        60 + (ABS(('x' || SUBSTRING(MD5(s.id), 1, 8))::bit(32)::int) % 41) AS simulated_attendance
    FROM public.students s
    LEFT JOIN public.exam_results er ON er.student_id = s.id
    GROUP BY s.id, s.name, s.class_id, s.school_id, s.tenant_id
),
risk_factors AS (
    -- Calcular pontuação de risco
    SELECT 
        student_id,
        student_name,
        class_id,
        school_id,
        tenant_id,
        avg_score,
        exam_count,
        simulated_attendance,
        -- FATOR 1: Frequência (40 pontos)
        CASE 
            WHEN simulated_attendance < 75 THEN 40
            WHEN simulated_attendance < 85 THEN 15
            ELSE 0
        END AS attendance_risk,
        -- FATOR 2: Desempenho Acadêmico (60 pontos)
        CASE 
            WHEN exam_count > 0 AND avg_score < 5.0 THEN 40
            WHEN exam_count > 0 AND avg_score < 7.0 THEN 20
            ELSE 0
        END AS academic_risk
    FROM student_stats
)
SELECT 
    student_id,
    student_name,
    class_id,
    school_id,
    tenant_id,
    avg_score,
    exam_count,
    simulated_attendance,
    -- SCORE TOTAL (0-100)
    LEAST(attendance_risk + academic_risk, 100) AS risk_score,
    -- NÍVEL DE RISCO
    CASE 
        WHEN (attendance_risk + academic_risk) >= 50 THEN 'HIGH'
        WHEN (attendance_risk + academic_risk) >= 20 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_level,
    -- Fatores detalhados (JSON)
    COALESCE(
        (
            SELECT jsonb_agg(factor)
            FROM (
                SELECT jsonb_build_object(
                    'name', CASE WHEN simulated_attendance < 75 THEN 'Frequência Crítica' ELSE 'Frequência em Queda' END,
                    'severity', CASE WHEN simulated_attendance < 75 THEN 'HIGH' ELSE 'MEDIUM' END,
                    'value', simulated_attendance || '%',
                    'message', CASE 
                        WHEN simulated_attendance < 75 THEN 'Aluno com alto nº de faltas. Risco iminente de reprovação por falta.'
                        ELSE 'Faltas aumentando. Acompanhar.'
                    END
                ) AS factor
                FROM risk_factors rf2
                WHERE rf2.student_id = risk_factors.student_id AND rf2.attendance_risk > 0
                UNION ALL
                SELECT jsonb_build_object(
                    'name', CASE WHEN avg_score < 5.0 THEN 'Desempenho Insuficiente' ELSE 'Desempenho em Alerta' END,
                    'severity', CASE WHEN avg_score < 5.0 THEN 'HIGH' ELSE 'MEDIUM' END,
                    'value', ROUND(avg_score::numeric, 1),
                    'message', CASE 
                        WHEN avg_score < 5.0 THEN 'Média geral abaixo de 5.0. Necessita reforço urgente.'
                        ELSE 'Média abaixo de 7.0. Monitorar.'
                    END
                ) AS factor
                FROM risk_factors rf3
                WHERE rf3.student_id = risk_factors.student_id AND rf3.academic_risk > 0
            ) factors
        ),
        '[]'::jsonb
    ) AS risk_factors,
    NOW() AS generated_at
FROM risk_factors
ORDER BY risk_score DESC;

-- =====================================================
-- RLS / SEGURANÇA
-- =====================================================
-- IMPORTANTE: Views não suportam RLS Policies diretamente.
-- A segurança é herdada das tabelas base (students, exam_results).
-- 
-- Para restringir acesso à View por hierarquia, você tem 2 opções:
-- 1. Criar uma FUNCTION que filtra baseado no auth.uid() e chamar via RPC
-- 2. Filtrar no frontend: WHERE school_id = userSchoolId
-- 
-- Recomendação: Usar opção 2 (filtro no frontend) por simplicidade.

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Como é uma View, os índices já existem nas tabelas base (students, exam_results)
-- Mas podemos criar uma MATERIALIZED VIEW se a performance for crítica:

-- CREATE MATERIALIZED VIEW public.student_risk_assessment_cached AS
-- SELECT * FROM public.student_risk_assessment;
-- 
-- CREATE UNIQUE INDEX ON public.student_risk_assessment_cached (student_id);
-- CREATE INDEX ON public.student_risk_assessment_cached (school_id);
-- CREATE INDEX ON public.student_risk_assessment_cached (risk_level);
-- 
-- -- Refresh automático (via cron job ou trigger)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.student_risk_assessment_cached;
