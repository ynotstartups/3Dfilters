self.addEventListener('message', function(e) {
    const volumn = e.data.volumn;
    const mc_resolution = e.data.mc_resolution;
    const cb_count = e.data.cb_count;

    var result = MarchingCubes(volumn, mc_resolution, "worker_mc");
    // don't use Uint32Array.from, Float32Array.from they are 20 times slower
    var f = result.faces;
    var f_length = f.length;
    var faces = new Uint32Array(f_length);
    for (var i=0;i<f_length;i++) {
        faces[i] = f[i];
    }
    var v = result.vertices;
    var v_length = v.length;
    var verts = new Float32Array(v_length);
    for (var i=0;i<v_length;i++) {
        verts[i] = v[i];
    }
    self.postMessage({faces, verts, cb_count});
});

self.importScripts("marchingcubes.js");
