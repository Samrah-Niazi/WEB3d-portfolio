"""Composes the original soundtrack for the dark promo: a 48 second dark cinematic track at 120 BPM in A minor.
It is generated from code (pads, sub bass, kick, hats, a plucked arpeggio, risers and impacts), so it is original,
royalty-free and needs no license. Usage: python make_music.py out.wav
Scene cuts of the video (seconds): 4 portrait, 12 particles, 18 globe, 26 numbers, 32 work, 38 trophies, 42 contact, 48 end."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
DUR = 49.0
BPM = 120
BEAT = 60.0 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

L = np.zeros(N)
R = np.zeros(N)
REV = np.zeros(N)  # reverb send


def add(sig, start, gain=1.0, pan=0.0, rev=0.0):
    i = int(start * SR)
    if i >= N:
        return
    seg = sig[: N - i]
    l = gain * (1 - max(pan, 0)) * seg
    r = gain * (1 + min(pan, 0)) * seg
    L[i:i + len(seg)] += l
    R[i:i + len(seg)] += r
    REV[i:i + len(seg)] += rev * gain * seg


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f, SR / 2 - 100) / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def env(n, a, d, s, r_, total=None):
    """Simple ADSR with times in seconds."""
    total = total or n / SR
    e = np.ones(n)
    ai, di, ri = int(a * SR), int(d * SR), int(r_ * SR)
    ai = max(ai, 1)
    e[:ai] = np.linspace(0, 1, ai)
    if di:
        e[ai:ai + di] = np.linspace(1, s, di)
        e[ai + di:] = s
    if ri and ri < n:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * (1 + detune) * t) % 1.0) - 1


# ---------------------------------------------------------------- chords: Am, F, C, G, two bars each (4 s)
CHORDS = [[45, 57, 60, 64, 69], [41, 53, 57, 60, 65], [48, 60, 64, 67, 72], [43, 55, 59, 62, 67]]
ROOTS = [33, 29, 36, 31]  # sub bass notes (A1, F1, C2, G1)


def pad(chord, dur):
    n = int(dur * SR)
    out = np.zeros(n)
    for m in chord:
        for d in (-0.006, 0.0, 0.006):
            out += saw(midi(m), n, d) * 0.12
        out += np.sin(2 * np.pi * midi(m) * np.arange(n) / SR) * 0.1
    out = lp(out, 1500)
    return out * env(n, 1.6, 0.5, 0.85, 1.6)


# the pad plays from the start, a bar louder as the video opens up
t = 0.0
k = 0
while t < DUR - 1:
    seg = min(4.0, DUR - t)
    g = 0.55 if t < 4 else 0.7
    add(pad(CHORDS[k % 4], seg + 1.2), t, g, 0.0, 0.55)
    t += 4.0
    k += 1

# sub bass: one long note per bar from the first drop
t = 4.0
k = 0
while t < 46:
    n = int(2.0 * SR)
    note = np.sin(2 * np.pi * midi(ROOTS[(k // 1) % 4 if False else (int((t - 4) // 4) % 4)]) * np.arange(n) / SR)
    note = note * env(n, 0.02, 0.4, 0.8, 0.3)
    add(note, t, 0.55, 0.0, 0.0)
    t += 2.0
    k += 1


# ---------------------------------------------------------------- drums
def kick():
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7.5) + lp(rng.standard_normal(n) * np.exp(-tt * 60), 3000) * 0.15


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    x = hp(rng.standard_normal(n), 7000)
    return x * np.exp(-np.arange(n) / SR * (14 if open_ else 55))


def snare():
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 22)
    noise = hp(rng.standard_normal(n), 1800) * np.exp(-tt * 18)
    return body * 0.4 + noise * 0.5


K = kick()
H = hat()
HO = hat(True)
SN = snare()
for beat in np.arange(4.0, 46.0, BEAT):
    b = int(round((beat - 4.0) / BEAT))
    if 36 <= beat < 38:  # a breakdown into the trophy scene: only a quiet kick
        add(K, beat, 0.35, 0.0)
        continue
    add(K, beat, 0.9 if beat < 42 else 0.8, 0.0)
    if beat >= 12 and b % 2 == 1:
        add(SN, beat, 0.4, 0.0, 0.5)
    if beat >= 12:
        add(H, beat + BEAT / 2, 0.22, 0.25 if b % 2 else -0.25)
    if beat >= 18 and b % 4 == 3:
        add(HO, beat + BEAT / 2, 0.16, 0.0, 0.3)
    if beat >= 26:
        add(H, beat + BEAT / 4, 0.1, -0.3)
        add(H, beat + 3 * BEAT / 4, 0.1, 0.3)

# ---------------------------------------------------------------- plucked arpeggio from 12 s (A minor pentatonic, 16ths)
ARP = [57, 60, 64, 67, 69, 67, 64, 60, 57, 60, 64, 72, 69, 67, 64, 60]
ARP_G = [[57, 60, 64, 67], [53, 57, 60, 65], [60, 64, 67, 72], [55, 59, 62, 67]]


def pluck(m):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    x = saw(midi(m), n) * 0.5 + np.sin(2 * np.pi * midi(m) * tt) * 0.5
    cutoff = 400 + 3800 * np.exp(-tt * 9)
    y = np.zeros(n)
    # time-varying low-pass by blending a few fixed filters
    y = lp(x, 900) * np.exp(-tt * 5) * 0.6 + lp(x, 3500) * np.exp(-tt * 14) * 0.6
    return y


for step in range(int((46 - 12) / (BEAT / 2))):
    tm = 12 + step * (BEAT / 2)
    chord = ARP_G[int((tm - 4) // 4) % 4]
    note = chord[step % 4] + (12 if (step // 4) % 2 else 0)
    g = 0.2 if tm < 26 else 0.28
    if 36 <= tm < 38:
        g *= 0.6
    add(pluck(note), tm, g, np.sin(step * 0.9) * 0.5, 0.45)

# ---------------------------------------------------------------- risers and impacts at the scene cuts
def riser(dur):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 40
    for i in range(blocks):
        a, b = i * n // blocks, (i + 1) * n // blocks
        f = 300 * (1 + 22 * (i / blocks) ** 2)
        out[a:b] = hp(lp(x[a:b], min(f * 3, 18000)), f * 0.6)[: b - a]
    out *= np.linspace(0, 1, n) ** 3
    return out * 0.45


def impact():
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (48 + 90 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 1.4)
    crash = hp(rng.standard_normal(n), 3000) * np.exp(-tt * 3.5) * 0.25
    return boom * 0.9 + crash


for cut, dur in ((4, 3.6), (12, 3.2), (18, 3.6), (26, 3.6), (32, 3.2), (42, 3.6)):
    add(riser(dur), cut - dur, 0.32, 0.0, 0.4)
for cut in (4, 12, 18, 26, 32, 42):
    add(impact(), cut, 0.8 if cut in (4, 26, 42) else 0.55, 0.0, 0.35)

# a soft tick over the loading scene
for tick in np.arange(0.6, 3.8, 0.4):
    n = int(0.03 * SR)
    x = np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 140)
    add(x, tick, 0.12, 0.0)

# ---------------------------------------------------------------- reverb (a decaying-noise impulse response)
ir_n = int(2.8 * SR)
ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.0)
ir = lp(ir, 6000)
ir /= np.sqrt(np.sum(ir ** 2))
wet_l = signal.fftconvolve(REV, ir)[:N]
wet_r = signal.fftconvolve(REV, np.roll(ir, 211))[:N]
L += wet_l * 0.55
R += wet_r * 0.55

# ---------------------------------------------------------------- master: gentle glue, fade in and out, normalise
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.15) / 1.15
fade_in = np.clip(t_all / 0.8, 0, 1)
fade_out = np.clip((DUR - t_all) / 3.0, 0, 1)
mix *= (fade_in * fade_out)[:, None]
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print("wrote", sys.argv[1], round(DUR, 1), "s")
