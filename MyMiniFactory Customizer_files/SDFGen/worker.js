self.addEventListener('message', function(e) {
    const file = e.data.blob;
    SDFGen(file, 2, 1);
}, false);

// var Module = {
    // 'print': function(text) {
        // self.postMessage({"log":text});
    // }
// };

self.importScripts("./SDFGen.js");

let last_file_name = undefined;

function SDFGen(file, padding, dx) {
    console.log("Doing SDFGen")

    var filename = file.name ? file.name : "tiger.stl";

    /*
    if (filename === last_file_name) {
        console.log("skipping load and create data file");
        return;
    } else { // remove last file in memory
        if (last_file_name !== undefined)
            Module.FS_unlink(last_file_name);
    }
    */

    if (last_file_name !== undefined)
        Module.FS_unlink(last_file_name);

    last_file_name = filename;
    var fr = new FileReader();
    fr.readAsArrayBuffer(file);
    fr. onloadend = function (e) {
        var data = new Uint8Array(fr.result);
        Module.FS_createDataFile(".", filename, data, true, true);
        console.time("SDFGen");
        Module.ccall("SDFGen", // c function name
            undefined, // return
            ["string", "number", "number"], // param
            [filename, padding, dx]
        );
        console.timeEnd("SDFGen");

        // same hacky way of getting the name like in c++
        let out_bin = Module.FS_readFile(filename.slice(0, filename.length-3)+"sdf");
        // sla should work for binary stl
        const buffer = out_bin.buffer;

        // parseSDF for ImplicitSdf_3d

        console.time("parse")
        const [dim_x, dim_y, dim_z] = new Uint32Array(buffer, 0, 3);
        const [origin_x, origin_y, origin_z] = new Float32Array(buffer, 3*4, 3);
        const [grid_spacing] = new Float32Array(buffer, 6*4, 1);

        const sdf = new Float32Array(buffer, 7*4, (buffer.byteLength - 7*4)/4);
        console.timeEnd("parse")

        // TODO: does it make sense to use transferable list
        self.postMessage({
            dim_x, dim_y, dim_z,
            origin_x, origin_y, origin_z,
            grid_spacing,
            sdf
        });
    }
}
