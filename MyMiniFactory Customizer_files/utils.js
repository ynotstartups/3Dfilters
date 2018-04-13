"use strict";

function obj_loader(LowPoly_file_url, got_geometry_callback) {
    $.get(LowPoly_file_url, function(obj_string){
        var verts = [];
        var faces = [];

        var geometry = new THREE.Geometry();
        var lines = obj_string.split('\n');
        for (var i=0;i<lines.length - 1;i++){ // last line is empty
            var line = lines[i].split(' ');
            if (line[0] === 'v') {
                verts.push(parseFloat(line[1]));
                verts.push(parseFloat(line[2]));
                verts.push(parseFloat(line[3]));
            } else if (line[0] === 'f') {
                faces.push(parseInt(line[1]) - 1);
                faces.push(parseInt(line[2]) - 1);
                faces.push(parseInt(line[3]) - 1);
            } else {
                // console.error('bad obj line');
            }
        }
        var faces = Uint32Array.from(faces);
        var verts = Float32Array.from(verts);

        var geometry =  new THREE.BufferGeometry();

        geometry.addAttribute( 'position', new THREE.BufferAttribute(verts, 3));
        geometry.setIndex(new THREE.BufferAttribute(faces, 1));

        got_geometry_callback(geometry);
    });
}

function cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z) {
    var result = [];
    var mc_length = GLOBAL.mc_bbox_end - GLOBAL.mc_bbox_start;
    result.push(mc_length/(mc_resolution_x - 1)); // mc_grid_increment_x
    result.push(mc_length/(mc_resolution_y - 1)); // mc_grid_increment_y
    result.push(mc_length/(mc_resolution_z - 1)); // mc_grid_increment_z
    return result;
}

var sdf_download_manager = (function sdf_download_manager () {
    // the purpose of this download manager is to allow only one download in progress
    var managed_xhr;
    var downloading_url;
    function download(url, s_callback, e_callback, abort_callback, progress_callback) {
        return $.ajax({
           method: 'GET',
           url: url,
           success: function (data) {
               s_callback(data);
           },
           error: function (data) {
               e_callback(data);
           },
           xhr: function(){
               var xhr_download = new window.XMLHttpRequest();
               xhr_download.addEventListener("progress", function(evt){
                   if (evt.lengthComputable) {
                       var percentComplete = evt.loaded / evt.total;
                       progress_callback(percentComplete);
                   }
               });

               return xhr_download;
           },
        });
    }
    return function(url, s_callback, e_callback, abort_callback, progress_callback) {
        if (managed_xhr === undefined) { // no download process is running
        } else {
            if (url !== downloading_url) {
                managed_xhr.abort();
            } else {
                console.log('ask for download the same file');
            }
        }

        managed_xhr = download(url, s_callback, e_callback, abort_callback, progress_callback);
        downloading_url = url;
    }
}());

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return undefined;
    if (!results[2]) return undefined;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
