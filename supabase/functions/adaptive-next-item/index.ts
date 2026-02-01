
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItemResponse {
    itemId: string;
    isCorrect: boolean;
    discrimination: number;
    difficulty: number;
    guessing: number;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { attemptId, userAnswers } = await req.json()

        // 1. Init Supabase (Admin Context for secure DB access)
        // Note: We need SERVICE_ROLE_KEY to see all items if RLS is strict for students accessing headers/metadata
        // But ideally we use the user's token and ensure RLS allows 'SELECT id, tri_params' for the exam engine.
        // For MVP robustness, we use the User's Auth Context passed via Authorization Header.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 2. Fetch Attempt + Exam Version
        const { data: attempt, error: attemptError } = await supabaseClient
            .from('exam_attempts')
            .select('*, exam_version_id')
            .eq('id', attemptId)
            .single()

        if (attemptError || !attempt) throw new Error("Attempt not found")

        // 3. Fetch Item Pool specific to this exam version
        // In a real optimized system, we would fetch ONLY unseen items or cache this.
        // For now, we fetch the item configs from exam_version -> items
        const { data: version, error: verError } = await supabaseClient
            .from('exam_versions')
            .select('items')
            .eq('id', attempt.exam_version_id)
            .single()

        if (verError || !version) throw new Error("Exam Version not found")

        // Extract Item IDs from version config (assuming standard format)
        // Adjust logic if 'items' jsonb structure is different
        const configItems: any[] = version.items || []
        const itemIds = configItems.map((c: any) => c.itemId)

        // Fetch actual Item Parameters from DB
        // SECURITY: We only select fields needed for calculation, no sensitive data like 'isCorrect' or 'teacherNotes'
        const { data: itemBank, error: bankError } = await supabaseClient
            .from('items')
            .select('id, tri_params, type') // Minimal fields
            .in('id', itemIds)

        if (bankError || !itemBank) throw new Error("Item Bank fetch failed")

        // 4. Reconstruct Path/History
        // 'userAnswers' comes from client: { [itemId]: selectedAltId }
        // We need to score them to run the CAT engine.
        // Ideally we would fetch the correct answer key securely here and grade server-side.
        // For this step, we'll fetch 'alternatives' specifically to check correctness.

        // FETCH FULL ITEMS FOR CORRECTION (Securely)
        const { data: fullItems } = await supabaseClient
            .from('items')
            .select('id, alternatives, tri_params')
            .in('id', Object.keys(userAnswers))

        const responses: ItemResponse[] = []

        if (fullItems) {
            fullItems.forEach((item: any) => {
                const studentSelection = userAnswers[item.id]
                if (studentSelection) {
                    const correctAlt = item.alternatives.find((a: any) => a.isCorrect)
                    const isCorrect = correctAlt && correctAlt.id === studentSelection

                    if (item.tri_params) {
                        responses.push({
                            itemId: item.id,
                            isCorrect,
                            discrimination: item.tri_params.discrimination || 1,
                            difficulty: item.tri_params.difficulty || 0,
                            guessing: item.tri_params.guessing || 0.2
                        })
                    }
                }
            })
        }

        // 5. Run CAT Logic (Ported from CATEngine.ts)
        // --- MATH START ---

        const calculateProbability = (theta: number, a: number, b: number, c: number): number => {
            const z = -a * (theta - b);
            let denominator = 1 + Math.exp(z);
            if (Math.abs(z) > 100) denominator = z < 0 ? 1 : Number.MAX_VALUE;
            return c + (1 - c) / denominator;
        }

        const calculateItemInformation = (theta: number, item: any): number => {
            if (!item.tri_params) return 0.01;
            const { difficulty: b, discrimination: a, guessing: c } = item.tri_params;
            const P = calculateProbability(theta, a, b, c);
            const Q = 1 - P;
            if (P <= c || P >= 1) return 0.001;
            const term1 = (P - c) / (1 - c);
            return (Math.pow(a, 2) * Q / P) * Math.pow(term1, 2);
        }

        const estimateTheta = (resps: ItemResponse[], currentTheta: number = 0): number => {
            if (resps.length === 0) return 0;
            let theta = currentTheta;
            for (let i = 0; i < 10; i++) {
                let num = 0, den = 0;
                for (const r of resps) {
                    const { discrimination: a, difficulty: b, guessing: c } = r;
                    const P = calculateProbability(theta, a, b, c);
                    const Q = 1 - P;
                    if (P <= c + 0.0001 || P >= 0.9999) continue;
                    const factor = (P - c) / (1 - c);
                    const u = r.isCorrect ? 1 : 0;
                    num += (a * (u - P) * factor) / P;
                    den += (Math.pow(a, 2) * Q / P) * Math.pow(factor, 2);
                }
                if (den < 0.001) break;
                const change = num / den;
                theta += change;
                theta = Math.max(-4, Math.min(4, theta));
                if (Math.abs(change) < 0.01) break;
            }
            return theta;
        }

        // --- MATH END ---

        // 6. Execute Math
        const newTheta = estimateTheta(responses, 0); // Always recalculate full history for security

        // 7. Select Next Item
        const usedIds = responses.map(r => r.itemId)

        const availableItems = itemBank.filter((i: any) =>
            !usedIds.includes(i.id) &&
            i.tri_params
        )

        let nextItem = null
        let finished = false

        if (availableItems.length === 0) {
            finished = true
        } else {
            // Max Info Strategy
            const rankedItems = availableItems.sort((a: any, b: any) => {
                const infoA = calculateItemInformation(newTheta, a);
                const infoB = calculateItemInformation(newTheta, b);
                return infoB - infoA;
            });
            const top = rankedItems.slice(0, 3)
            nextItem = top[Math.floor(Math.random() * top.length)]
        }

        // 8. Return Result (Securely)
        // We expect the client to fetch the full item details (statement, alts) via a separate standardized call 
        // OR we can return the minimal ID here and let the client component load it.
        // For this architecture, returning the ID is safer and cleaner.

        return new Response(
            JSON.stringify({
                nextItemId: nextItem ? nextItem.id : null,
                currentTheta: newTheta,
                finished,
                debugInfo: { itemCount: responses.length, theta: newTheta } // Remove in prod
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
