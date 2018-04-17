self.addEventListener('message', function(e) {
    const file = e.data.blob;
    SDFGen(file, 2, 1);
}, false);

// var Module = {
    // 'print': function(text) {
        // self.postMessage({"log":text});
    // }
// };

self.importScripts("./SDFgen.js");

let last_file_name = undefined;

function SDFGen(file, padding, dx) {
    console.log("Doing SDFGen")

    var filename = file.name;

    // if simplify on the same file, don't even read the file
    if (filename === last_file_name) {
        console.log("skipping load and create data file");
        simplify(filename, percentage, filename);
        return;
    } else { // remove last file in memory
        if (last_file_name !== undefined)
            Module.FS_unlink(last_file_name);
    }

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
        let file = new Blob([out_bin], {type: 'application/sla'});
        self.postMessage({"blob":file});

        // parseSDF(out_bin);
    }
}

function parseSDF(bin) {
    // std::cout << "(ni,nj,nk) are the integer dimensions of the resulting distance field.\n";
    // std::cout << "(origin_x,origin_y,origin_z) is the 3D position of the grid origin.\n";
    // std::cout << "<dx> is the grid spacing.\n\n";
    // std::cout << "<value_n> are the signed distance data values, in ascending order of i, then j, then k.\n";
    //
    // all int are unsighed
    // int int int
    // float float float
    // float
    // lots of floats

    console.time("parse")
    const buffer = bin.buffer;
    const dim_x_y_z = new Uint32Array(bin.buffer, 0, 3);
    const origin_x_y_z = new Float32Array(bin.buffer, 3*4, 3);
    const grid_spacing = new Float32Array(bin.buffer, 6*4, 1);
    const sdf = new Float32Array(bin.buffer, 7*4, (bin.byteLength - 7*4)/4);
    self.postMessage({dim_x_y_z, sdf});
    console.timeEnd("parse")
}
