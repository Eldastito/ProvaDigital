// supabase/functions/grade-exam/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// AES-GCM Algo Config
const ALGO = { name: "AES-GCM", length: 256 };

serve(async (req) => {
    const { attempt_id } = await req.json();

    // 1. Admin Client (Service Role) - The only one who can read server_keys
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        // 2. Fetch Attempt & Encrypted Answers
        const { data: attempt, error: attemptError } = await supabaseAdmin
            .from('exam_attempts')
            .select('*, exam_versions!inner(*)')
            .eq('id', attempt_id)
            .single();

        if (attemptError || !attempt) throw new Error("Attempt not found");

        const encryptedAnswersPacket = attempt.metadata.encryptedAnswers;
        if (!encryptedAnswersPacket) throw new Error("No encrypted answers found");

        // 3. Fetch Exam Session Key (Secure)
        // Note: In real PKI, this might be wrapped for the server identity.
        // For MVP, we stored the raw AES Session Key in `exam_server_keys`.
        const { data: keyRecord, error: keyError } = await supabaseAdmin
            .from('exam_server_keys')
            .select('session_key_json')
            .eq('exam_id', attempt.exam_id)
            .single();

        if (keyError || !keyRecord) throw new Error("Server Key missing. Cannot grade.");

        // 4. Import Key & Decrypt
        const sessionKey = await crypto.subtle.importKey(
            "jwk",
            keyRecord.session_key_json,
            ALGO,
            false,
            ["decrypt"]
        );

        // Parse Packet "IV:DATA"
        const [ivB64, dataB64] = encryptedAnswersPacket.split(':');
        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            sessionKey,
            data
        );

        const decryptedJson = new TextDecoder().decode(decryptedBuffer);
        const answers = JSON.parse(decryptedJson); // { itemId: alternativeId }

        // 5. Grading Logic
        let totalScore = 0;
        const items = attempt.exam_versions.items_snapshot;
        const gradeLog = [];

        // Simple grading (assuming items_snapshot structure)
        for (const item of items) {
            const studentAnsId = answers[item.id]; // or whatever format answers is in
            const correctAlt = item.alternatives.find((a: any) => a.isCorrect);

            const isCorrect = studentAnsId === correctAlt.id;
            const score = isCorrect ? 1 : 0; // Simplified weight

            totalScore += score;
            gradeLog.push({ itemId: item.id, isCorrect, score });
        }

        // 6. Save Result
        const { error: resultError } = await supabaseAdmin
            .from('exam_results')
            .insert({
                exam_id: attempt.exam_id,
                student_id: attempt.student_id,
                total_score: totalScore,
                auto_grade_log: gradeLog,
                graded_at: new Date().toISOString()
            });

        if (resultError) throw resultError;

        return new Response(
            JSON.stringify({ success: true, score: totalScore }),
            { headers: { "Content-Type": "application/json" } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
})
