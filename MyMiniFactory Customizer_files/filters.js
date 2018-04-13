"use strict";

function get_morph_geometry(filter_shape, morph_target, mesh_count, got_geometry_callback, get_mc_parameter = false) {

    var increment_value = 1/(window.GLOBAL.number_of_scene - 1);
    var number_of_scene = window.GLOBAL.number_of_scene;
    var factor_left = increment_value*(number_of_scene-1-mesh_count);
    var factor_right = increment_value*mesh_count;

    var volumn = filter_shape.sdf.slice();

    var morph_target_sdf = morph_target.sdf;

    for (var i=0;i<volumn.length;i++) {
        volumn[i] = volumn[i]*factor_left + morph_target_sdf[i]*factor_right;
    }

    if (get_mc_parameter === true) {
        return [volumn, filter_shape.get_mc_resolution()];
    }
    else {
        return get_marching_cube_geometry(volumn, filter_shape.get_mc_resolution(), got_geometry_callback);
    }
}


function get_minecraft_geometry(filter_shape, mesh_count, got_geometry_callback) { // minecraft

    var mc_resolution_x = filter_shape.size_x;
    var mc_resolution_y = filter_shape.size_y;
    var mc_resolution_z = filter_shape.size_z;

    mc_resolution_x = Math.ceil(mc_resolution_x/Math.pow(1.3, mesh_count));
    mc_resolution_y = Math.ceil(mc_resolution_y/Math.pow(1.3, mesh_count));
    mc_resolution_z = Math.ceil(mc_resolution_z/Math.pow(1.3, mesh_count));

    var result = window.cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);
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

    return get_marching_cube_geometry(volumn, mc_resolution, got_geometry_callback);
}

function get_morphing_and_minecraft_geometry(filter_shape, morph_target_shape, scene_number, got_geometry_callback) {

    var empty_function = function (){}; // HACK TODO better way of this
    var mc_parameter = get_morph_geometry(filter_shape, morph_target_shape, scene_number,empty_function, true); // only get volumn

    var volumn = mc_parameter[0];
    var mc_resolution = mc_parameter[1];

    var new_volumn = [];
    for (var i=0;i<volumn.length;i++) {
        new_volumn.push(Math.ceil(volumn[i]));
    }
    return get_marching_cube_geometry(new_volumn, mc_resolution, got_geometry_callback);
}

function get_twist_geometry(filter_shape, scene_number, got_geometry_callback) { // twist

    var angle = 1.5;
    var volumn = [];

    var number_of_scene = window.GLOBAL.number_of_scene;
    var increment_value = 1/(window.GLOBAL.number_of_scene - 1);
    var mc_bbox_start = window.GLOBAL.mc_bbox_start;

    var mc_resolution_x = filter_shape.size_x + 2;
    var mc_resolution_y = filter_shape.size_y + 2;
    var mc_resolution_z = filter_shape.size_z + 2;

    var result = window.cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);
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
    return get_marching_cube_geometry(volumn, mc_resolution, got_geometry_callback);
}

const cbs = [];
const worker = new window.Worker("MyMiniFactory\ Customizer_files/mc_worker.js");
worker.onmessage = function (e) {
    const verts = e.data.verts;
    const faces = e.data.faces;
    const cb_count = e.data.cb_count;

    var geometry =  new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute(verts, 3));
    geometry.setIndex(new THREE.BufferAttribute(faces, 1));
    cbs[cb_count](geometry);
    cbs[cb_count] = undefined; // dereference the function
}

function get_marching_cube_geometry(volumn, mc_resolution, got_geometry_callback) {
    let cb_count = cbs.push(got_geometry_callback);
    cb_count--;
    worker.postMessage({volumn, mc_resolution, cb_count});
}


function get_lowpoly_geometry(filter_shape, count, got_geometry_callback) {

    var lowpoly_url;
    if (count === 1) {
        lowpoly_url = controller.model().lowpoly_1k_url;
        window.obj_loader(lowpoly_url, got_geometry_callback);
    } else if (count === 2){
        lowpoly_url = controller.model().lowpoly_600_url;
        window.obj_loader(lowpoly_url, got_geometry_callback);
    } else if (count === 3) {
        lowpoly_url = controller.model().lowpoly_300_url;
        window.obj_loader(lowpoly_url, got_geometry_callback);
    } else if (count === 0) {
        get_marching_cube_geometry(
            filter_shape.sdf,
            filter_shape.get_mc_resolution(),
            got_geometry_callback
        );
    } else{
        // do nothing
    }
}


function prepare(filter_shape, morph_target_shape, prepare_done_cb) {
    if (['morphing', 'morphing_and_minecraft'].includes( controller.filter() )){
        morph_target_shape.prepare_sdf(filter_shape);
        prepare_done_cb();
    } else if (['minecraft', 'twist'].includes( controller.filter() )){
        prepare_done_cb();
    } else if (controller.filter() === 'lowpoly') {
        prepare_done_cb();
    } else {
        console.error('unknown filter type');
    }
}
