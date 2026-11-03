"""Bande son : voix devant, musique dessous (-14 dB), bruit de page à chaque changement de scène.
Usage : python3 mix.py voix.wav musique.mp3 duree "4.2,9.1,14.3" sortie.wav"""
import subprocess, sys, os
voix, musique, duree, cuts, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), [float(c) for c in sys.argv[4].split(',') if c], sys.argv[5]
tr = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'musique', 'transition.wav')
ins = ' '.join([f'-i {tr}'] * len(cuts))
parts = [f"[{i+2}:a]adelay={int(max(0,c-.05)*1000)}|{int(max(0,c-.05)*1000)}[w{i}]" for i, c in enumerate(cuts)]
mixw = (';'.join(parts) + ';' + ''.join(f'[w{i}]' for i in range(len(cuts))) + f"amix=inputs={len(cuts)}:normalize=0[wh];") if cuts else ''
fc = mixw + f"[1:a]aloop=loop=-1:size=2e9,volume=0.2,afade=t=in:d=0.2,afade=t=out:st={duree-1.5}:d=1.5[mu];[0:a]apad[vo];[vo][mu]{'[wh]' if cuts else ''}amix=inputs={3 if cuts else 2}:normalize=0:duration=longest,alimiter=limit=0.95[out]"
subprocess.run(f'ffmpeg -y -v error -i {voix} -i {musique} {ins} -filter_complex "{fc}" -map "[out]" -t {duree} -ar 44100 -ac 2 {out}', shell=True, check=True)
