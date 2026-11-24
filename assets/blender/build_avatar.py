"""
Builds Samrah's portfolio avatar in Blender, rigs it, animates it, and exports a GLB.

Run (from the project root):
  blender --background --factory-startup --python assets/blender/build_avatar.py -- assets/blender [preview_dir]

Outputs: avatar.blend (source), avatar.glb (web model), textures/knit.png, optional preview PNGs.
Design reference: assets/reference/profile-reference-2.jpg (face, hair, colors)
  - black loose hijab with a little fringe showing, oval glasses, soft round face, cute lips
  - flowy terracotta knit maxi dress with long sleeves, brown belt, cute pink heels
Units are meters. The character faces -Y (becomes +Z in glTF) and is ~1.95 m tall.
Every mesh is skinned rigidly to one bone, so the model stays light and animates cleanly in three.js.

Rig (24 bones): root > hips > spine > chest > neck > head (+ eye.L/R, brow.L/R);
chest > shoulder.L/R > upperarm > forearm > hand; hips > skirt; root > desk (flat desk, chair and Dell laptop).
Animations: Idle (loop: she sits behind a Dell laptop, peeks over the lid and waves hi), Hi (the same hello, once),
then the standing clips Wave, Nod, Cheer, Twirl, Think, Play (she pulls out a handheld console and plays).
The desk is only visible in Idle and Hi; every other clip hides it (the "desk" bone is scaled away).
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT_DIR = os.path.abspath(argv[0] if argv else ".")
PREVIEW_DIR = os.path.abspath(argv[1]) if len(argv) > 1 else None
TEX_DIR = os.path.join(OUT_DIR, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24


# ---------------------------------------------------------------- materials
def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_of(hex_color):
    h = hex_color.lstrip("#")
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def make_mat(name, hex_color, rough=0.6, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    rgb = rgb_of(hex_color)
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*rgb, 1)  # Workbench preview color
    return m


def make_knit_texture(hex_color):
    """Procedural rib-knit pattern saved as a real PNG, so it exports with the GLB."""
    size = 256
    yy, xx = np.mgrid[0:size, 0:size] / size
    ribs = 0.5 + 0.5 * np.sin(2 * np.pi * xx * 10)
    stitch = 0.5 + 0.5 * np.sin(2 * np.pi * (yy * 16 + 0.6 * np.sin(2 * np.pi * xx * 10)))
    shade = 0.74 + 0.16 * ribs + 0.10 * stitch
    base = np.array(rgb_of(hex_color))
    px = np.ones((size, size, 4), dtype=np.float32)
    px[..., :3] = base[None, None, :] * shade[..., None]
    img = bpy.data.images.new("KnitTexture", size, size)
    img.pixels = px.flatten().tolist()
    img.filepath_raw = os.path.join(TEX_DIR, "knit.png")
    img.file_format = "PNG"
    img.save()
    img.pack()  # keep the texture inside avatar.blend so the file is self-contained
    return img


def make_textured_mat(name, image, preview_hex, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*rgb_of(preview_hex), 1)
    return m


SKIN = make_mat("Skin", "#f6d1b9", 0.5)
HAIR = make_mat("Hair", "#33201a", 0.45)
HIJAB = make_mat("Hijab", "#141417", 0.8)
BROW = make_mat("Brow", "#4a2c1f", 0.75)
LASH = make_mat("EyeLiner", "#1d1310", 0.4)
SCLERA = make_mat("EyeWhite", "#f6f3f0", 0.3)
IRIS = make_mat("Iris", "#5b3422", 0.25)
PUPIL = make_mat("Pupil", "#0f0807", 0.2)
SPARK = make_mat("EyeSparkle", "#ffffff", 0.1)
LIP_LINE = make_mat("LipLine", "#8f2f3d", 0.5)
LIP_FULL = make_mat("Lips", "#cc4f61", 0.3)
LIP_GLOSS = make_mat("LipGloss", "#ffe7ea", 0.1)
FRAME = make_mat("GlassesFrame", "#4a2420", 0.35)
GOLD = make_mat("Gold", "#d9a93a", 0.3, 0.9)
KNIT_IMG = make_knit_texture("#c2552f")
DRESS = make_textured_mat("Dress", KNIT_IMG, "#c2552f")
RIB = make_mat("DressTrim", "#8f3a22", 0.9)
BELT = make_mat("Belt", "#5b3a24", 0.5)
HEEL = make_mat("Heels", "#ff9bb8", 0.35)
HEEL_DARK = make_mat("HeelTips", "#e0587f", 0.4)
CON_BODY = make_mat("ConsoleBody", "#eceff8", 0.3)
CON_DARK = make_mat("ConsoleDark", "#23263a", 0.4)
CON_TEAL = make_mat("ConsoleTeal", "#2ed3c6", 0.3)
CON_PINK = make_mat("ConsolePink", "#ff4f8b", 0.3)
CON_SCREEN = make_mat("ConsoleScreen", "#8fe3ff", 0.15)
DESK_WOOD = make_mat("DeskWood", "#c99a6b", 0.55)
DESK_TOP = make_mat("DeskTopWood", "#e3c196", 0.45)
DESK_DRAWER = make_mat("DeskDrawer", "#b6865c", 0.55)
DESK_MUG = make_mat("DeskMug", "#2ed3c6", 0.3)
DESK_POT = make_mat("DeskPot", "#d96c4f", 0.6)
DESK_LEAF = make_mat("DeskLeaf", "#3fa85a", 0.6)
DESK_LID = make_mat("DeskLaptopSilver", "#c9ccd3", 0.35, 0.65)
DESK_BASE = make_mat("DeskLaptopBase", "#8d929d", 0.4, 0.6)
DESK_DARK = make_mat("DeskLaptopDark", "#2b2e36", 0.4)
DESK_SCREEN = make_mat("DeskLaptopScreen", "#10213a", 0.2)
DESK_CHAIR = make_mat("DeskChair", "#4b4f63", 0.6)


# ---------------------------------------------------------------- geometry helpers
def catmull(pts, n):
    """Catmull-Rom resample of a list of equal-length tuples (positions plus radii)."""
    if len(pts) < 3:
        return list(pts)
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
                for j in range(len(p1))))
    out.append(tuple(pts[-1]))
    return out


def frame(t):
    """Cross-section axes for a tube heading along t: n1 is the world-X-ish width axis."""
    n1 = Vector((1, 0, 0)) - t * t.x
    if n1.length < 1e-3:
        n1 = Vector((0, 1, 0)) - t * t.y
    n1.normalize()
    return n1, t.cross(n1)


def link(o):
    scene.collection.objects.link(o)
    return o


parts = {}  # object -> bone that drives it


def add(o, bone):
    parts[o] = bone
    return o


def tube(name, pts, secs, mat, seg=18, sub=5, uv=(1, 1), open_start=False, ripple=None):
    """Smooth closed tube along pts. secs gives (width, depth) radii at each point."""
    raw = [(p[0], p[1], p[2], s[0], s[1]) for p, s in zip(pts, secs)]
    d = catmull(raw, sub)
    centers = [Vector(q[:3]) for q in d]
    radii = [(q[3], q[4]) for q in d]
    n = len(d)
    tans = []
    for i in range(n):
        t = centers[min(i + 1, n - 1)] - centers[max(i - 1, 0)]
        tans.append(t.normalized() if t.length > 1e-9 else Vector((0, 0, 1)))

    rings = []  # (center, n1, n2, rx, ry)

    def ring(c, t, rx, ry):
        n1, n2 = frame(t)
        rings.append((c, n1, n2, rx, ry))

    r0 = (radii[0][0] + radii[0][1]) / 2
    r1 = (radii[-1][0] + radii[-1][1]) / 2
    apex0 = centers[0] - tans[0] * r0
    apex1 = centers[-1] + tans[-1] * r1
    if not open_start:
        ring(centers[0] - tans[0] * r0 * 0.87, tans[0], radii[0][0] * 0.5, radii[0][1] * 0.5)
        ring(centers[0] - tans[0] * r0 * 0.5, tans[0], radii[0][0] * 0.87, radii[0][1] * 0.87)
    for c, t, (rx, ry) in zip(centers, tans, radii):
        ring(c, t, rx, ry)
    ring(centers[-1] + tans[-1] * r1 * 0.5, tans[-1], radii[-1][0] * 0.87, radii[-1][1] * 0.87)
    ring(centers[-1] + tans[-1] * r1 * 0.87, tans[-1], radii[-1][0] * 0.5, radii[-1][1] * 0.5)

    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    grid = []
    for ri, (c, n1, n2, rx, ry) in enumerate(rings):
        # ripple = (folds, strength): soft vertical folds that deepen toward the first ring (the hem)
        tt = (1 - ri / max(1, len(rings) - 1)) ** 1.6 if ripple else 0.0
        grid.append([bm.verts.new(c + (n1 * rx * math.cos(2 * math.pi * a / seg) + n2 * ry * math.sin(2 * math.pi * a / seg))
                                  * (1 + (ripple[1] * tt * math.sin(ripple[0] * 2 * math.pi * a / seg) if ripple else 0.0)))
                     for a in range(seg)])
    nr = len(grid)
    for i in range(nr - 1):
        for a in range(seg):
            b = (a + 1) % seg
            f = bm.faces.new((grid[i][a], grid[i][b], grid[i + 1][b], grid[i + 1][a]))
            u0, u1 = a / seg * uv[0], (a + 1) / seg * uv[0]
            v0, v1 = i / (nr - 1) * uv[1], (i + 1) / (nr - 1) * uv[1]
            for lp, (u, v) in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
                lp[uvl].uv = (u, v)
    caps = ((bm.verts.new(apex1), grid[-1], True),) if open_start else ((bm.verts.new(apex0), grid[0], False), (bm.verts.new(apex1), grid[-1], True))
    for apex, row, flip in caps:
        for a in range(seg):
            b = (a + 1) % seg
            f = bm.faces.new((apex, row[b], row[a]) if not flip else (apex, row[a], row[b]))
            for lp in f.loops:
                lp[uvl].uv = (a / seg * uv[0], 0.0 if not flip else uv[1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me))


def finish(o, material, smooth=True):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.data.materials.append(material)
    if smooth:
        bpy.ops.object.shade_smooth()
    o.select_set(False)
    return o


def ellipsoid(name, loc, radii, material, seg=32, rings=16, rot=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = radii
    if rot is not None:
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = rot
    return finish(o, material)


def torus(name, loc, major, minor, material, rot=(0, 0, 0), ms=32, ns=8, squash_y=1.0):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=ms, minor_segments=ns,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (1.0, squash_y, 1.0)
    return finish(o, material)


def cut_and_thicken(o, remove_if, thickness, post=None):
    """Delete faces matching remove_if, optionally reshape the cut edge, then give the shell thickness."""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if remove_if(f.calc_center_median())], context="FACES")
    if post:
        post(bm)
    bm.to_mesh(o.data)
    bm.free()
    mod = o.modifiers.new("Thickness", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 1
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier="Thickness")
    bpy.ops.object.shade_smooth()


# ---------------------------------------------------------------- head
C = Vector((0, 0, 1.66))  # head center
R = (0.176, 0.162, 0.182)  # head radii

bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40, radius=1, location=C)
head = bpy.context.active_object
head.name = "Head"
head.scale = R
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for v in head.data.vertices:  # soft rounded chin
    t = max(0.0, min(1.0, (C.z - v.co.z) / R[2]))
    k = t ** 1.5
    v.co.x *= 1 - 0.17 * k
    v.co.y = C.y + (v.co.y - C.y) * (1 - 0.08 * k)
    v.co.z -= 0.010 * k
head.data.materials.append(SKIN)
bpy.context.view_layer.objects.active = head
bpy.ops.object.shade_smooth()
add(head, "head")
bpy.context.view_layer.update()


def on_face(x, z, out=0.0):
    """Point on the face surface at (x, z); out>0 lifts it away from the skin along the normal."""
    ok, loc, nrm, _ = head.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
    if not ok:
        raise RuntimeError(f"no face surface at x={x}, z={z}")
    return loc + nrm * out, nrm


def face_rot(nrm):
    return nrm.to_track_quat("-Y", "Z")


def hz(dz):
    return C.z + dz


def face_pts(pairs, out):
    return [tuple(on_face(dx, hz(dz), out)[0]) for dx, dz in pairs]


for side, sx in (("L", 1), ("R", -1)):
    ex = sx * 0.060
    eye_bone = f"eye.{side}"
    # layered eye: white, iris, pupil, sparkle
    for nm, rad, out, m in (("EyeWhite", (0.030, 0.011, 0.027), -0.004, SCLERA),
                            ("Iris", (0.0225, 0.009, 0.0225), 0.003, IRIS),
                            ("Pupil", (0.011, 0.007, 0.011), 0.006, PUPIL)):
        p, n = on_face(ex, hz(0.0), out)
        add(ellipsoid(f"{nm}.{side}", p, rad, m, 20, 10, face_rot(n)), eye_bone)
    p, n = on_face(ex + sx * 0.007, hz(0.009), 0.0085)
    add(ellipsoid(f"EyeSparkle.{side}", p, (0.0055, 0.0035, 0.0055), SPARK, 12, 6, face_rot(n)), eye_bone)

    # soft liner along the upper lid with a tiny wing
    pts = []
    for dx, dz, out in ((-0.034, 0.010, 0.004), (-0.014, 0.027, 0.005), (0.010, 0.031, 0.005),
                        (0.034, 0.022, 0.004), (0.047, 0.027, 0.003)):
        p, _ = on_face(ex + sx * dx, hz(dz), out)
        pts.append(tuple(p))
    add(tube(f"Liner.{side}", pts, [(0.0035, 0.0035)] * 2 + [(0.0042, 0.0042)] + [(0.0035, 0.0035), (0.0018, 0.0018)],
             LASH, seg=8, sub=4), "head")

    # cute eyebrows: short, soft round arcs (own bone so they can raise)
    pts = []
    for dx, dz in ((-0.024, 0.066), (0.002, 0.077), (0.030, 0.079), (0.054, 0.069)):
        p, _ = on_face(ex + sx * dx, hz(dz), 0.003)
        pts.append(tuple(p))
    add(tube(f"Brow.{side}", pts, [(0.0045, 0.0040), (0.0078, 0.0055), (0.0075, 0.0055), (0.0030, 0.0035)], BROW,
             seg=8, sub=4), f"brow.{side}")

    # oval glasses: wider than tall, not round and not square
    gp, _ = on_face(ex, hz(0.002), 0.020)
    add(torus(f"GlassesRim.{side}", tuple(gp), 0.056, 0.0052, FRAME, rot=(math.radians(90), 0, 0), ms=44, ns=8,
              squash_y=0.72), "head")
    add(tube(f"Temple.{side}", [(gp.x + sx * 0.055, gp.y, gp.z), (sx * 0.150, gp.y + 0.09, gp.z), (sx * 0.168, 0.03, gp.z + 0.004)],
             [(0.0035, 0.0035)] * 3, FRAME, seg=8, sub=4), "head")

gb, _ = on_face(0, hz(0.016), 0.020)
add(tube("GlassesBridge", [(-0.012, gb.y, gb.z), (0.0, gb.y - 0.004, gb.z + 0.004), (0.012, gb.y, gb.z)], [(0.0045, 0.0045)] * 3,
         FRAME, seg=8, sub=4), "head")
p, n = on_face(0, hz(-0.048), 0.002)
add(ellipsoid("Nose", p + Vector((0, -0.004, 0)), (0.0145, 0.011, 0.0175), SKIN, 16, 10, face_rot(n)), "head")

# cute lips: cupid's bow on top, a plump lower lip. Two mouths are built: a soft one for Idle ("mouth") and a wide happy
# smile ("smile") that every other clip swaps in by scaling the bones, so she only smiles while she is doing something.
# Thickness along each tube shapes the lips.
MOUTHS = {
    "mouth": dict(
        up=[(-0.025, -0.0950), (-0.0125, -0.0905), (0.0, -0.0918), (0.0125, -0.0905), (0.025, -0.0950)],
        dn=[(-0.023, -0.0975), (-0.0115, -0.1040), (0.0, -0.1058), (0.0115, -0.1040), (0.023, -0.0975)],
        ln=[(-0.026, -0.0958), (-0.013, -0.0985), (0.0, -0.0990), (0.013, -0.0985), (0.026, -0.0958)],
        gloss=-0.1048),
    "smile": dict(
        up=[(-0.040, -0.0890), (-0.020, -0.0950), (0.0, -0.0975), (0.020, -0.0950), (0.040, -0.0890)],
        dn=[(-0.037, -0.0905), (-0.019, -0.1030), (0.0, -0.1075), (0.019, -0.1030), (0.037, -0.0905)],
        ln=[(-0.040, -0.0890), (-0.020, -0.0985), (0.0, -0.1015), (0.020, -0.0985), (0.040, -0.0890)],
        gloss=-0.1090),
}
for bn, m in MOUTHS.items():
    # horizontal tubes use (depth, height) as their section radii
    add(tube(f"LipUpper.{bn}", face_pts(m["up"], 0.0030), [(0.0040, 0.0028), (0.0046, 0.0052), (0.0044, 0.0040), (0.0046, 0.0052), (0.0040, 0.0028)],
             LIP_FULL, seg=10, sub=5), bn)
    add(tube(f"LipLower.{bn}", face_pts(m["dn"], 0.0034), [(0.0046, 0.0030), (0.0054, 0.0062), (0.0058, 0.0070), (0.0054, 0.0062), (0.0046, 0.0030)],
             LIP_FULL, seg=10, sub=5), bn)
    add(tube(f"LipLine.{bn}", face_pts(m["ln"], 0.0014), [(0.0030, 0.0020)] * 5, LIP_LINE, seg=8, sub=4), bn)
    gloss, gn = on_face(0.004, hz(m["gloss"]), 0.0075)
    add(ellipsoid(f"LipGloss.{bn}", gloss, (0.0060, 0.0022, 0.0020), LIP_GLOSS, 12, 6, face_rot(gn)), bn)

# ---------------------------------------------------------------- hair (only a little shows under the loose hijab)
cap = ellipsoid("HairCap", (0, 0.012, C.z + 0.012), (0.182, 0.176, 0.203), HAIR, seg=64, rings=40)
bm = bmesh.new()
bm.from_mesh(cap.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces
                           if f.calc_center_median().z < C.z - 0.03
                           or (f.calc_center_median().y < -0.03 and f.calc_center_median().z < C.z + 0.14)],
                 context="FACES")
bm.to_mesh(cap.data)
bm.free()
mod = cap.modifiers.new("Thickness", "SOLIDIFY")
mod.thickness = 0.01
bpy.context.view_layer.objects.active = cap
bpy.ops.object.modifier_apply(modifier="Thickness")
bpy.ops.object.shade_smooth()
add(cap, "head")

for sx in (1, -1):  # wispy fringe resting on the forehead
    for k in range(4):
        fp = []
        for dx, dz in ((0.010 + 0.008 * k, 0.150), (0.030 + 0.011 * k, 0.126 - 0.002 * k),
                       (0.058 + 0.013 * k, 0.110 - 0.005 * k), (0.090 + 0.013 * k, 0.094 - 0.010 * k)):
            p, _ = on_face(sx * dx, hz(dz), 0.008)
            fp.append(tuple(p))
        add(tube(f"Fringe{sx}{k}", fp, [(r, r) for r in (0.011, 0.0125, 0.011, 0.005)], HAIR, seg=12, sub=5), "head")

# ---------------------------------------------------------------- loose black hijab
OPEN_A, OPEN_B, OPEN_CZ = 0.176, 0.195, C.z - 0.03  # face opening; its top edge sits just above the hairline


def smooth_opening(bm_):
    for v in bm_.verts:
        if v.is_boundary:
            nx, nz = v.co.x / OPEN_A, (v.co.z - OPEN_CZ) / OPEN_B
            r = math.hypot(nx, nz)
            if r > 0:
                v.co.x, v.co.z = nx / r * OPEN_A, OPEN_CZ + nz / r * OPEN_B


hijab = ellipsoid("HijabHead", (0, 0.012, C.z + 0.002), (0.208, 0.203, 0.226), HIJAB, seg=80, rings=48)
cut_and_thicken(hijab, lambda c: c.y < -0.03 and ((c.x / OPEN_A) ** 2 + ((c.z - OPEN_CZ) / OPEN_B) ** 2) < 1, 0.012,
                post=smooth_opening)
add(hijab, "head")

# ---------------------------------------------------------------- body (full maxi dress)
add(tube("Neck", [(0, 0, 1.36), (0, 0, 1.60)], [(0.050, 0.048)] * 2, SKIN, seg=20), "neck")

# bodice, fitted to the waist; a very flowy A-line maxi with soft folds, all red
add(tube("Bodice", [(0, 0, 1.06), (0, 0, 1.18), (0, 0, 1.30), (0, 0, 1.38), (0, 0, 1.43)],
         [(0.152, 0.098), (0.148, 0.096), (0.156, 0.100), (0.158, 0.094), (0.085, 0.070)],
         DRESS, seg=36, sub=6, uv=(3, 2)), "chest")
add(torus("Collar", (0, 0, 1.425), 0.072, 0.016, RIB, ms=32, ns=10), "chest")
add(tube("Skirt", [(0, 0, 0.21), (0, 0, 0.34), (0, 0, 0.52), (0, 0, 0.72), (0, 0, 0.92), (0, 0, 1.10)],
         [(0.480, 0.420), (0.400, 0.345), (0.305, 0.255), (0.230, 0.185), (0.180, 0.140), (0.142, 0.100)],
         DRESS, seg=72, sub=6, uv=(5, 3), open_start=True, ripple=(9, 0.07)), "skirt")
add(torus("Belt", (0, 0, 1.075), 0.146, 0.012, BELT, ms=48, ns=8, squash_y=0.68), "chest")
add(ellipsoid("Buckle", (0, -0.100, 1.075), (0.017, 0.006, 0.015), GOLD, 16, 8), "chest")
for side, sx in (("L", 1), ("R", -1)):  # cute pink heels with ankle straps, visible below the hem
    x = sx * 0.092
    add(tube(f"Ankle.{side}", [(x, 0.050, 0.095), (x, 0.045, 0.175)], [(0.030, 0.030), (0.026, 0.026)], SKIN, seg=14), "feet")
    add(tube(f"Heel.{side}", [(x, 0.072, 0.095), (x, 0.0, 0.082), (x, -0.095, 0.060), (x, -0.205, 0.030)],
             [(0.040, 0.030), (0.046, 0.034), (0.044, 0.030), (0.030, 0.020)], HEEL, seg=16), "feet")
    add(tube(f"HeelPost.{side}", [(x, 0.072, 0.0), (x, 0.072, 0.085)], [(0.013, 0.013), (0.021, 0.021)], HEEL_DARK, seg=10), "feet")
    add(torus(f"AnkleStrap.{side}", (x, 0.048, 0.125), 0.032, 0.0055, HEEL_DARK, ms=20, ns=6), "feet")

# arms: long knit sleeves, ribbed cuffs, skin hands (slight A-pose)
for side, sx in (("L", 1), ("R", -1)):
    S = (sx * 0.170, 0, 1.37)
    E = (sx * 0.208, 0, 1.12)
    W = (sx * 0.232, 0, 0.885)
    add(tube(f"UpperSleeve.{side}", [S, ((S[0] + E[0]) / 2, 0, (S[2] + E[2]) / 2), E],
             [(0.064, 0.062), (0.054, 0.052), (0.050, 0.049)], DRESS, seg=20, uv=(3, 1)), f"upperarm.{side}")
    add(tube(f"LowerSleeve.{side}", [E, ((E[0] + W[0]) / 2, 0, (E[2] + W[2]) / 2), W],
             [(0.050, 0.049), (0.048, 0.047), (0.046, 0.045)], DRESS, seg=20, uv=(3, 1)), f"forearm.{side}")
    add(torus(f"Cuff.{side}", (W[0], 0, W[2] - 0.004), 0.047, 0.0125, RIB, ms=24, ns=8), f"forearm.{side}")
    add(tube(f"Hand.{side}", [(W[0] + sx * 0.002, 0, 0.885), (W[0] + sx * 0.008, 0, 0.835), (W[0] + sx * 0.012, 0, 0.780)],
             [(0.032, 0.017), (0.036, 0.018), (0.024, 0.014)], SKIN, seg=16), f"hand.{side}")
    add(tube(f"Thumb.{side}", [(W[0] - sx * 0.028, -0.012, 0.862), (W[0] - sx * 0.030, -0.024, 0.830)],
             [(0.012, 0.011), (0.009, 0.009)], SKIN, seg=10), f"hand.{side}")


# ---------------------------------------------------------------- handheld console (only visible in the Play clip)
CON_C = (0.0, -0.39, 1.30)  # held in front of her chest, between her hands


def rbox(name, loc, size, material, bevel=0.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    mod = o.modifiers.new("bev", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier="bev")
    return finish(o, material)


def cpos(x, y, z):
    return (CON_C[0] + x, CON_C[1] + y, CON_C[2] + z)


# held flat in landscape, screen up, resting on her hands: the body between two coloured grips
add(rbox("ConsoleBody", cpos(0, 0, 0), (0.30, 0.17, 0.034), CON_BODY, 0.012), "console")
add(rbox("ConsoleScreen", cpos(0, 0, 0.019), (0.25, 0.135, 0.004), CON_SCREEN, 0.004), "console")
add(rbox("ConsoleGripL", cpos(-0.17, 0, 0), (0.075, 0.17, 0.042), CON_TEAL, 0.02), "console")
add(rbox("ConsoleGripR", cpos(0.17, 0, 0), (0.075, 0.17, 0.042), CON_PINK, 0.02), "console")
add(rbox("BumperL", cpos(-0.17, -0.085, 0.012), (0.07, 0.02, 0.02), CON_DARK, 0.006), "console")
add(rbox("BumperR", cpos(0.17, -0.085, 0.012), (0.07, 0.02, 0.02), CON_DARK, 0.006), "console")
add(rbox("LedStrip", cpos(0, -0.0875, 0.0), (0.16, 0.004, 0.01), CON_SCREEN, 0.003), "console")
add(tube("EmblemRing", [cpos(0, 0, -0.017), cpos(0, 0, -0.025)], [(0.04, 0.04), (0.04, 0.04)], CON_DARK, seg=24), "console")
add(tube("EmblemDot", [cpos(0, 0, -0.025), cpos(0, 0, -0.03)], [(0.026, 0.026), (0.026, 0.026)], CON_SCREEN, seg=24), "console")
for nm, (bx, by) in {"StickL": (-0.17, -0.02), "StickR": (0.17, 0.035)}.items():
    add(tube(nm, [cpos(bx, by, 0.02), cpos(bx, by, 0.037)], [(0.016, 0.016), (0.018, 0.018)], CON_DARK, seg=12), "console")
for i, (bx, by) in enumerate([(0.17, -0.04), (0.145, -0.01), (0.195, -0.01), (0.17, 0.02)]):
    add(tube(f"Btn{i}", [cpos(bx, by, 0.02), cpos(bx, by, 0.03)], [(0.009, 0.009), (0.009, 0.009)], CON_DARK, seg=8), "console")


# ---------------------------------------------------------------- desk, chair and Dell laptop (only visible while she sits)
# She sits at the origin facing -Y. A low desk stands in front of her and a laptop on it, open, with its lid leaning
# back toward her: from the front you see the back of the lid (with the DELL name), and only her head and one waving
# hand rise above it. The desk is a solid block so it hides the dress that drops below the tabletop.
LID_TILT = math.radians(12)
LID_H = 0.26
TABLE_Z = 0.64  # height of the tabletop surface


def rbox_rot(name, loc, size, material, rot=(0, 0, 0), bevel=0.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    mod = o.modifiers.new("bev", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier="bev")
    return finish(o, material)


def label_text(text, loc, rot, size, material):
    curve = bpy.data.curves.new("LabelText", "FONT")
    curve.body = text
    curve.size = size
    curve.extrude = 0.0025
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    o = bpy.data.objects.new("LabelText", curve)
    link(o)
    o.location = loc
    o.rotation_euler = rot
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return finish(bpy.context.active_object, material)


# desk: one flat, thin tabletop on four slim legs, so her dress, heels and chair stay visible underneath
DW, DD = 1.3, 0.55  # desk width and depth
TOP_Y = -0.555  # middle of the tabletop, in front of her
add(rbox_rot("DeskTop", (0, TOP_Y, TABLE_Z - 0.0175), (DW, DD, 0.035), DESK_TOP, bevel=0.01), "desk")
for sx in (1, -1):
    for sy in (-1, 1):
        add(tube(f"DeskLeg{sx}{sy}", [(sx * (DW / 2 - 0.045), TOP_Y + sy * (DD / 2 - 0.045), 0.0),
                                       (sx * (DW / 2 - 0.045), TOP_Y + sy * (DD / 2 - 0.045), TABLE_Z - 0.035)],
                 [(0.024, 0.024), (0.02, 0.02)], DESK_DARK, seg=12), "desk")

# a mug and a little plant on the desk, either side of the laptop
add(tube("Mug", [(0.50, -0.52, TABLE_Z + 0.001), (0.50, -0.52, TABLE_Z + 0.078)], [(0.038, 0.038), (0.040, 0.040)], DESK_MUG, seg=20), "desk")
add(torus("MugHandle", (0.545, -0.52, TABLE_Z + 0.042), 0.026, 0.0065, DESK_MUG, rot=(math.radians(90), 0, 0), ms=16, ns=6), "desk")
add(tube("PlantPot", [(-0.50, -0.52, TABLE_Z + 0.001), (-0.50, -0.52, TABLE_Z + 0.058)], [(0.032, 0.032), (0.045, 0.045)], DESK_POT, seg=20), "desk")
for lx, ly, lz, r in ((-0.50, -0.52, 0.117, (0.04, 0.04, 0.06)), (-0.53, -0.52, 0.087, (0.03, 0.03, 0.05)), (-0.47, -0.52, 0.087, (0.03, 0.03, 0.05))):
    add(ellipsoid("Leaf", (lx, ly, TABLE_Z + lz), r, DESK_LEAF, 12, 8), "desk")

# chair: seat, backrest, post and a wheel ring (you only see it when you spin her around)
add(rbox_rot("ChairSeat", (0, 0.10, 0.40), (0.46, 0.36, 0.06), DESK_CHAIR, bevel=0.02), "desk")  # tucked in behind the dress
add(rbox_rot("ChairBack", (0, 0.30, 0.80), (0.46, 0.06, 0.62), DESK_CHAIR, rot=(math.radians(-8), 0, 0), bevel=0.02), "desk")
add(tube("ChairPost", [(0, 0.02, 0.06), (0, 0.02, 0.37)], [(0.03, 0.03), (0.03, 0.03)], DESK_DARK, seg=12), "desk")
add(torus("ChairWheels", (0, 0.02, 0.05), 0.26, 0.02, DESK_DARK, ms=24, ns=6), "desk")

# laptop: base on the desk, lid hinged at the far edge and leaning back toward her
HINGE = (0, -0.72, TABLE_Z + 0.024)
c_t, s_t = math.cos(LID_TILT), math.sin(LID_TILT)
lid_c = (HINGE[0], HINGE[1] + s_t * LID_H / 2, HINGE[2] + c_t * LID_H / 2)
add(rbox_rot("LaptopBase", (0, -0.55, TABLE_Z + 0.012), (0.58, 0.34, 0.024), DESK_BASE, bevel=0.008), "desk")
add(rbox_rot("LaptopLid", lid_c, (0.58, 0.018, LID_H), DESK_LID, rot=(-LID_TILT, 0, 0), bevel=0.008), "desk")
screen_c = (lid_c[0], lid_c[1] + c_t * 0.0095, lid_c[2] - s_t * 0.0095)  # on the side that faces her
add(rbox_rot("LaptopScreen", screen_c, (0.53, 0.004, LID_H - 0.04), DESK_SCREEN, rot=(-LID_TILT, 0, 0), bevel=0.003), "desk")
back_c = (lid_c[0], lid_c[1] - c_t * 0.0098, lid_c[2] + s_t * 0.0098)  # on the outer side, toward the viewer
add(label_text("DELL", back_c, (math.radians(90) - LID_TILT, 0, 0), 0.07, DESK_DARK), "desk")

# stylize: scale the head and everything on it about the neck so the face reads at hero size
HEAD_SCALE = 1.22
PIVOT = Vector((0, 0, 1.52))


def head_pt(p):
    return PIVOT + (Vector(p) - PIVOT) * HEAD_SCALE


for o, b in parts.items():
    if b in ("head", "mouth", "smile") or b.startswith("eye.") or b.startswith("brow."):
        for v in o.data.vertices:
            v.co = head_pt(v.co)

# ---------------------------------------------------------------- rig
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm = bpy.context.active_object
arm.name = "Armature"
arm.data.name = "AvatarRig"
eb = arm.data.edit_bones
eb.remove(eb["Bone"])


def bone(name, head_pos, tail_pos, parent=None):
    b = eb.new(name)
    b.head, b.tail = head_pos, tail_pos
    if parent:
        b.parent = eb[parent]


bone("root", (0, 0, 0), (0, 0, 0.1))
bone("hips", (0, 0, 0.92), (0, 0, 1.0), "root")
bone("spine", (0, 0, 1.0), (0, 0, 1.2), "hips")
bone("chest", (0, 0, 1.2), (0, 0, 1.42), "spine")
bone("neck", (0, 0, 1.42), (0, 0, 1.54), "chest")
bone("head", (0, 0, 1.54), tuple(head_pt((0, 0, 1.88))), "neck")
bone("skirt", (0, 0, 1.08), (0, 0, 0.5), "hips")  # sways with the body
bone("feet", (0, 0, 0.0), (0, 0, 0.1), "hips")  # heels and ankles: they follow the hips, except while she sits (they stay on the floor)
for mb in ("mouth", "smile"):  # scaled about the middle of each mouth so it swaps in place
    pts = [v.co for o, b in parts.items() if b == mb for v in o.data.vertices]
    mid = sum(pts, Vector()) / len(pts)
    bone(mb, tuple(mid), (mid.x, mid.y, mid.z + 0.02), "head")
bone("console", CON_C, (CON_C[0], CON_C[1], CON_C[2] + 0.1), "chest")  # the handheld, scaled away except in Play
bone("desk", (0, 0, 0), (0, 0, 0.1), "root")  # desk, chair and laptop, scaled away except in Idle and Hi
for side, sx in (("L", 1), ("R", -1)):
    # eye and brow bones stand upright: scaling local Y blinks, moving local Y raises
    bone(f"eye.{side}", tuple(head_pt((sx * 0.060, -0.14, C.z))), tuple(head_pt((sx * 0.060, -0.14, C.z + 0.04))), "head")
    bone(f"brow.{side}", tuple(head_pt((sx * 0.060, -0.14, C.z + 0.075))), tuple(head_pt((sx * 0.060, -0.14, C.z + 0.115))), "head")
    bone(f"shoulder.{side}", (sx * 0.06, 0, 1.40), (sx * 0.17, 0, 1.37), "chest")
    bone(f"upperarm.{side}", (sx * 0.170, 0, 1.37), (sx * 0.208, 0, 1.12), f"shoulder.{side}")
    bone(f"forearm.{side}", (sx * 0.208, 0, 1.12), (sx * 0.232, 0, 0.885), f"upperarm.{side}")
    bone(f"hand.{side}", (sx * 0.232, 0, 0.885), (sx * 0.244, 0, 0.78), f"forearm.{side}")
bpy.ops.object.mode_set(mode="OBJECT")

# Weight every part fully to its bone, then join the parts that share a material. Fewer meshes means far
# fewer draw calls in the browser, which matters a lot on laptops with integrated graphics.
by_material = {}
for o, bone_name in parts.items():
    vg = o.vertex_groups.new(name=bone_name)
    vg.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    by_material.setdefault(o.data.materials[0].name, []).append(o)
merged = []
for mat_name, objs in by_material.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = f"Mesh_{mat_name}"
    mod = joined.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    joined.parent = arm
    merged.append(joined)
print("MESHES", len(merged), "from", len(parts), "parts")

# ---------------------------------------------------------------- animation
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
pose = arm.pose.bones
for pb in pose:
    pb.rotation_mode = "XYZ"


def reset_pose():
    for pb in pose:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    pose["console"].scale = (0.001, 0.001, 0.001)  # tucked away unless a clip brings it out
    pose["desk"].scale = (0.001, 0.001, 0.001)  # the desk only appears in the sitting clips
    pose["smile"].scale = (0.001, 0.001, 0.001)  # the soft mouth is shown until a clip swaps in the smile


def key(name, frame_no, rot=None, scale=None, loc=None):
    pb = pose[name]
    if rot is not None:
        pb.rotation_euler = rot
        pb.keyframe_insert("rotation_euler", frame=frame_no)
    if scale is not None:
        pb.scale = scale
        pb.keyframe_insert("scale", frame=frame_no)
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert("location", frame=frame_no)


arm.animation_data_create()


def new_action(name):
    reset_pose()
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    return act


def push_to_nla(act, name):
    hide, show = (0.001,) * 3, (1.0,) * 3
    for f in (int(act.frame_range[0]), int(act.frame_range[1])):
        smiling = name != "Idle"  # she only smiles while she is doing something
        key("desk", f, scale=show if name in ("Idle", "Hi") else hide)  # the desk belongs to the sitting clips
        key("mouth", f, scale=hide if smiling else show)
        key("smile", f, scale=show if smiling else hide)
        if name != "Play":
            key("console", f, scale=hide)  # the console is hidden in every other clip
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(act.frame_range[0]), act)
    arm.animation_data.action = None


def series(name, frames, values, kind="rot", axis=2):
    """Keyframe one bone channel: values are numbers applied on one axis (rot/loc), or full tuples."""
    for f, v in zip(frames, values):
        vec = v if isinstance(v, tuple) else tuple(v if i == axis else 0.0 for i in range(3))
        key(name, f, **{kind: vec})


# Idle: she sits behind her Dell laptop. 6 second loop: she is low behind the lid with only the top of her head showing,
# pops up to peek over it, waves hi with her right hand, and sinks back down while typing with the other hand.
# (hips "location Y" is straight up in this rig; the standing hips are at 0, so about -0.44 is a seated height.)
TYPE_UP, TYPE_FORE = (-0.7, 0.0, 0.0), (-1.3, 0.0, 0.0)  # arms forward onto the keyboard
HI_UP = (0.0, 0.0, 2.75)  # right arm raised beside her head
LOW, HIGH = -0.46, -0.40
SIT_SKIRT = (1.0, 0.6, 1.0)


def wave_forearm(frames):
    """Forearm waves left and right (Z) while the hand is up."""
    return [(0.0, 0.0, 0.5 if i % 2 else -0.5) for i in range(len(frames))]


idle = new_action("Idle")
IDLE_F = (1, 24, 44, 112, 132, 144)
IDLE_HIPS = [LOW, LOW, HIGH, HIGH, LOW, LOW]
series("hips", IDLE_F, IDLE_HIPS, "loc", axis=1)
series("feet", IDLE_F, [-v for v in IDLE_HIPS], "loc", axis=1)  # heels stay on the floor
series("chest", (1, 72, 144), [(1, 1, 1.0), (1, 1, 1.025), (1, 1, 1.0)], "scale")
series("upperarm.L", (1, 144), [TYPE_UP, TYPE_UP], "rot")
series("forearm.L", (1, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144),
       [(-1.3 + (0.06 if i % 2 else -0.04), 0.0, 0.0) for i in range(13)], "rot")
series("upperarm.R", (1, 24, 48, 60, 104, 122, 144), [TYPE_UP, TYPE_UP, HI_UP, HI_UP, HI_UP, TYPE_UP, TYPE_UP], "rot")
WAVE_F = (60, 68, 76, 84, 92, 100)
series("forearm.R", (1, 24, 48) + WAVE_F + (110, 124, 144),
       [TYPE_FORE, TYPE_FORE, (0.0, 0.0, 0.0)] + wave_forearm(WAVE_F) + [(0.0, 0.0, 0.0), TYPE_FORE, TYPE_FORE], "rot")
series("head", (1, 44, 66, 90, 112, 144), [(0.0, 0.0, 0.0), (0.0, 0.0, 0.07), (0.0, 0.0, -0.07), (0.0, 0.0, 0.06), (0.0, 0.0, 0.0), (0.0, 0.0, 0.0)], "rot")
series("brow.L", (1, 44, 112, 130), [0.0, 0.012, 0.012, 0.0], "loc", axis=1)
series("brow.R", (1, 44, 112, 130), [0.0, 0.012, 0.012, 0.0], "loc", axis=1)
series("skirt", (1, 72, 144), [-0.02, 0.02, -0.02])
series("skirt", (1, 144), [SIT_SKIRT, SIT_SKIRT], "scale")  # the dress gathers up when she sits, so the hem stays above the floor
for name in ("eye.L", "eye.R"):
    series(name, (1, 30, 33, 36, 96, 99, 102, 144), [(1, 1, 1), (1, 1, 1), (1, 0.1, 1), (1, 1, 1), (1, 1, 1), (1, 0.1, 1), (1, 1, 1), (1, 1, 1)], "scale")
push_to_nla(idle, "Idle")

# Hi: the same hello once (used by the "Say hi" button and by clicking her): she pops up, waves, and sinks back.
hi = new_action("Hi")
HIF = (1, 12, 62, 76)
HI_HIPS = [-0.43, -0.36, -0.36, -0.43]
series("hips", HIF, HI_HIPS, "loc", axis=1)
series("feet", HIF, [-v for v in HI_HIPS], "loc", axis=1)
series("upperarm.L", (1, 76), [TYPE_UP, TYPE_UP], "rot")
series("forearm.L", (1, 76), [TYPE_FORE, TYPE_FORE], "rot")
series("upperarm.R", HIF, [TYPE_UP, HI_UP, HI_UP, TYPE_UP], "rot")
HI_W = (20, 27, 34, 41, 48, 55)
series("forearm.R", (1, 12) + HI_W + (62, 76), [TYPE_FORE, (0.0, 0.0, 0.0)] + wave_forearm(HI_W) + [(0.0, 0.0, 0.0), TYPE_FORE], "rot")
series("head", (1, 24, 44, 62, 76), [(0.0, 0.0, 0.0), (0.0, 0.0, 0.1), (0.0, 0.0, -0.1), (0.0, 0.0, 0.04), (0.0, 0.0, 0.0)], "rot")
series("brow.L", (1, 12, 62, 76), [0.0, 0.014, 0.014, 0.0], "loc", axis=1)
series("brow.R", (1, 12, 62, 76), [0.0, 0.014, 0.014, 0.0], "loc", axis=1)
series("skirt", (1, 76), [SIT_SKIRT, SIT_SKIRT], "scale")
push_to_nla(hi, "Hi")

# Wave: raise the right arm out to the side, wave the forearm, lower it again
wave = new_action("Wave")
RAISE = 2.3
series("upperarm.R", (1, 12, 38, 50), [0.0, RAISE, RAISE, 0.0])
series("forearm.R", (1, 12, 17, 23, 29, 35, 38, 50), [0.0, 0.0, 0.5, -0.5, 0.5, -0.5, 0.0, 0.0])
series("head", (1, 12, 30, 50), [0.12 * v for v in (0, 1, -1, 0)])
series("brow.L", (1, 12, 38, 50), [0.0, 0.01, 0.01, 0.0], "loc", axis=1)
series("brow.R", (1, 12, 38, 50), [0.0, 0.01, 0.01, 0.0], "loc", axis=1)
push_to_nla(wave, "Wave")

# Nod: a friendly "yes"
nod = new_action("Nod")
series("head", (1, 8, 16, 24, 32, 40, 48), [0.0, 0.28, -0.04, 0.28, -0.04, 0.10, 0.0], axis=0)
series("brow.L", (1, 8, 24, 48), [0.0, 0.008, 0.008, 0.0], "loc", axis=1)
series("brow.R", (1, 8, 24, 48), [0.0, 0.008, 0.008, 0.0], "loc", axis=1)
series("chest", (1, 8, 16, 24, 32, 48), [0.0, 0.04, 0.0, 0.04, 0.0, 0.0], axis=0)
push_to_nla(nod, "Nod")

# Cheer: both arms up, a little bounce
cheer = new_action("Cheer")
CF = (1, 10, 20, 30, 40, 50, 60)
series("upperarm.R", CF, [0.0, 2.8, 2.7, 2.8, 2.7, 2.8, 0.0])
series("upperarm.L", CF, [0.0, -2.8, -2.7, -2.8, -2.7, -2.8, 0.0])
series("forearm.R", CF, [0.0, 0.0, 0.25, -0.25, 0.25, 0.0, 0.0])
series("forearm.L", CF, [0.0, 0.0, -0.25, 0.25, -0.25, 0.0, 0.0])
series("hips", CF, [0.0, 0.05, 0.0, 0.05, 0.0, 0.05, 0.0], "loc", axis=1)
series("head", CF, [0.0, -0.15, -0.05, -0.15, -0.05, -0.15, 0.0], axis=0)
series("skirt", CF, [0.0, 0.06, -0.06, 0.06, -0.06, 0.04, 0.0])
series("brow.L", CF, [0.0, 0.012, 0.012, 0.012, 0.012, 0.012, 0.0], "loc", axis=1)
series("brow.R", CF, [0.0, 0.012, 0.012, 0.012, 0.012, 0.012, 0.0], "loc", axis=1)
push_to_nla(cheer, "Cheer")

# Twirl: one full turn with the arms out and the skirt flaring out. The web page spins her base along with it.
twirl = new_action("Twirl")
series("root", (1, 60), [0.0, 2 * math.pi], axis=1)  # about the vertical axis
series("upperarm.R", (1, 10, 50, 60), [0.0, 0.85, 0.85, 0.0])
series("upperarm.L", (1, 10, 50, 60), [0.0, -0.85, -0.85, 0.0])
series("forearm.R", (1, 10, 50, 60), [0.0, 0.2, 0.2, 0.0])
series("forearm.L", (1, 10, 50, 60), [0.0, -0.2, -0.2, 0.0])
series("skirt", (1, 14, 46, 60), [(1, 1, 1), (1.22, 1, 1.22), (1.22, 1, 1.22), (1, 1, 1)], "scale")
series("hips", (1, 30, 60), [0.0, 0.03, 0.0], "loc", axis=1)
series("head", (1, 30, 60), [0.0, 0.1, 0.0])
series("brow.L", (1, 14, 46, 60), [0.0, 0.01, 0.01, 0.0], "loc", axis=1)
series("brow.R", (1, 14, 46, 60), [0.0, 0.01, 0.01, 0.0], "loc", axis=1)
push_to_nla(twirl, "Twirl")

# Think: a hand to the chin and a tilt of the head
think = new_action("Think")
TF = (1, 14, 58, 72)
series("upperarm.R", TF, [(0.0, 0.0, 0.0), (-0.8, -0.8, 0.0), (-0.8, -0.8, 0.0), (0.0, 0.0, 0.0)], "rot")
series("forearm.R", TF, [(0.0, 0.0, 0.0), (-2.4, 0.0, 0.0), (-2.4, 0.0, 0.0), (0.0, 0.0, 0.0)], "rot")
series("head", TF, [(0.0, 0.0, 0.0), (0.06, 0.0, -0.12), (0.06, 0.0, -0.12), (0.0, 0.0, 0.0)], "rot")
series("brow.R", TF, [0.0, 0.012, 0.012, 0.0], "loc", axis=1)
push_to_nla(think, "Think")

# Play: she pulls out a handheld console, plays with a little head and hand wiggle, wins, and puts it away
play = new_action("Play")
mash = (14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80)
HOLD = (1, 10, 14, 90, 106)
for side, sx in (("R", 1), ("L", -1)):  # R is on the -x side in this rig, so inward is negative Z for R
    inward = 0.0
    series(f"upperarm.{side}", HOLD, [(0, 0, 0), (-0.55, 0, inward), (-0.55, 0, inward), (-0.55, 0, inward), (0, 0, 0)], "rot")
    f_rest = [(0, 0, 0), (-1.5, 0, inward * 1.2), (-1.5, 0, inward * 1.2)]
    wob = [(-1.5 + (0.07 if (i + (side == "L")) % 2 else -0.05), 0, inward * 1.2) for i in range(len(mash))]
    series(f"forearm.{side}", (1, 10) + mash + (90, 106), f_rest[:2] + wob + [(-1.5, 0, inward * 1.2), (0, 0, 0)], "rot")
series("console", (1, 7, 11, 15, 90, 100), [(0.001,) * 3, (1.2,) * 3, (1.0,) * 3, (1.0,) * 3, (1.0,) * 3, (0.001,) * 3], "scale")
series("console", (1, 12, 14) + mash + (90,), [(0.0, 0.0, 0.0), (-0.30, 0.0, 0.0), (-0.30, 0.0, 0.0)] + [(-0.30, 0.0, 0.025 * (1 if i % 2 else -1)) for i in range(len(mash))] + [(-0.30, 0.0, 0.0)], "rot")
series("head", (1, 12, 30, 44, 58, 72, 86, 94, 106), [(0, 0, 0), (0.24, 0, 0), (0.28, 0, 0.06), (0.22, 0, -0.06), (0.30, 0, 0.05), (0.22, 0, -0.04), (0.20, 0, 0), (-0.12, 0, 0), (0, 0, 0)], "rot")
series("chest", (1, 12, 50, 90, 106), [(0, 0, 0), (0.08, 0, 0), (0.1, 0, 0.03), (0.08, 0, 0), (0, 0, 0)], "rot")
series("brow.L", (1, 12, 90, 94, 106), [0.0, 0.01, 0.01, 0.016, 0.0], "loc", axis=1)
series("brow.R", (1, 12, 90, 94, 106), [0.0, 0.01, 0.01, 0.016, 0.0], "loc", axis=1)
series("skirt", (1, 50, 106), [0.0, 0.02, 0.0])
for name in ("eye.L", "eye.R"):
    series(name, (1, 40, 43, 46, 70, 73, 76, 106), [(1, 1, 1), (1, 1, 1), (1, 0.1, 1), (1, 1, 1), (1, 1, 1), (1, 0.1, 1), (1, 1, 1), (1, 1, 1)], "scale")
push_to_nla(play, "Play")
reset_pose()
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- save and export
blend_path = os.path.join(OUT_DIR, "avatar.blend")
glb_path = os.path.join(OUT_DIR, "avatar.glb")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

bpy.ops.object.select_all(action="DESELECT")
for o in merged + [arm]:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(
    filepath=glb_path, export_format="GLB", use_selection=True, export_apply=False,
    export_animations=True, export_animation_mode="NLA_TRACKS", export_cameras=False, export_lights=False,
    export_yup=True,
)
print("EXPORTED", glb_path, os.path.getsize(glb_path), "bytes")

# In the saved .blend only Idle plays; the other clips stay in the NLA, muted, so the file opens in a clean pose.
for t in arm.animation_data.nla_tracks:
    t.mute = t.name != "Idle"
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# ---------------------------------------------------------------- previews
if PREVIEW_DIR:
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    scene.render.engine = "BLENDER_WORKBENCH"
    sh = scene.display.shading
    sh.light = "STUDIO"
    sh.color_type = "TEXTURE"
    sh.show_cavity = False
    scene.world = bpy.data.worlds.new("W")
    scene.world.color = (0.93, 0.95, 0.94)
    for t in arm.animation_data.nla_tracks:
        t.mute = True  # previews play one clip at a time
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    def shot(name, loc, rot_z=0.0, lens=50, size=(800, 1100), action=None, frame_no=1):
        cam.location = loc
        cam.rotation_euler = (math.radians(90), 0, rot_z)
        cam_data.lens = lens
        scene.render.resolution_x, scene.render.resolution_y = size
        reset_pose()  # previews must not inherit the previous shot's pose
        if action:
            arm.animation_data.action = bpy.data.actions[action]
            scene.frame_set(frame_no)
        else:
            arm.animation_data.action = None
            reset_pose()
        scene.render.filepath = os.path.join(PREVIEW_DIR, name)
        bpy.ops.render.render(write_still=True)

    shot("front.png", (0, -5.0, 0.98))
    shot("face.png", (0, -1.4, 1.64), lens=70, size=(900, 900))
    ang = math.radians(35)
    shot("three_quarter.png", (5.0 * math.sin(ang), -5.0 * math.cos(ang), 0.98), rot_z=ang)
    shot("back.png", (0, 5.0, 0.98), rot_z=math.radians(180))
    shot("wave.png", (0, -5.0, 0.98), action="Wave", frame_no=26)
    shot("cheer.png", (0, -5.0, 0.98), action="Cheer", frame_no=10)
    shot("feet.png", (0, -1.9, 0.30), lens=60, size=(900, 700))
    shot("twirl.png", (0, -5.0, 0.98), action="Twirl", frame_no=14)
    shot("think.png", (0, -5.0, 0.98), action="Think", frame_no=36)
    shot("play.png", (0, -5.0, 0.98), action="Play", frame_no=44)
    for hb in ("hand.L", "hand.R", "forearm.L", "forearm.R"):
        pb = arm.pose.bones[hb]
        print("POSE", hb, [round(v, 3) for v in (arm.matrix_world @ pb.head)], [round(v, 3) for v in (arm.matrix_world @ pb.tail)])
    shot("play_side.png", (5.0, 0, 0.98), rot_z=math.radians(90), action="Play", frame_no=45)
    shot("play_close.png", (0, -2.4, 1.2), lens=60, size=(900, 900), action="Play", frame_no=46)
    shot("sit_low.png", (0, -5.0, 0.98), action="Idle", frame_no=10)
    shot("sit_hi.png", (0, -5.0, 0.98), action="Idle", frame_no=76)
    shot("sit_close.png", (0, -2.8, 1.05), lens=60, size=(900, 900), action="Idle", frame_no=76)
    shot("sit_side.png", (5.0, 0, 0.98), rot_z=math.radians(90), action="Idle", frame_no=76)
    shot("sit_back.png", (0, 5.0, 0.98), rot_z=math.radians(180), action="Idle", frame_no=76)
    arm.animation_data.action = None
