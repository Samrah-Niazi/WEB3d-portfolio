"""
Renders transparent PNG stills of the avatar for the After Effects promo video.

Run (from the project root):
  blender --background --python assets/blender/render_avatar_stills.py -- assets/blender/avatar.blend assets/aftereffects/footage/avatar
"""
import math
import os
import sys

import bpy

blend, out_dir = [os.path.abspath(a) for a in sys.argv[sys.argv.index("--") + 1:][:2]]
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=blend)
scene = bpy.context.scene
arm = bpy.data.objects["Armature"]
for t in arm.animation_data.nla_tracks:
    t.mute = True  # one clip at a time

scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.resolution_x, scene.render.resolution_y = 1200, 1650
scene.render.resolution_percentage = 200  # figure ends up ~1900 px tall, sharp at 1080p

# soft studio light: a warm key, a cool fill and an even ambient so the red dress and black hijab both read
world = bpy.data.worlds.new("W")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.8, 0.82, 0.85, 1)
bg.inputs["Strength"].default_value = 0.9
scene.world = world
for name, loc, energy, color in (("Key", (2.5, -4, 4), 4.0, (1.0, 0.95, 0.88)), ("Fill", (-3, -3, 2), 1.6, (0.85, 0.9, 1.0))):
    sun = bpy.data.lights.new(name, "SUN")
    sun.energy = energy
    sun.color = color
    obj = bpy.data.objects.new(name, sun)
    obj.location = loc
    obj.rotation_euler = (math.radians(55), 0, math.radians(30 if name == "Key" else -40))
    scene.collection.objects.link(obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 50
cam = bpy.data.objects.new("Cam", cam_data)
cam.location = (0, -5.0, 0.98)
cam.rotation_euler = (math.radians(90), 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam


def reset_pose():
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    arm.pose.bones["console"].scale = (0.001, 0.001, 0.001)
    arm.pose.bones["smile"].scale = (0.001, 0.001, 0.001)


# name -> (action, frame): a few poses to cut between in the video
POSES = {
    "idle": (None, 1),
    "wave": ("Wave", 26),
    "cheer": ("Cheer", 22),
    "think": ("Think", 36),
    "play": ("Play", 44),
}
for name, (action, frame) in POSES.items():
    reset_pose()
    arm.animation_data.action = bpy.data.actions[action] if action else None
    scene.frame_set(frame + 1)  # re-evaluate even when the frame number repeats
    scene.frame_set(frame)
    scene.render.filepath = os.path.join(out_dir, f"avatar_{name}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", name)
