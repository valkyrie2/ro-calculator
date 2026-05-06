import { corsHeaders } from '../_shared/cors.ts';

/**
 * Supabase Edge Function: generate-item-script
 *
 * Receives basic item metadata and description from the admin panel,
 * forwards them to Google Gemini with a carefully crafted prompt,
 * and returns a `script` object matching the RO Calculator's internal
 * bonus key format.
 *
 * Required Supabase secret:
 *   GEMINI_API_KEY  — your Google AI Studio API key
 *
 * Set it with:
 *   npx supabase secrets set GEMINI_API_KEY=AIza...
 */

const SYSTEM_PROMPT = `You are an expert Ragnarok Online (thROG / idROG renewal) item script analyzer.
You read item descriptions (in Thai and/or English) and output a JSON "script" object that encodes all stat bonuses.

## SCRIPT FORMAT
Return ONLY a plain JSON object where:
- Each key is a bonus type (see keys below)
- Each value is an ARRAY OF STRINGS representing the bonus amounts

## STAT KEYS
Base stats: str, agi, vit, int, dex, luk, allStatus
Trait stats: pow, sta, wis, spl, con, crt, pAtk, sMatk, cRate, hplus, allTrait
Combat: atk, atkPercent, matk, matkPercent, def, mdef
Accuracy/speed: cri, criDmg, criticalDamage, hit, flee, perfectHit, perfectDodge, aspd, aspdPercent
Range/melee type: melee, range, bowRange
HP/SP: hp, hpPercent, sp, spPercent, mhp, msp
EXP bonus: expBonus

## PHYSICAL DAMAGE BONUS KEYS (% bonus to physical damage)
By target race: p_race_demihuman, p_race_undead, p_race_demon, p_race_brute, p_race_angel,
  p_race_dragon, p_race_fish, p_race_insect, p_race_plant, p_race_formless, p_race_all
By target element: p_element_fire, p_element_water, p_element_wind, p_element_earth,
  p_element_neutral, p_element_ghost, p_element_undead, p_element_holy, p_element_dark, p_element_all
By target size: p_size_s, p_size_m, p_size_l, p_size_all
By target class: p_class_normal, p_class_boss, p_class_all
Final physical damage multiplier (%): p_final
Physical defense penetration (%): pene_res
Physical penetration by race: p_pene_race_demihuman, p_pene_race_all, p_pene_race_undead, p_pene_race_demon, etc.

## MAGIC DAMAGE BONUS KEYS (% bonus to magic damage)
By target race: m_race_demihuman, m_race_undead, m_race_demon, m_race_brute, m_race_angel,
  m_race_dragon, m_race_fish, m_race_insect, m_race_plant, m_race_formless, m_race_all
By your own cast element: m_my_element_fire, m_my_element_water, m_my_element_wind, m_my_element_earth,
  m_my_element_neutral, m_my_element_dark, m_my_element_holy, m_my_element_all
By target element: m_element_fire, m_element_water, m_element_wind, m_element_earth, m_element_all
By target size: m_size_s, m_size_m, m_size_l, m_size_all
By target class: m_class_normal, m_class_boss, m_class_all
Final magic damage multiplier (%): m_final
Magic defense penetration (%): pene_mres
Magic penetration by race: m_pene_race_demihuman, m_pene_race_all, m_pene_race_undead, m_pene_race_demon, etc.

## RESISTANCE KEYS
Reduce incoming physical damage (%): res
Reduce incoming magic damage (%): mres

## SKILL DAMAGE KEYS
Use the exact English skill name as the key (e.g. "Cross Impact", "Hundred Spears", "Triple Laser").
The value is the % damage increase.

## CAST TIME / DELAY KEYS
Variable cast time reduction %: vct
Fixed cast time reduction %: fct, fctPercent
After cast delay reduction %: acd
Skill-specific cooldown reduction: cd__SkillName (e.g. "cd__Cross Impact")

## CHANCE PROC KEYS
For bonuses that trigger on hit/attack with a chance, prefix with chance__, e.g.:
  chance__atk, chance__str, chance__p_race_demihuman, chance__criDmg

## SPECIAL
p_infiltration: ["1"]  — ignores DEF (like Ice Pick)

## VALUE SYNTAX (ALL values must be STRINGS in the array)
- Simple flat: ["10"]  means +10
- At refine N: ["N===VALUE"]  e.g. ["7===20"] means +20 at +7 refine
- Per refine level: ["1---VALUE"]  e.g. ["1---5"] means +5 per refine level
- Multiple conditions: ["5","7===10","9===5"]  means +5 base, +10 more at +7, +5 more at +9
- Negative value: ["-30"]  means -30
- Set bonus: ["EQUIP[OtherItemName]===VALUE"]
- Grade bonus: ["GRADE[weapon==A]===VALUE"]
- BaseLv condition: ["SUM[level==N]===-VALUE"]  used for per-10-level penalties

## EXAMPLES
- STR+3, DEX+2 → {"str":["3"],"dex":["2"]}
- ATK+5%, +4 per refine level → {"atkPercent":["5"],"atk":["1---4"]}
- MATK+80 → {"matk":["80"]}
- All Stats +5 → {"allStatus":["5"]}
- Damage to Demihuman +15% → {"p_race_demihuman":["15"]}
- Cross Impact damage +30%, +10% more at +9 → {"Cross Impact":["30","9===10"]}
- FLEE -30 → {"flee":["-30"]}
- Perfect Dodge +20 → {"perfectDodge":["20"]}
- MaxHP +500 → {"mhp":["500"]}
- ASPD +10% → {"aspdPercent":["10"]}
- CRI Rate +5 → {"cri":["5"]}
- Critical Damage +10% → {"criDmg":["10"]}
- VCT -10% → {"vct":["10"]}
- Reduces after cast delay 10% → {"acd":["10"]}
- Damage to all races +10%, to Boss +5% more → {"p_race_all":["10"],"p_class_boss":["5"]}
- Card: increase Fire element damage 20% → {"p_element_fire":["20"]}
- Card: MATK +3%, damage to Angel race +10% → {"matkPercent":["3"],"m_race_angel":["10"]}
- +6 per refine, but if +9 subtract 20 → {"atk":["1---6","9===-20"]}  (net ATK: +54-20=+34 at +9)

## RULES
1. Output ONLY the raw JSON object. No markdown. No explanation.
2. If the description mentions something unmappable, skip it.
3. All values in the array must be strings.
4. Thai descriptions: interpret the bonus meaning correctly (e.g. "เพิ่ม ATK 5%" → atkPercent 5).
5. For card bonuses (compositionPos 128): map race/element/class damage bonuses normally.
6. If no bonuses detected, return {}.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { description, name, itemTypeId, cardPrefix, slots, compositionPos } = body as {
      description?: string;
      name?: string;
      itemTypeId?: number;
      cardPrefix?: string;
      slots?: number;
      compositionPos?: number;
    };

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret is not configured in Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const isCard = compositionPos === 128 || itemTypeId === 6;

    const userMsg = [
      `Item name: ${name ?? 'Unknown'}`,
      itemTypeId != null ? `Item type id: ${itemTypeId}` : null,
      isCard ? `This is a CARD item.` : null,
      cardPrefix ? `Card prefix/suffix: "${cardPrefix}"` : null,
      slots != null ? `Slots: ${slots}` : null,
      `Description:\n${description ?? '(no description)'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error ${geminiResp.status}`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const geminiData = await geminiResp.json();
    const rawContent: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let script: Record<string, string[]>;
    try {
      script = JSON.parse(rawContent);
    } catch {
      script = {};
    }

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
