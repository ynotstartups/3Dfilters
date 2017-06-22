function CustomizerFilters() {

    "use strict";

    function get_morph_geometry(filter_shape, morph_target, mesh_count, get_mc_parameter = false) {

        var increment_value = 1/(window.GLOBAL.number_of_scene - 1);
        var number_of_scene = window.GLOBAL.number_of_scene;
        var factor_left = increment_value*(number_of_scene-1-mesh_count);
        var factor_right = increment_value*mesh_count;

        var volumn = filter_shape.sdf.slice();

        var morph_target_sdf = morph_target.target_sdf.slice();

        for (var i=0;i<volumn.length;i++) {
            volumn[i] = volumn[i]*factor_left + morph_target_sdf[i]*factor_right;
        }

        if (get_mc_parameter === true) {
            return [volumn, filter_shape.get_mc_resolution()];
        }
        else {
            return get_marching_cube_geometry(volumn, filter_shape.get_mc_resolution());
        }
    }


    function get_minecraft_geometry(filter_shape, mesh_count) { // minecraft

        var mc_resolution_x = filter_shape.size_x;
        var mc_resolution_y = filter_shape.size_y;
        var mc_resolution_z = filter_shape.size_z;

        mc_resolution_x = Math.ceil(mc_resolution_x/Math.pow(1.3, mesh_count));
        mc_resolution_y = Math.ceil(mc_resolution_y/Math.pow(1.3, mesh_count));
        mc_resolution_z = Math.ceil(mc_resolution_z/Math.pow(1.3, mesh_count));

        var result = _cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);
        var mc_grid_increment_x = result[0];
        var mc_grid_increment_y = result[1];
        var mc_grid_increment_z = result[2];

        var mc_resolution = [mc_resolution_x, mc_resolution_y, mc_resolution_z];

        var volumn;

        if (mesh_count === 0) {
            volumn = filter_shape.sdf.slice();
            for (var i=0;i<volumn.length;i++) {
                volumn[i] = Math.ceil(volumn[i]);
            }
        } else {
            volumn = [];
            var mc_bbox_start = window.GLOBAL.mc_bbox_start;
            var count = 0;

            for(var k=0, z=mc_bbox_start; k<mc_resolution_z; ++k, z+=mc_grid_increment_z) {
                for(var j=0, y=mc_bbox_start; j<mc_resolution_y; ++j, y+=mc_grid_increment_y) {
                    for(var i=0, x=mc_bbox_start; i<mc_resolution_x; ++i, x+=mc_grid_increment_x) {
                        var distance_to_0 = filter_shape.eval_implicit(x,y,z);
                        volumn.push(Math.ceil(distance_to_0));
                    }
                }
            }
        }

        return get_marching_cube_geometry(volumn, mc_resolution);
    }

    function get_morphing_and_minecraft_geometry(filter_shape, morph_target_shape, scene_number) {

        var mc_parameter = get_morph_geometry(filter_shape, morph_target_shape, scene_number, true); // only get volumn

        var volumn = mc_parameter[0];
        var mc_resolution = mc_parameter[1];

        var new_volumn = [];
        for (var i=0;i<volumn.length;i++) {
            new_volumn.push(Math.ceil(volumn[i]));
        }
        return get_marching_cube_geometry(new_volumn, mc_resolution);
    }

    function get_twist_geometry(filter_shape, scene_number) { // twist

        var angle = 1.5;
        var volumn = [];

        var number_of_scene = window.GLOBAL.number_of_scene;
        var increment_value = 1/(window.GLOBAL.number_of_scene - 1);
        var mc_bbox_start = window.GLOBAL.mc_bbox_start;

        var mc_resolution_x = filter_shape.size_x + 2;
        var mc_resolution_y = filter_shape.size_y + 2;
        var mc_resolution_z = filter_shape.size_z + 2;

        var result = _cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);
        var mc_grid_increment_x = result[0];
        var mc_grid_increment_y = result[1];
        var mc_grid_increment_z = result[2];

        var mc_resolution = [mc_resolution_x, mc_resolution_y, mc_resolution_z];

        for(var k=0, z=mc_bbox_start; k<mc_resolution_z; ++k, z+=mc_grid_increment_z) {
            for(var j=0, y=mc_bbox_start; j<mc_resolution_y; ++j, y+=mc_grid_increment_y) {
                for(var i=0, x=mc_bbox_start; i<mc_resolution_x; ++i, x+=mc_grid_increment_x) {
                    var c = Math.cos((scene_number*(1/4)*angle-angle)*z);
                    var s = Math.sin((scene_number*(1/4)*angle-angle)*z);
                    var twist_x = c*x-s*y;
                    var twist_y = s*x+c*y;
                    var twist_z = z;
                    // twist will expand the shape a little
                    // shrink the space, it seems to depend on the maximun distance
                    var twist_distance = filter_shape.eval_implicit(twist_x*1.15, twist_y*1.15, twist_z*1.15);
                    volumn.push(twist_distance);
                }
            }
        }
        return get_marching_cube_geometry(volumn, mc_resolution);
    }

    function get_marching_cube_geometry(volumn, mc_resolution) {
        var result = window.MarchingCubes(volumn, mc_resolution);
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
        var geometry =  new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute(verts, 3));
        geometry.setIndex(new THREE.BufferAttribute(faces, 1));
        return geometry;
    }


    function get_lowpoly_geometry(filter_shape,
                                  count,
                                  lowpoly_300_url,
                                  lowpoly_600_url,
                                  lowpoly_1k_url,
                                  got_geometry_callback
                                 ) {

        var lowpoly_url;
        if (count === 1) {
            lowpoly_url = lowpoly_1k_url;
            _obj_loader(lowpoly_url, got_geometry_callback);
        } else if (count === 2){
            lowpoly_url = lowpoly_600_url;
            _obj_loader(lowpoly_url, got_geometry_callback);
        } else if (count === 3) {
            lowpoly_url = lowpoly_300_url;
            _obj_loader(lowpoly_url, got_geometry_callback);
        } else if (count === 0) {
            got_geometry_callback(get_marching_cube_geometry(
                filter_shape.sdf.slice(),
                filter_shape.get_mc_resolution())
            );
        } else{
            // do nothing
        }
    }


    function prepare(current_filter, filter_shape, morph_target_shape, prepare_done_cb) {
        if (['morphing', 'morphing_and_minecraft'].includes(current_filter)){
            var mc_resolution_z = filter_shape.size_z;
            var mc_resolution_y = filter_shape.size_y;
            var mc_resolution_x = filter_shape.size_x;
            var increment_values = _cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);

            morph_target_shape.prepare_sdf(filter_shape, increment_values);
            prepare_done_cb();
        } else if (['minecraft', 'twist'].includes(current_filter)){
            prepare_done_cb();
        } else if (current_filter=== 'lowpoly') {
            prepare_done_cb();
        } else {
            console.error('unknown filter type');
        }
    }

    function _cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z) {
        var result = [];
        var mc_length = GLOBAL.mc_bbox_end - GLOBAL.mc_bbox_start;
        result.push(mc_length/(mc_resolution_x - 1)); // mc_grid_increment_x
        result.push(mc_length/(mc_resolution_y - 1)); // mc_grid_increment_y
        result.push(mc_length/(mc_resolution_z - 1)); // mc_grid_increment_z
        return result;
    }

    function _obj_loader(LowPoly_file_url, got_geometry_callback) {
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

    return {
        get_morph_geometry: get_morph_geometry,
        get_morphing_and_minecraft_geometry: get_morphing_and_minecraft_geometry,
        get_twist_geometry: get_twist_geometry,
        get_minecraft_geometry: get_minecraft_geometry,
        get_lowpoly_geometry: get_lowpoly_geometry,
        prepare: prepare
    }
}
