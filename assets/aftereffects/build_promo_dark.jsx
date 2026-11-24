// Builds the dark promo (48 s, 1920x1080, 30 fps) for Samrah Niazi's portfolio in After Effects.
// It mixes two reference styles: misty dark 3D scenes with particle text, serif titles, a skills globe and 3D bars,
// and a dot-matrix portrait on a wireframe grid, giant type, white "paper" beats and a red neon ending.
//
// Run it inside After Effects (File > Scripts > Run Script File...) or unattended:
//   AfterFX.exe -noui -r assets/aftereffects/build_promo_dark.jsx
// It imports the footage next to this script (footage/portrait, footage/screens, footage/music_dark.wav), builds every
// scene as its own composition, and saves samrah_promo_dark.aep beside it. Render with aerender (see README).
//
// Scenes (seconds): 0-4 loading, 4-12 portrait, 12-18 particle title, 18-26 skills globe, 26-32 numbers,
// 32-36 work, 36-38 paper beat, 38-42 recognition, 42-48 contact.
(function () {
    var W = 1920, H = 1080, FPS = 30, DUR = 48;
    var base = File($.fileName).parent;
    var foot = base.fsName + "/footage";
    var logPath = base.fsName + "/_build_log.txt";
    (function () { var f0 = new File(logPath); f0.open("w"); f0.close(); })();
    function log(s) { var f = new File(logPath); f.open("a"); f.writeln(s); f.close(); }

    var C = {
        ink: [0.02, 0.015, 0.03], white: [0.95, 0.95, 0.96], silver: [0.74, 0.76, 0.8], rose: [0.88, 0.71, 0.74],
        maroon: [0.48, 0.13, 0.2], deep: [0.36, 0.06, 0.11], red: [0.92, 0.13, 0.16], paper: [0.95, 0.93, 0.9], black: [0, 0, 0]
    };
    var CONF = ["Impact", "Georgia-Italic", "Bahnschrift", "Consolas"];
    var F_BIG = "Impact", F_SERIF = "Georgia-Italic", F_UI = "Bahnschrift", F_MONO = "Consolas";

    // ---------------------------------------------------------------- helpers
    function ease(prop, infl) {
        try {
            var arr = [];
            var t = prop.propertyValueType;
            var n = 1;
            if (t !== PropertyValueType.TwoD_SPATIAL && t !== PropertyValueType.ThreeD_SPATIAL) {
                n = (prop.value instanceof Array) ? prop.value.length : 1;
            }
            for (var i = 0; i < n; i++) arr.push(new KeyframeEase(0, infl || 70));
            for (var k = 1; k <= prop.numKeys; k++) prop.setTemporalEaseAtKey(k, arr, arr);
        } catch (e) {}
    }
    function kf(prop, times, values, infl) {
        for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
        ease(prop, infl);
    }
    function P(l, name) { return l.property("ADBE Transform Group").property(name); }
    function pos(l) { return l.property("ADBE Transform Group").property("ADBE Position"); }
    function opa(l) { return l.property("ADBE Transform Group").property("ADBE Opacity"); }
    function scl(l) { return l.property("ADBE Transform Group").property("ADBE Scale"); }
    function fx(l, match) { return l.property("ADBE Effect Parade").addProperty(match); }

    function fadeIn(l, t, d) { kf(opa(l), [t, t + (d || 0.4)], [0, 100], 60); }
    function fadeOut(l, t, d) { kf(opa(l), [t, t + (d || 0.4)], [100, 0], 60); }
    function appear(l, t, d, from, to) {  // fades in while sliding from `from` to `to` (both [x, y])
        kf(opa(l), [t, t + (d || 0.5)], [0, 100], 60);
        kf(pos(l), [t, t + (d || 0.5)], [from, to], 80);
    }

    function text(c, str, o) {
        var l = c.layers.addText(str);
        var tp = l.property("Source Text");
        var td = tp.value;
        td.resetCharStyle();
        td.font = o.font || F_BIG;
        td.fontSize = o.size || 100;
        td.applyFill = o.outline ? false : true;
        td.fillColor = o.color || C.white;
        td.applyStroke = o.outline ? true : false;
        if (o.outline) { td.strokeColor = o.color || C.white; td.strokeWidth = o.outline; }
        td.justification = o.just || ParagraphJustification.CENTER_JUSTIFY;
        td.tracking = o.tracking || 0;
        if (o.leading) { td.autoLeading = false; td.leading = o.leading; }
        tp.setValue(td);
        pos(l).setValue(o.pos || [W / 2, H / 2]);
        if (o.name) l.name = o.name;
        if (o.opacity !== undefined) opa(l).setValue(o.opacity);
        return l;
    }

    function solid(c, name, color, w, h, dur) { return c.layers.addSolid(color, name, w || W, h || H, 1, dur || c.duration); }

    function rect(c, name, w, h, color, p, leftAligned, strokeColor, strokeW) {
        var l = c.layers.addShape();
        l.name = name;
        var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue([w, h]);
        if (leftAligned) r.property("ADBE Vector Rect Position").setValue([w / 2, 0]);
        if (color) {
            var f = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
            f.property("ADBE Vector Fill Color").setValue(color);
        }
        if (strokeColor) {
            var s = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
            s.property("ADBE Vector Stroke Color").setValue(strokeColor);
            s.property("ADBE Vector Stroke Width").setValue(strokeW || 2);
        }
        pos(l).setValue(p);
        return l;
    }

    function addGrid(c, name, w, h, box, border, opacity, isFloor, z) {
        var l = solid(c, name, C.black, w, h);
        var g = fx(l, "ADBE Grid");
        g.property("ADBE Grid-0002").setValue(2);            // size from: width and height
        g.property("ADBE Grid-0004").setValue(box);
        g.property("ADBE Grid-0005").setValue(box);
        g.property("ADBE Grid-0006").setValue(border);
        g.property("ADBE Grid-0012").setValue([1, 1, 1, 1]);
        l.blendingMode = BlendingMode.SCREEN;
        opa(l).setValue(opacity);
        l.threeDLayer = true;
        if (isFloor) {
            l.property("ADBE Transform Group").property("ADBE Orientation").setValue([90, 0, 0]);
            pos(l).setValue([W / 2, 1000, z || 1500]);
        } else {
            pos(l).setValue([W / 2, H / 2, z || 900]);
        }
        return l;
    }

    function addCamera(c, start, end, dur) {
        var cam = c.layers.addCamera("Cam", [W / 2, H / 2]);
        cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(1777.78);
        var p = cam.property("ADBE Transform Group").property("ADBE Position");
        p.setValue(start);
        kf(p, [0, dur], [start, end], 50);
        return cam;
    }

    function fog(c, name, tint, op, scale, speed, seed, blur, dur) {
        var s = solid(c, name, C.white, W, H, dur);
        var f = fx(s, "ADBE Fractal Noise");
        f.property("ADBE Fractal Noise-0004").setValue(165);
        f.property("ADBE Fractal Noise-0005").setValue(-34);
        f.property("ADBE Fractal Noise-0010").setValue(scale);
        f.property("ADBE Fractal Noise-0015").setValue(5);
        f.property("ADBE Fractal Noise-0027").setValue(seed);
        f.property("ADBE Fractal Noise-0023").expression = "time*" + speed;
        f.property("ADBE Fractal Noise-0013").expression = "[960 + time*" + (speed * 0.9) + ", 540 + time*" + (speed * 0.3) + "]";
        var t = fx(s, "ADBE Tint");
        t.property("ADBE Tint-0001").setValue([0, 0, 0, 1]);
        t.property("ADBE Tint-0002").setValue([tint[0], tint[1], tint[2], 1]);
        if (blur) fx(s, "ADBE Gaussian Blur 2").property("ADBE Gaussian Blur 2-0001").setValue(blur);
        s.blendingMode = BlendingMode.SCREEN;
        opa(s).setValue(op);
        return s;
    }

    function glow(l, thr, rad, inten) {
        var g = fx(l, "ADBE Glo2");
        g.property("ADBE Glo2-0002").setValue(thr);
        g.property("ADBE Glo2-0003").setValue(rad);
        g.property("ADBE Glo2-0004").setValue(inten);
        return g;
    }

    function radialGlow(c, name, center, radius, color, op, blend) {
        var l = solid(c, name, C.black);
        var r = fx(l, "ADBE Ramp");
        r.property("ADBE Ramp-0001").setValue(center);
        r.property("ADBE Ramp-0002").setValue([color[0], color[1], color[2], 1]);
        r.property("ADBE Ramp-0003").setValue([center[0] + radius, center[1]]);
        r.property("ADBE Ramp-0004").setValue([0, 0, 0, 1]);
        r.property("ADBE Ramp-0005").setValue(2);
        l.blendingMode = blend || BlendingMode.SCREEN;
        opa(l).setValue(op);
        return l;
    }

    function imp(path) {
        var f = new File(path);
        if (!f.exists) { log("MISSING " + path); return null; }
        return app.project.importFile(new ImportOptions(f));
    }

    var proj = app.project;
    // clear out a previous run of this script
    for (var oi = proj.numItems; oi >= 1; oi--) { try { proj.item(oi).remove(); } catch (eo) {} }

    var imgCut = imp(foot + "/portrait/cutout.png");
    var imgEdges = imp(foot + "/portrait/edges.png");
    var imgDots = imp(foot + "/portrait/dots.png");
    var shots = {
        oath: imp(foot + "/screens/unbroken-oath.png"), abduct: imp(foot + "/screens/the-abduction.png"),
        warp: imp(foot + "/screens/warp.png"), jump: imp(foot + "/screens/super-jump.png")
    };
    var music = imp(foot + "/music_dark.wav");

    var scenes = {};
    function newScene(name, dur) { var c = proj.items.addComp(name, W, H, 1, dur, FPS); scenes[name] = c; return c; }

    // ================================================================ S0 loading (0-4)
    try {
        log("S0 start");
        var c0 = newScene("S0 Loading", 4.6);
        addGrid(c0, "grid", 3000, 3000, 120, 2, 9, true, 1800);
        addCamera(c0, [W / 2, H / 2 - 120, -1777.78], [W / 2, H / 2 - 120, -1500], 4.6);
        var load = text(c0, "LOADING", { font: F_UI, size: 40, tracking: 450, pos: [W / 2, 548] });
        opa(load).expression = "Math.random() < 0.06 && time > 0.4 ? 30 : 100";
        var frameBar = rect(c0, "barframe", 440, 6, null, [W / 2, 600], false, C.white, 2);
        var bar = rect(c0, "bar", 436, 2, C.white, [W / 2 - 218, 600], true);
        kf(scl(bar), [0.4, 3.5], [[0, 100], [100, 100]], 55);
        var pct = text(c0, "0%", { font: F_MONO, size: 28, tracking: 100, pos: [W / 2, 668] });
        pct.property("Source Text").expression = "Math.round(linear(time, 0.4, 3.5, 0, 100)) + \"%\"";
        var tl = text(c0, "SAMRAH NIAZI", { font: F_MONO, size: 22, tracking: 200, just: ParagraphJustification.LEFT_JUSTIFY, pos: [96, 96] });
        var tr = text(c0, "PORTFOLIO - 2026", { font: F_MONO, size: 22, tracking: 200, just: ParagraphJustification.RIGHT_JUSTIFY, pos: [W - 96, 96] });
        var bl = text(c0, "GAME DEVELOPER / AR / VR", { font: F_MONO, size: 22, tracking: 200, just: ParagraphJustification.LEFT_JUSTIFY, pos: [96, H - 80] });
        var br = text(c0, "UNITY / UNREAL / BLENDER", { font: F_MONO, size: 22, tracking: 200, just: ParagraphJustification.RIGHT_JUSTIFY, pos: [W - 96, H - 80] });
        var cornerL = [tl, tr, bl, br];
        for (var ci = 0; ci < cornerL.length; ci++) fadeIn(cornerL[ci], 0.2 + ci * 0.15, 0.4);
        fadeOut(load, 3.8, 0.25); fadeOut(frameBar, 3.8, 0.25); fadeOut(bar, 3.8, 0.25); fadeOut(pct, 3.8, 0.25);
    } catch (errS0) { log("S0 FAILED: " + String(errS0) + " line " + errS0.line); }

    // ================================================================ S1 portrait (4-12): grid, line art, dots, then the real photo
    try {
        log("S1 start");
        var c1 = newScene("S1 Portrait", 8.5);
        var cam1 = addCamera(c1, [W / 2 - 160, H / 2 - 60, -1900], [W / 2 + 160, H / 2 - 40, -1620], 8.5);
        addGrid(c1, "wall grid", 4200, 2600, 110, 2, 30, false, 950);
        addGrid(c1, "floor grid", 6000, 6000, 140, 3, 55, true, 1500);
        radialGlow(c1, "maroon glow", [W / 2, 760], 1000, [0.5, 0.12, 0.2], 80);
        var n1 = text(c1, "SAMRAH", { font: F_BIG, size: 500, color: [0.95, 0.95, 0.97], tracking: -6, pos: [W / 2, 520], opacity: 0 });
        var n2 = text(c1, "NIAZI", { font: F_BIG, size: 500, color: [0.95, 0.95, 0.97], tracking: -6, pos: [W / 2, 940], opacity: 0 });
        kf(opa(n1), [1.0, 1.9], [0, 88], 60); kf(opa(n2), [1.2, 2.1], [0, 88], 60);
        kf(pos(n1), [1.0, 2.2], [[W / 2, 570], [W / 2, 520]], 80); kf(pos(n2), [1.2, 2.4], [[W / 2, 990], [W / 2, 940]], 80);

        function portraitLayer(item, name) {
            var l = c1.layers.add(item);
            l.name = name;
            P(l, "ADBE Anchor Point").setValue([768, 2092]);
            pos(l).setValue([W / 2, H + 12]);
            scl(l).setValue([60, 60]);
            return l;
        }
        var edges = portraitLayer(imgEdges, "line art");
        var lw = fx(edges, "ADBE Linear Wipe");
        lw.property("ADBE Linear Wipe-0002").setValue(0);
        lw.property("ADBE Linear Wipe-0003").setValue(40);
        kf(lw.property("ADBE Linear Wipe-0001"), [0.6, 2.8], [100, 0], 45);
        glow(edges, 40, 40, 1.4);
        kf(opa(edges), [3.4, 4.6], [100, 0], 60);

        var dots = portraitLayer(imgDots, "dot matrix");
        kf(opa(dots), [1.7, 2.7, 3.6, 4.8], [0, 100, 100, 0], 60);
        glow(dots, 120, 30, 1.0);
        var td = fx(dots, "ADBE Turbulent Displace");
        td.property("ADBE Turbulent Displace-0002").expression = "time < 4.8 ? wiggle(10, 12)[0] * 0.5 + 6 : 0";
        td.property("ADBE Turbulent Displace-0003").setValue(60);

        var photo = portraitLayer(imgCut, "photo");
        kf(opa(photo), [3.3, 3.5, 3.62, 3.8, 4.8], [0, 100, 30, 100, 100], 40);
        kf(scl(photo), [3.3, 8.5], [[60, 60], [64, 64]], 40);
        var tdp = fx(photo, "ADBE Turbulent Displace");
        tdp.property("ADBE Turbulent Displace-0002").expression = "time > 3.2 && time < 4.2 ? wiggle(14, 40)[0] * 0.6 + 8 : 0";
        tdp.property("ADBE Turbulent Displace-0003").setValue(80);
        photo.moveToBeginning();
        // keep the line art and dots above the photo so the reveal reads, then the photo takes over
        edges.moveToBeginning(); dots.moveToBeginning();
        // the photo's own glow rim
        var rimGlow = fx(photo, "ADBE Glo2");
        rimGlow.property("ADBE Glo2-0002").setValue(220); rimGlow.property("ADBE Glo2-0003").setValue(60); rimGlow.property("ADBE Glo2-0004").setValue(0.5);

        var h1 = text(c1, "GAME DEVELOPER", { font: F_MONO, size: 28, tracking: 300, just: ParagraphJustification.LEFT_JUSTIFY, pos: [150, 540] });
        var h2 = text(c1, "AR / VR  /  UNITY  /  UNREAL", { font: F_MONO, size: 28, tracking: 300, just: ParagraphJustification.RIGHT_JUSTIFY, pos: [W - 150, 540] });
        var h3 = text(c1, "[ 001 ]  PORTFOLIO - 2026", { font: F_MONO, size: 22, tracking: 300, pos: [W / 2, H - 56] });
        appear(h1, 4.6, 0.6, [110, 540], [150, 540]); appear(h2, 4.8, 0.6, [W - 110, 540], [W - 150, 540]); fadeIn(h3, 5.2, 0.6);
        var hl1 = rect(c1, "hud line l", 220, 2, C.white, [150, 580], true);
        var hl2 = rect(c1, "hud line r", 220, 2, C.white, [W - 370, 580], true);
        kf(scl(hl1), [4.8, 5.6], [[0, 100], [100, 100]], 60); kf(scl(hl2), [5.0, 5.8], [[0, 100], [100, 100]], 60);
    } catch (errS1) { log("S1 FAILED: " + String(errS1) + " line " + errS1.line); }

    // ================================================================ S2 particle title (12-18)
    try {
        log("S2 start");
        var c2 = newScene("S2 Particles", 6.5);
        addGrid(c2, "floor grid", 6000, 6000, 160, 3, 40, true, 1400);
        addCamera(c2, [W / 2, H / 2 - 150, -1900], [W / 2, H / 2 - 110, -1650], 6.5);
        var tc = proj.items.addComp("PortfolioWord", W, H, 1, 6.5, FPS);
        var word = text(tc, "PORTFOLIO", { font: F_BIG, size: 330, color: C.white, tracking: 6, pos: [W / 2, 640] });
        var ball = c2.layers.add(tc);
        ball.name = "particle word";
        var ba = fx(ball, "CC Ball Action");
        ba.property("CC Ball Action-0006").setValue(6);
        ba.property("CC Ball Action-0007").setValue(62);
        kf(ba.property("CC Ball Action-0001"), [0.1, 2.2, 5.6, 6.4], [1000, 0, 0, 260], 55);
        kf(ba.property("CC Ball Action-0003"), [0.1, 2.2], [160, 0], 55);
        glow(ball, 90, 55, 1.4);
        var refl = c2.layers.add(tc);
        refl.name = "reflection";
        var rb = fx(refl, "CC Ball Action");
        rb.property("CC Ball Action-0006").setValue(6);
        rb.property("CC Ball Action-0007").setValue(62);
        kf(rb.property("CC Ball Action-0001"), [0.1, 2.2, 5.6, 6.4], [1000, 0, 0, 260], 55);
        scl(refl).setValue([100, -100]);
        P(refl, "ADBE Anchor Point").setValue([W / 2, 640]);
        pos(refl).setValue([W / 2, 648]);
        opa(refl).setValue(20);
        fx(refl, "ADBE Gaussian Blur 2").property("ADBE Gaussian Blur 2-0001").setValue(9);
        var sub = text(c2, "GAME DEVELOPER  /  AR / VR  /  GAMEPLAY PROGRAMMER", { font: F_UI, size: 36, tracking: 260, color: C.silver, pos: [W / 2, 830] });
        appear(sub, 2.4, 0.8, [W / 2, 860], [W / 2, 830]);
        var ttl = text(c2, "Samrah Niazi", { font: F_SERIF, size: 64, color: C.white, just: ParagraphJustification.LEFT_JUSTIFY, pos: [150, 200] });
        var ttl2 = text(c2, "Unity, Unreal, Blender, Meta Quest", { font: F_UI, size: 26, tracking: 120, color: C.silver, just: ParagraphJustification.LEFT_JUSTIFY, pos: [152, 246] });
        appear(ttl, 3.0, 0.8, [150, 230], [150, 200]); appear(ttl2, 3.3, 0.8, [152, 276], [152, 246]);
        var ul = rect(c2, "underline", 300, 2, C.rose, [152, 268], true);
        kf(scl(ul), [3.4, 4.3], [[0, 100], [100, 100]], 60);
        var tag = text(c2, "[ 002 ]", { font: F_MONO, size: 24, tracking: 200, just: ParagraphJustification.RIGHT_JUSTIFY, pos: [W - 120, 200] });
        fadeIn(tag, 3.4, 0.6);
    } catch (errS2) { log("S2 FAILED: " + String(errS2) + " line " + errS2.line); }

    // ================================================================ S3 skills globe (18-26)
    try {
        log("S3 start");
        var c3 = newScene("S3 Toolkit", 8.5);
        var cam3 = addCamera(c3, [W / 2 + 80, H / 2, -1900], [W / 2 - 40, H / 2 - 30, -1700], 8.5);
        addGrid(c3, "floor grid", 6000, 6000, 160, 3, 28, true, 1300);
        radialGlow(c3, "glow", [1230, 560], 760, [0.42, 0.1, 0.17], 70);
        var gl = solid(c3, "globe grid", C.black, 1200, 1200);
        var gg = fx(gl, "ADBE Grid");
        gg.property("ADBE Grid-0002").setValue(2);
        gg.property("ADBE Grid-0004").setValue(70); gg.property("ADBE Grid-0005").setValue(70);
        gg.property("ADBE Grid-0006").setValue(3);
        var sp = fx(gl, "CC Sphere");
        sp.property("CC Sphere-0006").setValue(380);
        sp.property("CC Sphere-0007").setValue([600, 600]);
        sp.property("CC Sphere-0010").setValue(60);
        kf(sp.property("CC Sphere-0003"), [0, 8.5], [0, 360], 0.1 + 20);
        gl.blendingMode = BlendingMode.SCREEN;
        pos(gl).setValue([1230, 560]);
        opa(gl).setValue(70);
        glow(gl, 60, 30, 0.8);
        var words = ["Unity", "Unreal Engine", "C#", "C++", "Blender", "Vuforia", "XR Toolkit", "Meta Quest", "AR / VR", "Gameplay", "Level Design", "Python", "Git", "After Effects"];
        var golden = Math.PI * (3 - Math.sqrt(5));
        for (var wi = 0; wi < words.length; wi++) {
            var yy = 1 - (wi / (words.length - 1)) * 2;
            var rr = Math.sqrt(1 - yy * yy);
            var aa = wi * golden;
            var wl = text(c3, words[wi], { font: F_UI, size: 54, tracking: 60, color: (wi % 3 === 0) ? C.rose : C.white, pos: [0, 0] });
            wl.threeDLayer = true;
            pos(wl).expression = "var a = " + aa + " + time * 0.74; [1230 + Math.cos(a) * " + (rr * 470) + ", 560 + " + (yy * 470) + ", Math.sin(a) * " + (rr * 470) + "]";
            wl.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
            kf(opa(wl), [0.8 + wi * 0.12, 1.4 + wi * 0.12], [0, 100], 60);
        }
        var t3 = text(c3, "The Toolkit", { font: F_SERIF, size: 170, just: ParagraphJustification.LEFT_JUSTIFY, pos: [140, 360] });
        appear(t3, 0.3, 0.9, [140, 400], [140, 360]);
        var t3b = text(c3, "SKILLS & TECHNOLOGIES", { font: F_MONO, size: 26, tracking: 300, color: C.rose, just: ParagraphJustification.LEFT_JUSTIFY, pos: [146, 230] });
        fadeIn(t3b, 0.6, 0.6);
        var t3c = text(c3, "AR/VR & computer vision\nGame development\nHCI & UI/UX\nProgramming\nTools", { font: F_UI, size: 34, tracking: 20, color: C.silver, just: ParagraphJustification.LEFT_JUSTIFY, leading: 56, pos: [146, 520] });
        appear(t3c, 1.6, 1.0, [146, 550], [146, 520]);
        var t3d = text(c3, "[ 003 ]", { font: F_MONO, size: 24, tracking: 200, just: ParagraphJustification.LEFT_JUSTIFY, pos: [146, H - 90] });
        fadeIn(t3d, 1.0, 0.6);
    } catch (errS3) { log("S3 FAILED: " + String(errS3) + " line " + errS3.line); }

    // ================================================================ S4 numbers (26-32)
    try {
        log("S4 start");
        var c4 = newScene("S4 Numbers", 6.5);
        addCamera(c4, [W / 2, H / 2 - 40, -1777.78], [W / 2, H / 2 - 40, -1640], 6.5);
        addGrid(c4, "floor grid", 6000, 6000, 150, 3, 50, true, 1500);
        var t4 = text(c4, "By the Numbers", { font: F_SERIF, size: 110, just: ParagraphJustification.LEFT_JUSTIFY, pos: [140, 300] });
        appear(t4, 0.2, 0.9, [140, 340], [140, 300]);
        var t4b = text(c4, "[ 004 ]", { font: F_MONO, size: 24, tracking: 200, color: C.rose, just: ParagraphJustification.LEFT_JUSTIFY, pos: [146, 190] });
        fadeIn(t4b, 0.5, 0.6);
        var vals = [15, 11, 4, 2], labs = ["PROJECTS", "GAMES", "CERTIFICATES", "AWARDS"];
        var xs = [1140, 1350, 1560, 1770], baseY = 900, unit = 36;
        for (var bi = 0; bi < 4; bi++) {
            var hgt = vals[bi] * unit;
            var barL = rect(c4, "BAR" + bi, 150, hgt, [0.55, 0.14, 0.24], [xs[bi], baseY], false);
            // anchor the scale at the bottom: shift the rectangle so its bottom edge sits on the layer origin
            barL.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Position").setValue([0, -hgt / 2]);
            kf(scl(barL), [0.8 + bi * 0.25, 2.6 + bi * 0.25], [[100, 0], [100, 100]], 45);
            var capL = rect(c4, "CAP" + bi, 150, 8, C.rose, [xs[bi], baseY], false);
            capL.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Position").setValue([0, -4]);
            pos(capL).expression = "var s = thisComp.layer(\"BAR" + bi + "\").transform.scale[1] / 100; [" + xs[bi] + ", " + baseY + " - " + hgt + " * s]";
            glow(capL, 200, 40, 1.4);
            var numT = text(c4, "0", { font: F_BIG, size: 150, color: C.white, pos: [xs[bi], 600] });
            numT.property("Source Text").expression = "Math.round(linear(time, " + (0.9 + bi * 0.25) + ", " + (2.6 + bi * 0.25) + ", 0, " + vals[bi] + "))";
            pos(numT).expression = "var s = thisComp.layer(\"BAR" + bi + "\").transform.scale[1] / 100; [" + xs[bi] + ", " + baseY + " - " + hgt + " * s - 30]";
            var labT = text(c4, labs[bi], { font: F_MONO, size: 22, tracking: 100, color: C.silver, pos: [xs[bi], baseY + 56] });
            fadeIn(labT, 1.2 + bi * 0.25, 0.5);
        }
        var floorLine = rect(c4, "floor line", 900, 2, C.white, [1000, baseY], true);
        kf(scl(floorLine), [0.2, 1.2], [[0, 100], [100, 100]], 60);
    } catch (errS4) { log("S4 FAILED: " + String(errS4) + " line " + errS4.line); }

    // ================================================================ S5 work (32-36): a 3D gallery of the games
    try {
        log("S5 start");
        var c5 = newScene("S5 Work", 4.6);
        var cam5 = addCamera(c5, [W / 2 + 140, H / 2 - 20, -1777.78], [W / 2 - 100, H / 2 + 10, -420], 4.6);
        addGrid(c5, "floor grid", 6000, 12000, 160, 3, 45, true, 3000);
        var order = [shots.oath, shots.abduct, shots.warp, shots.jump, shots.oath, shots.warp];
        var names = ["THE UNBROKEN OATH", "THE ABDUCTION", "WARP: FRACTURED REALITY", "SUPER JUMP", "THE UNBROKEN OATH", "WARP: FRACTURED REALITY"];
        var kinds = ["UNITY 3D / FPS", "UNITY 3D / HORROR", "UNITY 6 / CO-OP", "UNITY 2D / PLATFORMER", "UNITY 3D / FPS", "UNITY 6 / CO-OP"];
        for (var si = 0; si < 6; si++) {
            if (!order[si]) continue;
            var side = si % 2 === 0 ? -1 : 1;
            var card = c5.layers.add(order[si]);
            card.name = "card" + si;
            card.threeDLayer = true;
            var sw = order[si].width;
            var k = 820 / sw;
            scl(card).setValue([k * 100, k * 100, 100]);
            pos(card).setValue([W / 2 + side * 560, H / 2 - 40 + (si % 3 - 1) * 60, si * 620]);
            card.property("ADBE Transform Group").property("ADBE Orientation").setValue([0, -side * 24, 0]);
            var ds = fx(card, "ADBE Drop Shadow");
            ds.property("ADBE Drop Shadow-0002").setValue(120); ds.property("ADBE Drop Shadow-0004").setValue(60);
            glow(card, 230, 30, 0.35);
        }
        // one caption at a time, bottom left
        var capNames = [0, 1, 2, 3];
        for (var ci5 = 0; ci5 < 4; ci5++) {
            var capA = text(c5, names[ci5], { font: F_BIG, size: 92, just: ParagraphJustification.LEFT_JUSTIFY, pos: [120, 960], opacity: 0 });
            var capB = text(c5, kinds[ci5], { font: F_MONO, size: 28, tracking: 240, color: C.rose, just: ParagraphJustification.LEFT_JUSTIFY, pos: [124, 1010], opacity: 0 });
            var t0c = 0.3 + ci5 * 1.0;
            kf(opa(capA), [t0c, t0c + 0.25, t0c + 0.8, t0c + 1.0], [0, 100, 100, 0], 50);
            kf(opa(capB), [t0c + 0.1, t0c + 0.35, t0c + 0.8, t0c + 1.0], [0, 100, 100, 0], 50);
            kf(pos(capA), [t0c, t0c + 0.3], [[80, 960], [120, 960]], 80);
        }
        var t5 = text(c5, "SELECTED WORK", { font: F_BIG, size: 150, pos: [W / 2, 190], opacity: 0 });
        kf(opa(t5), [0.1, 0.5, 2.1, 2.7], [0, 100, 100, 0], 60);
        var t5b = text(c5, "[ 005 ]", { font: F_MONO, size: 24, tracking: 200, pos: [W / 2, 250], opacity: 0 });
        kf(opa(t5b), [0.3, 0.7, 2.1, 2.7], [0, 100, 100, 0], 60);
    } catch (errS5) { log("S5 FAILED: " + String(errS5) + " line " + errS5.line); }

    // ================================================================ S6 paper beat (36-38): a white page with giant black type
    try {
        log("S6 start");
        var c6 = newScene("S6 Paper", 2.5);
        solid(c6, "paper", C.paper);
        var bg6 = c6.layer("paper");
        var pt1 = text(c6, "BUILDING", { font: F_BIG, size: 470, color: [0.04, 0.03, 0.04], just: ParagraphJustification.LEFT_JUSTIFY, tracking: -6, pos: [120, 560] });
        var pt2 = text(c6, "WORLDS.", { font: F_BIG, size: 470, color: C.deep, just: ParagraphJustification.LEFT_JUSTIFY, tracking: -6, pos: [120, 1010] });
        appear(pt1, 0.0, 0.3, [-120, 560], [120, 560]);
        appear(pt2, 0.05, 0.3, [-120, 1010], [120, 1010]);
        var pt3 = text(c6, "GAME DEVELOPMENT  /  AR & VR  /  GAMEPLAY", { font: F_MONO, size: 26, tracking: 220, color: [0.04, 0.03, 0.04], just: ParagraphJustification.LEFT_JUSTIFY, pos: [126, 120] });
        fadeIn(pt3, 0.4, 0.4);
        var dotsW = c6.layers.add(imgDots);
        P(dotsW, "ADBE Anchor Point").setValue([768, 2092]);
        scl(dotsW).setValue([48, 48]);
        pos(dotsW).setValue([1520, H + 10]);
        var fl = fx(dotsW, "ADBE Fill");
        fl.property("ADBE Fill-0002").setValue([0.04, 0.03, 0.04, 1]);
        kf(opa(dotsW), [0.3, 0.8], [0, 100], 60);
        kf(pos(dotsW), [0.3, 1.2], [[1600, H + 10], [1520, H + 10]], 70);
    } catch (errS6) { log("S6 FAILED: " + String(errS6) + " line " + errS6.line); }

    // ================================================================ S7 recognition (38-42)
    try {
        log("S7 start");
        var c7 = newScene("S7 Awards", 4.6);
        addCamera(c7, [W / 2, H / 2, -1900], [W / 2, H / 2, -1700], 4.6);
        addGrid(c7, "floor grid", 6000, 6000, 160, 3, 30, true, 1300);
        radialGlow(c7, "glow", [W / 2, 600], 900, [0.45, 0.1, 0.17], 65);
        var t7 = text(c7, "Recognition", { font: F_SERIF, size: 130, just: ParagraphJustification.LEFT_JUSTIFY, pos: [140, 200] });
        appear(t7, 0.1, 0.8, [140, 240], [140, 200]);
        var t7b = text(c7, "[ 006 ]", { font: F_MONO, size: 24, tracking: 200, color: C.rose, just: ParagraphJustification.RIGHT_JUSTIFY, pos: [W - 140, 200] });
        fadeIn(t7b, 0.4, 0.5);
        var specs = [
            { x: W / 2 - 400, big: "WINNER", mid: "Best FYDP", small: "NEDUET FYDP EXHIBITION / TECHFEST'26", rot: 9 },
            { x: W / 2 + 400, big: "RUNNER-UP", mid: "GameCon'26", small: "THE UNBROKEN OATH / TECHFEST'26", rot: -9 }
        ];
        for (var ai = 0; ai < 2; ai++) {
            var sp7 = specs[ai];
            var card7 = rect(c7, "frame" + ai, 700, 560, [0.06, 0.04, 0.07], [sp7.x, 600], false, C.white, 3);
            opa(card7).setValue(0);
            kf(opa(card7), [0.4 + ai * 0.3, 1.0 + ai * 0.3], [0, 88], 60);
            card7.threeDLayer = true;
            card7.property("ADBE Transform Group").property("ADBE Orientation").setValue([0, sp7.rot, 0]);
            pos(card7).setValue([sp7.x, 600, 0]);
            glow(card7, 200, 30, 0.4);
            var bigT = text(c7, sp7.big, { font: F_BIG, size: ai === 0 ? 190 : 150, pos: [sp7.x, 650] });
            var midT = text(c7, sp7.mid, { font: F_SERIF, size: 80, color: C.rose, pos: [sp7.x, 740] });
            var smT = text(c7, sp7.small, { font: F_MONO, size: 21, tracking: 120, color: C.silver, pos: [sp7.x, 830] });
            var tt = [bigT, midT, smT];
            for (var ti = 0; ti < 3; ti++) {
                tt[ti].threeDLayer = true;
                tt[ti].property("ADBE Transform Group").property("ADBE Orientation").setValue([0, sp7.rot, 0]);
                var pp = pos(tt[ti]).value;
                pos(tt[ti]).setValue([pp[0], pp[1], 0]);
                kf(opa(tt[ti]), [0.8 + ai * 0.3 + ti * 0.15, 1.3 + ai * 0.3 + ti * 0.15], [0, 100], 60);
            }
        }
    } catch (errS7) { log("S7 FAILED: " + String(errS7) + " line " + errS7.line); }

    // ================================================================ S8 contact (42-48): red neon, "let's talk"
    try {
        log("S8 start");
        var c8 = newScene("S8 Contact", 6.5);
        var redbg = radialGlow(c8, "red glow", [W * 0.4, H * 0.55], 1100, [0.62, 0.07, 0.1], 100, BlendingMode.NORMAL);
        fog(c8, "red fog", [1, 0.2, 0.22], 55, 450, 40, 31, 10, 6.5);
        fog(c8, "red fog 2", [0.9, 0.35, 0.3], 30, 800, 20, 9, 20, 6.5);
        var dots8 = c8.layers.add(imgDots);
        P(dots8, "ADBE Anchor Point").setValue([768, 2092]);
        scl(dots8).setValue([50, 50]);
        pos(dots8).setValue([1500, H + 20]);
        var tn = fx(dots8, "ADBE Tint");
        tn.property("ADBE Tint-0001").setValue([0, 0, 0, 1]);
        tn.property("ADBE Tint-0002").setValue([1, 0.55, 0.58, 1]);
        opa(dots8).setValue(0);
        kf(opa(dots8), [0.5, 1.6], [0, 70], 60);
        glow(dots8, 100, 30, 0.8);
        var l1 = text(c8, "LET'S TALK", { font: F_BIG, size: 400, color: C.white, just: ParagraphJustification.LEFT_JUSTIFY, tracking: -6, pos: [110, 520] });
        var l2 = text(c8, "ABOUT YOUR NEXT PROJECT", { font: F_BIG, size: 104, color: [1, 0.78, 0.8], just: ParagraphJustification.LEFT_JUSTIFY, pos: [118, 650] });
        appear(l1, 0.2, 0.6, [-300, 520], [110, 520]);
        appear(l2, 0.5, 0.6, [-300, 650], [118, 650]);
        glow(l1, 200, 50, 0.6);
        var mail = text(c8, "samrahniazi677@gmail.com", { font: F_UI, size: 54, tracking: 60, color: C.white, just: ParagraphJustification.LEFT_JUSTIFY, pos: [122, 800] });
        appear(mail, 1.3, 0.6, [122, 830], [122, 800]);
        var web = text(c8, "github.com/samrah-niazi   |   samrah-niazi.itch.io   |   LinkedIn: Samrah Niazi", { font: F_MONO, size: 25, tracking: 80, color: [1, 0.82, 0.84], just: ParagraphJustification.LEFT_JUSTIFY, pos: [124, 880] });
        fadeIn(web, 1.8, 0.6);
        var ml = rect(c8, "mail line", 760, 3, C.white, [122, 830], true);
        kf(scl(ml), [1.5, 2.4], [[0, 100], [100, 100]], 60);
        var tg = text(c8, "[ 007 ]  THANK YOU", { font: F_MONO, size: 24, tracking: 300, just: ParagraphJustification.LEFT_JUSTIFY, pos: [124, 140] });
        fadeIn(tg, 0.9, 0.6);
    } catch (errS8) { log("S8 FAILED: " + String(errS8) + " line " + errS8.line); }

    // ================================================================ main composition
    var main = proj.items.addComp("Samrah Promo Dark", W, H, 1, DUR, FPS);
    main.bgColor = C.ink;
    try {
        var order = [["S0 Loading", 0], ["S1 Portrait", 4], ["S2 Particles", 12], ["S3 Toolkit", 18], ["S4 Numbers", 26], ["S5 Work", 32], ["S6 Paper", 36], ["S7 Awards", 38], ["S8 Contact", 42]];
        var cuts = [4, 12, 18, 26, 32, 36, 38, 42];
        // the scene layers, in time order (later scenes sit on top, so a scene that overlaps the next one is covered)
        for (var oi2 = 0; oi2 < order.length; oi2++) {
            var item = scenes[order[oi2][0]];
            var sl = main.layers.add(item);
            sl.startTime = order[oi2][1];
            var endT = (oi2 + 1 < order.length) ? order[oi2 + 1][1] : DUR;
            sl.outPoint = endT;
        }
        // underneath: black, then two layers of drifting mist
        var mist2 = fog(main, "mist 2", [0.5, 0.58, 0.7], 16, 700, 14, 5, 25, DUR);
        var mist1 = fog(main, "mist 1", C.maroon, 40, 480, 22, 2, 14, DUR);
        var blk = solid(main, "black", C.ink, W, H, DUR);
        mist2.moveToEnd(); mist1.moveToEnd(); blk.moveToEnd();
        // the white paper scene must cover the mist (it is opaque), and the contact scene has its own red mist
        // overlays: vignette, grain, flashes on every cut, fade to black at the end
        var vg = radialGlow(main, "vignette", [W / 2, H / 2], 1700, [1, 1, 1], 60, BlendingMode.MULTIPLY);
        var gr = solid(main, "grain", [0.5, 0.5, 0.5], W, H, DUR);
        var nz = fx(gr, "ADBE Noise");
        nz.property("ADBE Noise-0001").setValue(22);
        gr.blendingMode = BlendingMode.OVERLAY;
        opa(gr).setValue(16);
        for (var fi = 0; fi < cuts.length; fi++) {
            var fl2 = solid(main, "flash " + (fi + 1), C.white, W, H, DUR);
            opa(fl2).setValue(0);
            var ct = cuts[fi];
            kf(opa(fl2), [ct - 0.06, ct, ct + 0.14], [0, (ct === 36 ? 0 : 55), 0], 20);
            fl2.moveToBeginning();
        }
        var endBlack = solid(main, "fade out", C.black, W, H, DUR);
        kf(opa(endBlack), [DUR - 1.6, DUR - 0.2], [0, 100], 60);
        endBlack.moveToBeginning();
        // a quick fade in from black at the very start
        var startBlack = solid(main, "fade in", C.black, W, H, DUR);
        kf(opa(startBlack), [0, 0.7], [100, 0], 60);
        startBlack.moveToBeginning();
        // sound
        if (music) {
            var au = main.layers.add(music);
            au.moveToEnd();
        }
    } catch (errMain) { log("MAIN FAILED: " + String(errMain) + " line " + errMain.line); }

    main.openInViewer();
    var out = new File(base.fsName + "/samrah_promo_dark.aep");
    app.project.save(out);
    log("SAVED " + out.fsName);
    app.quit();
})();
