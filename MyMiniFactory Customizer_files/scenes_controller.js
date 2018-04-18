"use strict";

/**
 * Contains logic dealing with THREE.js and filter algorithm
 * In theory, this controller should not touch any DOM and HTML element
 *
 * @constructor
 * @param {HTMLElement} canvas
 */
function ScenesController(canvas) {
    var that = this;
    var scenes = [];
    var renderer;

    /**
     * Shape you want to apply filter on
     *
     * @type {ImplicitSdf_3d}
     */
    var filter_shape;

    /**
     * morph target
     *
     * @type {ImplicitJScript}
     */
    var morph_targe_shape;

    var materialColor =  new THREE.Color();
    materialColor.setRGB( 1.0, 1.0, 1.0 );
    var material = new THREE.MeshPhongMaterial( { color: materialColor, specular: 0x0, shading: THREE.FlatShading, side: THREE.DoubleSide });

    /**
     * Get mesh given parameters, do a callback when finished
     *
     * @param {string} current_filter - name of filter
     * @param {number} scene_number - index of scene
     * @param {callback} got_mesh_cb - do cb after getting the mesh
     * @returns {undefined}
     */
    var get_mesh = (function(){ // ensure translate_resize_geomtry is a private function of got_geometry_callback
        return function(current_filter, scene_number, got_mesh_cb) {
            var got_geometry_callback = function(geometry) {
                translate_resize_geomtry(geometry);
                var mesh = new THREE.Mesh(geometry, material);
                got_mesh_cb(scene_number, mesh);
            };
            get_geometry(current_filter, scene_number, got_geometry_callback);
        };


        function get_geometry(current_filter, scene_number, got_geometry_callback) {

            var geometry;
            if (current_filter === 'morphing') {
                geometry = get_morph_geometry(filter_shape, morph_targe_shape, scene_number, got_geometry_callback);
            } else if (current_filter === 'minecraft') {
                geometry =  get_minecraft_geometry(filter_shape, scene_number, got_geometry_callback);
            } else if (current_filter === 'morphing_and_minecraft') {
                geometry = get_morphing_and_minecraft_geometry(filter_shape, morph_targe_shape, scene_number, got_geometry_callback);
            } else if (current_filter === 'twist') {
                geometry = get_twist_geometry(filter_shape, scene_number, got_geometry_callback);
            } else if (current_filter === 'lowpoly') {
                get_lowpoly_geometry(filter_shape, scene_number, got_geometry_callback); // get_lowpoly_geometry async
            } else {
                console.error('unknown filter type');
            }
        }

        function translate_resize_geomtry(geometry) {
            geometry.computeBoundingBox();
            geometry.translate(-((geometry.boundingBox.max.x + geometry.boundingBox.min.x)/2) ,
                           -((geometry.boundingBox.max.y + geometry.boundingBox.min.y)/2),
                           -((geometry.boundingBox.max.z + geometry.boundingBox.min.z)/2));

            var res = Math.max(geometry.boundingBox.max.x - geometry.boundingBox.min.x,
                                geometry.boundingBox.max.y - geometry.boundingBox.min.y,
                                geometry.boundingBox.max.z - geometry.boundingBox.min.z);

            geometry.scale(50/(res/2),50/(res/2),50/(res/2));
        }
    })();

    var update_all_meshs = function(){
        prepare(filter_shape, morph_targe_shape, function prepare_done_cb(){
            remove_meshes(0, GLOBAL.number_of_scene);
            add_meshes(0, GLOBAL.number_of_scene);
        });
    };

    /**
     * Check whether scene with index has mesh
     * @function
     * @param {number} index - index for scenes
     * @return {boolean}
     */
    this.has_mesh = function (index) {
        if (scenes[index].children.length > 2) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Remove mesh from scenes indicated by start index to end index
     * This function should be the only function
     * which remove mesh from scene
     * HACK calling a controller function
     *
     * @function
     * @param {number} start - indicates start index
     * @param {number} end - indicates end index
     */
    function remove_meshes(start, end) {
        for (var scene_number = start; scene_number < end; scene_number++) {
            var this_scene = scenes[scene_number];
            while (that.has_mesh(scene_number)){
                var mesh = this_scene.children[this_scene.children.length-1]; // mesh is always at index 2
                if (mesh !== undefined) { // for first time mesh is undefined
                    this_scene.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                    controller.put_loading_text(scene_number);
                }
            }
        }
    }

    /**
     * Add mesh from scenes indicated by start index to end index
     * This function should be the only function
     * which ad mesh to scene
     * HACK calling a controller function
     *
     * @function
     * @param {number} start - indicates start index
     * @param {number} end - indicates end index
     */
    function add_meshes(start, end) {
        for (var scene_number = start; scene_number < end; scene_number++) {
            var callback_start_filter = controller.filter();
            var callback_start_model = controller.model();
            get_mesh(controller.filter(), scene_number, function(scene_number, mesh){
                var callback_finish_filter = controller.filter();
                var callback_finish_model = controller.model();

                if ((callback_finish_filter === callback_start_filter) &&
                    (callback_finish_model === callback_start_model) &&
                    !that.has_mesh(scene_number)) {

                    scenes[scene_number].add(mesh);
                    controller.remove_loading_text(scene_number);
                } else {
                    //console.log('filter not the same to origin filter',
                                    //callback_start_filter, callback_finish_filter);
                    //console.log('model not the same to origin model',
                                    //callback_start_model.model, callback_finish_model.model);
                }
            });
        }
    }

    /**
     * Rotate all meshes in scenes
     */
    function rotate_meshes() {
        for (var i=0;i< window.GLOBAL.number_of_scene;i++) {
            if (that.has_mesh(i)){
                scenes[i].children[2].rotation.z = Date.now() * 0.001;
            }
        }
    }

    /**
     * Ask scene_controller to update the meshes
     * with fallback if require variable is not defined
     * @function
     * @param {string} hint scene_controller what to update
     */
    this.update_meshes = function(parameter) {
        if (morph_targe_shape === undefined || filter_shape === undefined) {
            update_process('init');
        } else {
            update_process(parameter);
        }
        // parameter is left, right, filter
        function update_process(parameter){
            if (parameter === 'left') {
                updateLeft();
            } else if (parameter === 'right') {
                updateRight();
            } else if (parameter === 'filter') {
                update_all_meshs();
            } else if (parameter === 'init') {
               read_selected_option(controller.model().model, function(JSshape){
                   filter_shape = JSshape;
                   read_selected_option(controller.target().model, function(JSshape){
                       morph_targe_shape = JSshape;
                       update_all_meshs();
                   })
               })
            }  else {
                console.error('unknown paramter', paramter);
            }
        }
    }

    /**
     * Ask for updating meshes because of change of filter shape
     * Special case for lowpoly filter, can we remove this special case?
     */
    function updateLeft() {
        if (controller.filter() === "lowpoly") {
            //update_all_except_first_meshs();
            remove_meshes(0, GLOBAL.number_of_scene);
            add_meshes(1, GLOBAL.number_of_scene);
            read_selected_option(controller.model().model, function(JSshape) {
                filter_shape = JSshape;
                //update_first_mesh();
                add_meshes(0, 1);
            });
        } else {
            read_selected_option(controller.model().model, function(JSshape) {
                filter_shape = JSshape;
                update_all_meshs();
            });
        }
    }

    /**
     * Ask for updating meshes because of change of morph target
     */
    function updateRight() {
        read_selected_option(controller.target().model, function(JSshape) {
            morph_targe_shape = JSshape;
            update_all_meshs();
        });
    }

    /**
     * Given corresponding instance of either
     * {ImplicitSDF_3d|ImplicitJSScript} from given value,
     * then call callback with this instance
     * Only function that create {ImplicitSDF_3d|ImplicitJSScript} object
     *
     * @param {string} option_value - JSshape name or url to a SDF file
     * @param {callback} s_callback
     * @returns {undefined}
     */
    function read_selected_option(option_value, s_callback) {
        var type = 'rawjscode';

        var func, JSshape;
        if ( option_value === "sphere_sdf" ) {
            func = function (x, y, z) {
                return - 1 + (x*x + y*y + z*z);
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "half_sphere_sdf" ) {
            func = function (x, y, z) {
                z = (z + 1)/2;
                return - 1 + (x*x + y*y + z*z);
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "cube_sdf" ) {
            func = function (x, y, z) {
                var base_length = 0.5;
                var d_x = Math.abs(x) - base_length;
                var d_y = Math.abs(y) - base_length;
                var d_z = Math.abs(z) - base_length;
                return  (Math.min(Math.max(d_x,Math.max(d_y,d_z)),0.0) + ImplicitJSScript.length3(Math.max(d_x,0.0),Math.max(d_y,0.0),Math.max(d_z,0.0)));
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "torus_sdf" )
        {
            func = function (x, y, z) {
                var para_outer = 0.4;
                var para_inner = 0.2;
                var torus_thickness = 0.4;
                var q_0 = ImplicitJSScript.length2(x, z) - para_outer;
                var q_1 = y;
                return - torus_thickness + ImplicitJSScript.length2(q_0 - para_inner, q_1 - para_inner);
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "vertical_ellipsoid_sdf" )
        {
            func = function (x, y, z) {
                var r_x = 0.5;
                var r_y = 0.5;
                var r_z = 1;
                return ((ImplicitJSScript.length3(x/r_x, y/r_y, z/r_z) - 1.0) * Math.min(Math.min(0.5,0.5),1.0));
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "horizontal_ellipsoid_sdf" ) {
            func = function (x, y, z) {
                var r_x = 1;
                var r_y = 0.5;
                var r_z = 0.5;
                return (ImplicitJSScript.length3( x/r_x, y/r_y, z/r_z ) - 1.0) * Math.min(Math.min(0.5,0.5),1.0);
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "front_ellipsoid_sdf" )
        {
            func = function (x, y, z) {
                var r_x = 0.5;
                var r_y = 1;
                var r_z = 0.5;
                return (ImplicitJSScript.length3( x/r_x, y/r_y, z/r_z ) - 1.0) * Math.min(Math.min(0.5,0.5),1.0);
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "make_fat") // make a horizontal and frontend con
        {
            func = function (x, y, z) {
                var ratio = [1,1];
                var normalize_ratio = [ratio[0]/Math.sqrt(ratio[0]*ratio[0] + ratio[1]*ratio[1]),
                    ratio[1]/Math.sqrt(ratio[0]*ratio[0] + ratio[1]*ratio[1])];

                z = z - 1;
                z = z/2;
                x = x/2;
                var cone = normalize_ratio[0]*ImplicitJSScript.length2(x, y) +normalize_ratio[1]*z;

                if (x < -0.45) {
                    return 0.1;
                } else if (x > 0.45) {
                    return 0.1;
                } else if (z < -0.99) {
                    return 0.1;
                } else {
                    return cone;
                }

            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if ( option_value === "cone_sdf" ) // make a horizontal and frontend con
        {
            func = function (x, y, z) {
                z = z - 1;
                z = z/2;
                return 0.707*ImplicitJSScript.length2(x, y) +0.707*z;
            };
            JSshape = new ImplicitJSScript(func);
            s_callback(JSshape);
        } else if (option_value.sdf !== undefined) {
            console.log("in Float32Array")
            JSshape = new ImplicitSdf_3d(
                option_value.dim_x,
                option_value.dim_y,
                option_value.dim_z,
                option_value.grid_spacing,
                option_value.origin_x,
                option_value.origin_y,
                option_value.origin_z,
                option_value.sdf
            )
            s_callback(JSshape);
        } else {
            console.log("in default");
            var requestedModel = controller.init_download_progress();

            var ajax_success = function (data) {
                JSshape = ImplicitSdf_3d.make_mp5_from_sdf(data);
                s_callback(JSshape);
                controller.done_download_progress();
            };

            var ajax_error = function (data) {
            };

            var ajax_abort = function () {
            };

            var ajax_progress = function (percentComplete) {
                controller.set_download_progress(requestedModel, percentComplete);
            };

            sdf_download_manager(option_value, ajax_success, ajax_error, ajax_abort, ajax_progress);
        }
    }

    /**
     * Get scene by index
     *
     * @param {number} id - scene index
     * @returns {THREEJS scene object}
     */
    this.get_scene = function (id) {
        return scenes[id];
    };


    /**
     * init renderer and all scene in scenes
     * scene is THREEjs Scene object
     *
     * @returns {undefined}
     */
    this.init = function() {
        for (var i=0; i < GLOBAL.number_of_scene; i++) {
            var scene = new THREE.Scene();
            // camera
            var camera = new THREE.PerspectiveCamera(50, 1, 1, 10*50);
            camera.position.y = -3.8*45;
            camera.lookAt(new THREE.Vector3(0,0,0));
            camera.rotation.z = 2*Math.PI;
            scene.userData.camera = camera;

            var effectController = {
                ka: 0.17,
                hue: 0.121,
                saturation: 0.73,
                lightness: 0.66,
                lhue: 0.04,
                lsaturation: 0.01,
                llightness: 1.0
            };
            // light
            var ambientLight = new THREE.AmbientLight( 0x333333 );  // 0.2
            ambientLight.color.setHSL( effectController.hue, effectController.saturation, effectController.lightness * effectController.ka );
            var light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
            light.position.set(-1, -1, 1);
            light.color.setHSL( effectController.lhue, effectController.lsaturation, effectController.llightness );

            scene.add(ambientLight);
            scene.add(light);
            scenes.push(scene);
        }

        renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
        renderer.setClearColor(0xAAAAAA, 1);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
    }

    /**
     * Sets renderer's parameters.
     * HACK setting css!! Well, render should not set DOM css
     * @function
     */
    this.render = function () {
        var position_dict = position_calculator();

        var renderer_width = 0;
        var renderer_height = 0;
        var margin = 20;
        var column, fix;

        renderer.setSize(
            position_dict['renderer_width'],
            position_dict['renderer_height']
        );

        renderer.setClearColor(0xffffff); // white background
        renderer.setScissorTest(false);
        renderer.clear();
        renderer.setClearColor(0xcfcfcf); // grey
        renderer.setScissorTest(true);

        for (var i = 0; i < window.GLOBAL.number_of_scene; i++) {
            var scene = that.get_scene(i);
            rotate_meshes();
            renderer.setViewport(
                position_dict['scene' + i + 'left']+4,
                position_dict['scene' + i + 'top']+4,
                position_dict['scene_width']-10,
                position_dict['scene_width']-10
            );

            renderer.setScissor(
                position_dict['scene' + i + 'left']+4,
                position_dict['scene' + i + 'top']+4,
                position_dict['scene_width']-10,
                position_dict['scene_width']-10);

            var camera = scene.userData.camera;
            if (position_dict['frame' + i + 'display'] !== 'none'){
                renderer.render(scene, camera);
            }

            $(controller.frame()[i]).css({ // frame css
                "left": position_dict['frame' + i + 'left'] + 'px',
                "top": position_dict['frame' + i + 'top']+"px",
                "height": position_dict['scene_width']+"px",
                "width": position_dict['scene_width']+"px",
                "display": position_dict['frame' + i + 'display']
            });

            $('.frame').css({
                "line-height": position_dict['scene_width'] - parseInt($('.frame').css("font-size"))/2+"px"
            });

        }
    };
}
