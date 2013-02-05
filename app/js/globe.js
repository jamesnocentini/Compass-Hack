var engine, camera, globeContainer, globe, aspect;
var maptemplate;

window.onload = function() {
    maptemplate = new Image();
    maptemplate.onload = function() {
        setup();
    }
    maptemplate.src = mapBase64;
}

setup = function() {
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);

    engine = new SQR.Squareroot(document.getElementById('canvas'));

    engine.setSize(window.innerWidth, window.innerHeight);

    engine.setProjection(1000);

    camera = new SQR.Transform();
    camera.position.z = 100;
    engine.add(camera);

    globeContainer = new SQR.Transform();
    globeContainer.useQuaternion = true;

    globe = new SQR.Transform();
    globe.renderer = new SQR.Segment(2);
    globe.renderer.culling = true;
    globe.geometry = new SQR.Geometry();

    var innerRadius = 40;
    var outerRadius = 45;
    var radiusVariance = 3;
    var minLength = 1;

    var maxSegmentsX = 50;
    var segmentsY = 30;

    var phiStart = 0;
    var phiLength = SQR.twoPI;
    var thetaStart = 0;
    var thetaLength = Math.PI;

    var x, y;

    var earthmap = document.createElement('canvas');
    earthmap.width = maptemplate.width;
    earthmap.height = maptemplate.height;
    var ectx = earthmap.getContext('2d');

    ectx.drawImage(maptemplate, 0, 0);
    var earthpixels = ectx.getImageData(0, 0, earthmap.width, earthmap.height);

    var createdPins = 0;
    var oddPin = 0;

    for (y = 0; y <= segmentsY; y ++) {

        var v = y / segmentsY;
        var ring = 1 - Math.abs(v - 0.5) * 2;
        var segmentsX = (ring < 0.25) ? maxSegmentsX * ring : maxSegmentsX;

        for (x = 0; x <= segmentsX; x ++) {

            var u = x / segmentsX;

            var px = ( (1 - v) * earthmap.height) | 0;
            var py = (u * earthmap.width) | 0;

            var pi = (px * earthmap.width + py) * 4;

            var isLand = earthpixels.data[pi + 0] > 128;
            var landHeight = earthpixels.data[pi + 2] / 255;
            landHeight = Math.sqrt(landHeight);

            oddPin++;

            if (!isLand) {
                //continue;
                if (oddPin % 5 != 0) continue;
            }

            var xp = -Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            var yp = Math.cos(thetaStart + v * thetaLength);
            var zp = Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

            var s = new SQR.V3(xp, yp, zp).mul(innerRadius);

            var outerRadius = (isLand) ? innerRadius + minLength + radiusVariance * landHeight : innerRadius + minLength;
            var e = new SQR.V3(xp, yp, zp).mul(outerRadius);

            var c = (isLand) ? new SQR.Color(100 - landHeight * 100, 100, 50) : new SQR.Color(200 + Math.random() * 40, 100, 50);
            globe.geometry.addSegment(s, e, c);
            createdPins++;
        }
    }

    aspect = window.innerWidth / window.innerHeight;
    lastMV = new SQR.V3();
    currMV = new SQR.V3();
    deltaR = new SQR.Quaternion();

    globeContainer.add(globe);
    engine.add(globeContainer);

    document.addEventListener('touchstart', onInteractionStart, false);
    document.addEventListener('touchmove', onInteractionMove, false);
    document.addEventListener('touchend', onInteractionEnd, false);

    document.addEventListener('mousedown', onInteractionStart, false);
    document.addEventListener('mousemove', onInteractionMove, false);
    document.addEventListener('mouseup', onInteractionEnd, false);

    render();
}

var mx = 0, my = 0, isDown = false, isTracked = false;
;
var lastMV, currMV, deltaR;

function onInteractionStart() {
    isDown = true;
}

function onInteractionMove(e) {
    if (isDown) {
        e = ('ontouchstart' in window) ? e.targetTouches[0] : e;

        mx = (e.pageX / window.innerWidth * 2 - 1) * aspect;
        my = e.pageY / window.innerHeight * 2 - 1;

        SQR.VectorUtil.mouseToUnitSphereVector(mx, my, 1.0, currMV);

        var a = Math.min(1, SQR.V3.dot(lastMV, currMV));
        lastMV.cross(currMV, lastMV);
        deltaR.set(a, lastMV.x, lastMV.y, lastMV.z);
        if (isTracked) globeContainer.rotationQ.mul(deltaR);

        lastMV.copyFrom(currMV);
        isTracked = true;
    }
}

function onInteractionEnd() {
    isDown = false;
    isTracked = false;
}

function render() {
    globe.rotation.y -= 0.01;

    requestAnimFrame(render);
    engine.render(camera);
}

var mapBase64 = "data:image/jpeg;base64,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";