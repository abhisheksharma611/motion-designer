import os
import shutil
import sys

root = os.path.expanduser("~/.cache/motion-designer/ACE-Step-1.5")
film = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(film, "audio", "source")
sys.path.insert(0, root)
os.chdir(root)

STRUCTURE = "[Intro]\n[Instrumental]\n\n[Build-up]\n[Instrumental]\n\n[Drop]\n[Instrumental]\n\n[Breakdown]\n[Instrumental]\n\n[Drop]\n[Instrumental]\n\n[Outro]"
META = {"bpm": 128, "keyscale": "A minor", "timesignature": "4", "duration": 96}
TAKES = {
    "house": (11, "Instrumental melodic house, 128 BPM, punchy four-on-the-floor kick, crisp claps, deep rolling sub bass, "
                  "bright plucky synth arpeggios, airy pads, a filtered build with snare roll and riser, euphoric wide drop, "
                  "polished modern tech-launch sound, confident and warm, no vocals"),
    "electro": (23, "Instrumental electro-pop with synthwave colour, 128 BPM, driving pulsing bassline, tight punchy drums, "
                    "shimmering arpeggiators, big bright synth stabs on the drop, cinematic and confident, "
                    "clean punchy mix, no vocals"),
    "futurebass": (37, "Instrumental future bass, 128 BPM, lush supersaw chords with sidechain pumping, crisp modern drums, "
                       "sparkling plucks and bell leads, a tense build with rising noise, huge uplifting drop, playful "
                       "and energetic launch video music, no vocals"),
}
mode, names = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)

if mode == "codes":
    from acestep.llm_inference import LLMHandler
    lm = LLMHandler()
    print(lm.initialize(checkpoint_dir=os.path.join(root, "checkpoints"), lm_model_path="acestep-5Hz-lm-1.7B", backend="mlx", device="auto"))
    for name in names:
        seed, caption = TAKES[name]
        r = lm.generate_with_stop_condition(
            caption=caption, lyrics=STRUCTURE, infer_type="llm_dit", temperature=0.85, cfg_scale=2.0,
            negative_prompt="NO USER INPUT", top_k=None, top_p=0.9, target_duration=META["duration"], user_metadata=META,
            use_cot_caption=False, use_cot_language=False, use_cot_metas=False, use_constrained_decoding=True,
            constrained_decoding_debug=False, batch_size=1, seeds=[seed], progress=None)
        if not r.get("success"):
            print(name, "LM failed:", r.get("error"), flush=True)
            continue
        open(os.path.join(out, f"ace-{name}.codes"), "w").write(r["audio_codes"])
        print(name, "codes ->", os.path.join(out, f"ace-{name}.codes"), flush=True)
elif mode == "audio":
    from acestep.handler import AceStepHandler
    from acestep.inference import GenerationConfig, GenerationParams, generate_music
    from acestep.llm_inference import LLMHandler
    dit = AceStepHandler()
    print(dit.initialize_service(project_root=root, config_path="acestep-v15-turbo", device="auto"))
    for name in names:
        seed, caption = TAKES[name]
        codes = open(os.path.join(out, f"ace-{name}.codes")).read()
        params = GenerationParams(caption=caption, lyrics=STRUCTURE, instrumental=True, vocal_language="unknown",
                                  bpm=META["bpm"], keyscale=META["keyscale"], timesignature=META["timesignature"],
                                  duration=float(META["duration"]), seed=seed, audio_codes=codes, thinking=False,
                                  use_cot_caption=False, use_cot_language=False, use_cot_metas=False)
        r = generate_music(dit, LLMHandler(), params,
                           GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format="wav"),
                           save_dir=os.path.join(out, "tmp"))
        if not r.success:
            print(name, "DiT failed:", r.error, flush=True)
            continue
        shutil.move(r.audios[0]["path"], os.path.join(out, f"ace-{name}.wav"))
        print(name, "->", os.path.join(out, f"ace-{name}.wav"), flush=True)
    shutil.rmtree(os.path.join(out, "tmp"), ignore_errors=True)
