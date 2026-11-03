// Builds Samrah Niazi's 45-second promo video in After Effects.
//
// How to run: open After Effects, choose File > Scripts > Run Script File..., pick this file.
// It creates the composition "Samrah Promo" (1920x1080, 30 fps), imports the pictures from the footage folder
// next to this script, animates everything, and saves samrah_promo.aep beside it.
// Optional music: put a track named music.mp3 (or music.wav) in the footage folder BEFORE running.
//
// Scenes (seconds): 0-6 intro, 6-14 about, 14-26 projects, 26-33 skills, 33-39 achievements, 39-45 call to action.
(function () {
    var W = 1920, H = 1080, FPS = 30, DUR = 45;
    var base = File($.fileName).parent;
    var footage = new Folder(base.fsName + "/footage");

    var C = {
        bg1: [0.024, 0.12, 0.118], bg2: [0.06, 0.46, 0.43],
        pink: [1, 0.37, 0.64], yellow: [1, 0.79, 0.2], white: [1, 1, 1],
        teal: [0.18, 0.83, 0.75], ink: [0.04, 0.1, 0.1], soft: [0.78, 0.92, 0.9]
    };
    function c4(c) { return [c[0], c[1], c[2], 1]; }

    app.beginUndoGroup("Build Samrah promo");
    var proj = app.project;
    var comp = proj.items.addComp("Samrah Promo", W, H, 1, DUR, FPS);
    comp.bgColor = C.bg1;

    // ---------------------------------------------------------------- helpers
    function ease(prop) {
        try {
            var n = 1;
            var t = prop.propertyValueType;
            if (t !== PropertyValueType.TwoD_SPATIAL && t !== PropertyValueType.ThreeD_SPATIAL) {
                n = (prop.value instanceof Array) ? prop.value.length : 1;
            }
            var arr = [];
            for (var i = 0; i < n; i++) arr.push(new KeyframeEase(0, 75));
            for (var k = 1; k <= prop.numKeys; k++) prop.setTemporalEaseAtKey(k, arr, arr);
        } catch (e) {}
    }

    function keys(prop, times, values) {
        for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
        ease(prop);
    }

    function text(str, size, color, x, y, t0, t1, o) {
        o = o || {};
        var l = comp.layers.addText(str);
        var tp = l.property("Source Text");
        var td = tp.value;
        td.resetCharStyle();
        td.fontSize = size;
        td.fillColor = color;
        td.applyFill = true;
        td.applyStroke = false;
        td.font = o.font || "Arial-BoldMT";
        td.justification = o.left ? ParagraphJustification.LEFT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
        td.tracking = o.tracking || 0;
        tp.setValue(td);
        l.transform.position.setValue([x, y]);
        l.inPoint = t0;
        l.outPoint = t1;
        return l;
    }

    function rect(w, h, color, x, y, t0, t1, round, name) {
        var l = comp.layers.addShape();
        l.name = name || "Shape";
        var g = l.property("Contents").addProperty("ADBE Vector Group");
        var r = g.property("Contents").addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue([w, h]);
        r.property("ADBE Vector Rect Roundness").setValue(round || 0);
        var f = g.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(c4(color));
        l.transform.position.setValue([x, y]);
        l.inPoint = t0;
        l.outPoint = t1;
        return l;
    }

    function circle(d, color, x, y, t0, t1, name) {
        var l = comp.layers.addShape();
        l.name = name || "Circle";
        var g = l.property("Contents").addProperty("ADBE Vector Group");
        var e = g.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
        e.property("ADBE Vector Ellipse Size").setValue([d, d]);
        var f = g.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(c4(color));
        l.transform.position.setValue([x, y]);
        l.inPoint = t0;
        l.outPoint = t1;
        return l;
    }

    function star(r, color, x, y, t0, t1, name) {
        var l = comp.layers.addShape();
        l.name = name || "Star";
        var g = l.property("Contents").addProperty("ADBE Vector Group");
        var st = g.property("Contents").addProperty("ADBE Vector Shape - Star");
        st.property("ADBE Vector Star Type").setValue(1);
        st.property("ADBE Vector Star Points").setValue(5);
        st.property("ADBE Vector Star Outer Radius").setValue(r);
        st.property("ADBE Vector Star Inner Radius").setValue(r * 0.45);
        var f = g.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(c4(color));
        l.transform.position.setValue([x, y]);
        l.inPoint = t0;
        l.outPoint = t1;
        return l;
    }

    var cache = {};
    function footageItem(path) {
        if (cache[path]) return cache[path];
        var f = new File(footage.fsName + "/" + path);
        if (!f.exists) return null;
        cache[path] = proj.importFile(new ImportOptions(f));
        return cache[path];
    }

    // a picture scaled to a given width (width) or height (height), centred on x,y
    function pic(path, size, byHeight, x, y, t0, t1) {
        var item = footageItem(path);
        if (!item) return null;
        var l = comp.layers.add(item);
        var s = byHeight ? size / item.height * 100 : size / item.width * 100;
        l.transform.scale.setValue([s, s]);
        l.transform.position.setValue([x, y]);
        l.inPoint = t0;
        l.outPoint = t1;
        return l;
    }

    function shadow(l, dist, soft) {
        try {
            var e = l.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
            e.property("ADBE Drop Shadow-0002").setValue(120);
            e.property("ADBE Drop Shadow-0004").setValue(dist);
            e.property("ADBE Drop Shadow-0005").setValue(soft);
        } catch (e2) {}
    }

    function glow(l) {
        try { l.property("ADBE Effect Parade").addProperty("ADBE Glo2"); } catch (e) {}
    }

    // ---- entrances and exits (times are absolute, in seconds)
    function fadeIn(l, t, d) { keys(l.transform.opacity, [t, t + (d || 0.4)], [0, 100]); }
    function fadeOut(l, t1) { if (t1 < DUR) keys(l.transform.opacity, [t1 - 0.4, t1], [100, 0]); }
    function popIn(l, t) {
        keys(l.transform.scale, [t, t + 0.3, t + 0.45], [[0, 0], [114, 114], [100, 100]]);
        keys(l.transform.opacity, [t, t + 0.12], [0, 100]);
    }
    function slideIn(l, t, dx, dy, d) {
        var p = l.transform.position.value;
        keys(l.transform.position, [t, t + (d || 0.65)], [[p[0] + dx, p[1] + dy], [p[0], p[1]]]);
        keys(l.transform.opacity, [t, t + 0.4], [0, 100]);
    }

    // ---------------------------------------------------------------- background and always-on layers
    var bg = comp.layers.addSolid(C.bg1, "Background", W, H, 1, DUR);
    try {
        var ramp = bg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
        ramp.property("ADBE Ramp-0001").setValue([0, 0]);
        ramp.property("ADBE Ramp-0002").setValue(c4(C.bg1));
        ramp.property("ADBE Ramp-0003").setValue([W, H]);
        ramp.property("ADBE Ramp-0004").setValue(c4(C.bg2));
    } catch (e) {}

    // soft drifting circles for depth
    var decor = [
        [420, C.pink, 180, 190], [300, C.yellow, 1720, 900], [520, C.teal, 1500, 160],
        [220, C.pink, 760, 940], [360, C.yellow, 120, 760], [260, C.teal, 1000, 80]
    ];
    for (var d = 0; d < decor.length; d++) {
        var dc = circle(decor[d][0], decor[d][1], decor[d][2], decor[d][3], 0, DUR, "Drifting circle " + (d + 1));
        dc.transform.opacity.setValue(16);
        dc.transform.position.expression = "wiggle(0.25, 70)";
    }

    // ---------------------------------------------------------------- scene helpers
    function header(label, t0, t1) {
        var h = text(label, 44, C.pink, 140, 130, t0, t1, { left: true, tracking: 260 });
        slideIn(h, t0 + 0.2, -60, 0);
        fadeOut(h, t1);
        var u = rect(180, 8, C.yellow, 230, 160, t0, t1, 4, "Header underline");
        keys(u.transform.scale, [t0 + 0.2, t0 + 0.8], [[0, 100], [100, 100]]);
        fadeOut(u, t1);
    }

    function avatar(pose, h, x, y, t0, t1, fromRight) {
        var ring = circle(h * 0.78, C.pink, x, y - h * 0.04, t0, t1, "Avatar halo");
        ring.transform.opacity.setValue(28);
        popIn(ring, t0 + 0.1);
        fadeOut(ring, t1);
        var a = pic("avatar/avatar_" + pose + ".png", h, true, x, y, t0, t1);
        if (!a) return;
        a.name = "Avatar " + pose;
        slideIn(a, t0 + 0.2, fromRight === false ? -500 : 500, 0, 0.9);
        shadow(a, 18, 40);
        fadeOut(a, t1);
        // a gentle float
        var p = a.transform.position.value;
        a.transform.position.expression = "[value[0], value[1] + Math.sin(time * 2.2) * 12]";
    }

    // ---------------------------------------------------------------- scene 1: intro (0-6)
    var s1 = text("HELLO, I'M", 54, C.pink, 760, 380, 0, 6, { tracking: 320 });
    fadeIn(s1, 0.3, 0.5); fadeOut(s1, 6);
    var n1 = text("SAMRAH", 200, C.white, 760, 570, 0, 6);
    popIn(n1, 0.7); fadeOut(n1, 6); glow(n1);
    var n2 = text("NIAZI", 200, C.yellow, 760, 770, 0, 6);
    popIn(n2, 1.0); fadeOut(n2, 6); glow(n2);
    var sub = text("GAME DEVELOPER   \u2022   AR/VR   \u2022   UNITY & UNREAL", 42, C.teal, 760, 900, 0, 6, { tracking: 60 });
    slideIn(sub, 1.9, 0, 40); fadeOut(sub, 6);
    avatar("wave", 880, 1530, 560, 0.4, 6);

    // ---------------------------------------------------------------- scene 2: about (6-14)
    header("ABOUT ME", 6, 14);
    var a1 = text("Final-year student at NED University", 60, C.white, 140, 400, 6, 14, { left: true });
    slideIn(a1, 6.5, -120, 0); fadeOut(a1, 14);
    var a2 = text("Game development  \u2022  AR / VR  \u2022  Unity & Unreal", 46, C.teal, 140, 540, 6, 14, { left: true });
    slideIn(a2, 7.3, -120, 0); fadeOut(a2, 14);
    var a3 = text("I build games that feel alive.", 70, C.yellow, 140, 720, 6, 14, { left: true });
    slideIn(a3, 8.3, -120, 0); fadeOut(a3, 14); glow(a3);
    var pill = rect(1040, 110, C.pink, 660, 900, 6, 14, 55, "Intern pill");
    popIn(pill, 9.6); fadeOut(pill, 14);
    var pillT = text("Game Developer Intern  @  Game Storm Studios", 44, C.ink, 660, 915, 6, 14);
    popIn(pillT, 9.7); fadeOut(pillT, 14);
    avatar("think", 860, 1600, 570, 6, 14);

    // ---------------------------------------------------------------- scene 3: projects (14-26)
    header("PROJECTS", 14, 26);
    var projects = [
        ["screens/unbroken-oath.png", "The Unbroken Oath", "Unity 3D  \u2022  First-person tactical shooter", "Runner-up, GAMECON'26"],
        ["screens/the-abduction.png", "The Abduction", "Unity 3D  \u2022  Horror escape", "Puzzles, guards and patrol AI"],
        ["screens/warp.png", "Warp: Fractured Reality", "Unity 6  \u2022  Two-player co-op", "Split-screen across two worlds"],
        ["screens/super-jump.png", "Super Jump", "Unity  \u2022  Platformer", "Coins, levels and a city skyline"]
    ];
    for (var i = 0; i < projects.length; i++) {
        var t0 = 14.3 + i * 3, t1 = (i === projects.length - 1) ? 26 : t0 + 3;
        var photoLeft = (i % 2 === 0);
        var px = photoLeft ? 640 : 1280;
        var tx = photoLeft ? 1190 : 140;
        var tilt = photoLeft ? -3 : 3;
        var frame = rect(1000, 590, C.white, px, 590, t0, t1, 30, "Frame " + (i + 1));
        slideIn(frame, t0, photoLeft ? -300 : 300, 0); fadeOut(frame, t1); shadow(frame, 14, 30);
        keys(frame.transform.rotation, [t0, t0 + 0.7], [tilt * 3, tilt]);
        var photo = pic(projects[i][0], 960, false, px, 590, t0, t1);
        if (photo) {
            slideIn(photo, t0, photoLeft ? -300 : 300, 0); fadeOut(photo, t1);
            keys(photo.transform.rotation, [t0, t0 + 0.7], [tilt * 3, tilt]);
        }
        var no = text("NO. 0" + (i + 1), 38, C.pink, tx, 400, t0, t1, { left: true, tracking: 200 });
        slideIn(no, t0 + 0.2, photoLeft ? 160 : -160, 0); fadeOut(no, t1);
        var ti = text(projects[i][1], 52, C.white, tx, 500, t0, t1, { left: true });
        slideIn(ti, t0 + 0.3, photoLeft ? 160 : -160, 0); fadeOut(ti, t1);
        var tg = text(projects[i][2], 30, C.teal, tx, 590, t0, t1, { left: true });
        slideIn(tg, t0 + 0.4, photoLeft ? 160 : -160, 0); fadeOut(tg, t1);
        var ln = text(projects[i][3], 34, C.yellow, tx, 680, t0, t1, { left: true });
        slideIn(ln, t0 + 0.5, photoLeft ? 160 : -160, 0); fadeOut(ln, t1);
    }

    // ---------------------------------------------------------------- scene 4: skills (26-33)
    header("SKILLS", 26, 33);
    var skills = ["Unity", "Unreal Engine", "C#", "C++", "AR / VR", "Meta Quest", "Blender", "After Effects",
                  "Gameplay Code", "Level Design", "Python", "Three.js"];
    var colors = [C.pink, C.yellow, C.teal];
    for (var s = 0; s < skills.length; s++) {
        var col = s % 4, row = Math.floor(s / 4);
        var sx = 285 + col * 345, sy = 400 + row * 150;
        var st = 26.6 + s * 0.2;
        var pl = rect(330, 100, colors[s % 3], sx, sy, st, 33, 50, "Skill pill " + (s + 1));
        popIn(pl, st); fadeOut(pl, 33);
        var pt = text(skills[s], 38, C.ink, sx, sy + 14, st, 33);
        popIn(pt, st + 0.05); fadeOut(pt, 33);
    }
    avatar("play", 800, 1700, 590, 26, 33);

    // ---------------------------------------------------------------- scene 5: achievements (33-39)
    header("ACHIEVEMENTS", 33, 39);
    var wins = [
        ["RUNNER-UP", "GAMECON'26", "The Unbroken Oath  \u2022  TechFest'26, NED CSIT", 440],
        ["WINNER", "BEST FYDP", "TALEEM360  \u2022  NEDUET FYDP Exhibition", 760]
    ];
    for (var w = 0; w < wins.length; w++) {
        var wt = 33.4 + w * 0.7;
        var card = rect(1180, 270, C.yellow, 790, wins[w][3], wt, 39, 36, "Award card " + (w + 1));
        slideIn(card, wt, -700, 0); fadeOut(card, 39); shadow(card, 16, 30);
        var sg = star(62, C.ink, 310, wins[w][3], wt, 39, "Award star " + (w + 1));
        popIn(sg, wt + 0.5); fadeOut(sg, 39);
        var l1 = text(wins[w][0], 40, C.pink, 420, wins[w][3] - 55, wt, 39, { left: true, tracking: 220 });
        slideIn(l1, wt + 0.3, -300, 0); fadeOut(l1, 39);
        var l2 = text(wins[w][1], 100, C.ink, 420, wins[w][3] + 40, wt, 39, { left: true });
        slideIn(l2, wt + 0.4, -300, 0); fadeOut(l2, 39);
        var l3 = text(wins[w][2], 34, C.ink, 420, wins[w][3] + 100, wt, 39, { left: true, font: "ArialMT" });
        slideIn(l3, wt + 0.5, -300, 0); fadeOut(l3, 39);
    }
    avatar("cheer", 900, 1640, 580, 33, 39);

    // ---------------------------------------------------------------- scene 6: call to action (39-45)
    var c1 = text("LET'S BUILD", 160, C.white, 760, 400, 39, 45);
    popIn(c1, 39.4); glow(c1);
    var c2 = text("SOMETHING FUN", 160, C.yellow, 760, 570, 39, 45);
    popIn(c2, 39.8); glow(c2);
    var c3 = text("web-3d-portfolio-five.vercel.app", 54, C.teal, 760, 760, 39, 45, { tracking: 20 });
    slideIn(c3, 40.6, 0, 50);
    var c4t = text("samrahniazi677@gmail.com", 44, C.white, 760, 850, 39, 45, { font: "ArialMT" });
    slideIn(c4t, 41.0, 0, 50);
    avatar("wave", 880, 1560, 570, 39, 45);

    // ---------------------------------------------------------------- scene wipes, progress bar, fade out
    var cuts = [6, 14, 26, 33, 39];
    for (var k = 0; k < cuts.length; k++) {
        var tc = cuts[k];
        var wp = rect(W * 1.6, H * 1.3, C.pink, 0, H / 2, tc - 0.45, tc + 0.45, 0, "Wipe pink " + (k + 1));
        keys(wp.transform.position, [tc - 0.4, tc, tc + 0.4], [[-W * 0.95, H / 2], [W / 2, H / 2], [W * 1.95, H / 2]]);
        wp.transform.rotation.setValue(8);
        wp.moveToBeginning();
        var wy = rect(W * 1.6, H * 1.3, C.yellow, 0, H / 2, tc - 0.35, tc + 0.55, 0, "Wipe yellow " + (k + 1));
        keys(wy.transform.position, [tc - 0.3, tc + 0.05, tc + 0.5], [[-W * 0.95, H / 2], [W / 2, H / 2], [W * 1.95, H / 2]]);
        wy.transform.rotation.setValue(8);
        wy.moveToBeginning();
        wp.moveToBeginning();
    }

    var bar = comp.layers.addShape();
    bar.name = "Progress bar";
    var bg2 = bar.property("Contents").addProperty("ADBE Vector Group");
    var br = bg2.property("Contents").addProperty("ADBE Vector Shape - Rect");
    br.property("ADBE Vector Rect Size").setValue([W, 10]);
    br.property("ADBE Vector Rect Position").setValue([W / 2, 0]);
    var bf = bg2.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    bf.property("ADBE Vector Fill Color").setValue(c4(C.pink));
    bar.transform.position.setValue([0, H - 5]);
    keys(bar.transform.scale, [0, DUR], [[0, 100], [100, 100]]);
    bar.moveToBeginning();

    var fade = comp.layers.addSolid([0, 0, 0], "Fade to black", W, H, 1, DUR);
    keys(fade.transform.opacity, [DUR - 1.2, DUR], [0, 100]);
    fade.moveToBeginning();

    // ---------------------------------------------------------------- music (optional)
    var musicName = null;
    var exts = ["mp3", "wav", "m4a", "aif"];
    for (var m = 0; m < exts.length; m++) {
        if (new File(footage.fsName + "/music." + exts[m]).exists) { musicName = "music." + exts[m]; break; }
    }
    if (musicName) {
        var mi = footageItem(musicName);
        var ml = comp.layers.add(mi);
        ml.outPoint = DUR;
        var lv = ml.property("ADBE Audio Group").property("ADBE Audio Levels");
        keys(lv, [0, 2.5, DUR - 3, DUR], [[-40, -40], [-8, -8], [-8, -8], [-40, -40]]);
    }

    comp.time = 0;
    comp.openInViewer();
    app.endUndoGroup();

    try { proj.save(new File(base.fsName + "/samrah_promo.aep")); } catch (eSave) {}

    alert("Promo built.\n\n" +
        (musicName ? "Music: " + musicName + " added.\n\n" : "No music found. Put a licensed track named music.mp3 in the footage folder and run the script again, or drag one onto the timeline.\n\n") +
        "Next: Composition > Add to Adobe Media Encoder Queue, choose H.264 (High Quality 1080p), and export to frontend/public/video/promo.mp4.");
})();
