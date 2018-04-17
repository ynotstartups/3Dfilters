//Global Scope Variables
(function () {

"use strict";

/**
 * Controller as in MVC design pattern.
 *
 * Frame is the frames on top of the scenes
 * Model is the shape to apply filter on
 * Targer is the morph target
 * Filter is the filter
 *
 * @constructor
 * @param {number} chosenFrame - index
 * @param {number} chosenModel - index
 * @param {number} chosenTarget - index
 * @param {number} chosenFilter - index
 */
window.App = function (chosenFrame, chosenModel, chosenTarget, chosenFilter) {

    var param_url = location.search;

    // var val = getParameterByName("frame", param_url);
    // if (val !== undefined) {
    //     chosenFrame = val;
    // }

    // val = getParameterByName("chosenModel", param_url);
    // if (val !== undefined) {
    //     chosenModel = val;
    // }

    // var val = getParameterByName("chosenTarget", param_url);
    // if (val !== undefined) {
    //     chosenTarget = val;
    // }

    // val = getParameterByName("filter", param_url);
    // if (val !== undefined) {
    //     chosenFilter = val;
    // }
    var that = this;

    var canvas = document.getElementById("canvas");
    var scenes_controller = new ScenesController(canvas);

    var is_login;
    if (accessToken === "") {
        is_login =  false;
    } else {
        is_login = true;
    }

    var model = []; // store mmf_objects
    var frame = []; // store the query string of each frame
    var filter = [];
    var target = []; // store Objects describe morph target

    var maxWidth = 1350;  //canvas max width

    // check legitimacy
    if( !isLegitimate(chosenFrame, 7) || !isLegitimate(chosenModel, 113) ||
        !isLegitimate(chosenTarget, 6) || !isLegitimate(chosenFilter, 4) ){
        chosenFilter = 0;
        chosenTarget = 0;
        chosenModel = 0;
        chosenFrame = 0;
    }

    var width_l_column = 201;
    var width_r_column;
    var quantity_l_column = 0;
    var quantity_r_column = 0;

    var filter_icon_normal_height = 50;
    var filter_icon_chosen_height = 68;
    var filter_icon_normal_width = 110;
    var filter_icon_chosen_width = 128;
    var font_size_normal_ratio = 3.0;
    var font_size_chosen_ratio = 3.55;

    var filter_normal_css = {
        "margin-left":(filter_icon_chosen_width-filter_icon_normal_width)/2 + "px",
        "width": filter_icon_normal_width+"px",
        "height": filter_icon_normal_height+"px",
        "font-size": filter_icon_normal_height/font_size_normal_ratio+"px",
        "font-weight": "normal"
    };

    var filter_chosen_css = {
        "margin-left": "0px",
        "width": filter_icon_chosen_width+"px",
        "height": filter_icon_chosen_height+"px",
        "font-size": filter_icon_chosen_height/font_size_chosen_ratio+"px",
        "font-weight": "bold"
    };

    (function init() {

        $("#container").css({"max-width": maxWidth+"px"}); // min-width set in css
        $('#customizer_left').css({'width': width_l_column + 'px'});

        if (!is_login) {
            $('#publish').attr("data-reveal-id", "loginscreen");
            $('#download').attr("data-reveal-id", "loginscreen");
        }else{
            $('#download').removeAttr("data-reveal-id", "loginscreen");
        }

        //create new frame divs
        for (var i=0; i<window.GLOBAL.number_of_scene; i++) {
            var div = "<div class='frame' id='frame"+i+"'><div></div></div>";
            $(".screen").append(div);
            frame[i] = "#frame"+i;
        }

        _update_url();
        select_frame(chosenFrame);

        $("#scroll-left").perfectScrollbar();
        $("#scroll-right").perfectScrollbar();

        $(".filter").children("div").mouseleave(function() {

            if ($(".filter").index($(this).parent()) == chosenFilter){
                return;
            }
            animate_shrink($(this));
        });

        $(".filter").children("div").mouseover(function() {

            if ($(".filter").index($(this).parent()) == chosenFilter){
                return;
            }
            animate_enlarge($(this));
        });

        // select filters / change layout
        $(".filter").children("div").click(function() {

            var clicked_filter_index = $(".filter").index($(this).parent());
            var clicked_filter = filter[clicked_filter_index];

            if ( clicked_filter_index == chosenFilter) {
                return;
            }

            if (clicked_filter === 'lowpoly') {
                if (chosenFrame > 4) {
                    select_frame(3);
                }
            }

            var containerWidth = $("#container").width();
            var factor = maxWidth - containerWidth;

            chosenFilter = clicked_filter_index;
            set_filter_css(chosenFilter);
            moveArrow(chosenFilter);
            set_width_r_column(clicked_filter);

            _update_url();
            scenes_controller.update_meshes('filter');

            that.draw_scene();
        });


        // mouse clicks frames
        $(".frame").click(function() {
            if ($(".frame").index(this) === chosenFrame) {
                return;
            }
            select_frame($(".frame").index(this));
            _update_url();
        });

        // on resize callback
        $(window).resize(function() {
            that.draw_scene();
        });

    }());

    /**
     * Initializes scenes for meshes
     * @function
     * @see scenes_controller#init
     * @see scenes_controller#update_meshes
     */
    this.init_scenes = function () {

        function animate() {
            scenes_controller.render();
            requestAnimationFrame(animate);
        }

        scenes_controller.init();
        for (var i=0;i<window.GLOBAL.number_of_scene;i++)
            that.put_loading_text(i);

        scenes_controller.update_meshes('init');

        animate();

        controller.draw_scene();
    };

    /**
     * Check whether data read from localStorage is legal
     *
     * @function
     * @param {string} string data - read from localSrorage
     * @param {number} max_value - the maximun integer allowed
     */
    function isLegitimate(string, max_value){
        var stringInt = parseInt(string);
        if (stringInt !== undefined){
            if(!Number.isInteger(stringInt)){
                return false;
            }else{
                if(stringInt < 0 || stringInt > max_value){
                   return false;
                }

            }
        } else {
            return false;
        }
        return true;
    }

    /**
     * shrink filter div
     *
     * @function
     * @param {Object} div - html frame div
     * @returns {undefined}
     */
    function animate_shrink(div) {
        animateFilter(div, filter_normal_css);
    }

    /**
     * enlarge filter div
     *
     * @param {Object} div - html frame div
     * @returns {undefined}
     */
    function animate_enlarge(div) {
        var filter_chosen_css_no_bold = $.extend({}, filter_chosen_css);
        filter_chosen_css_no_bold["font-weight"] = "normal";
        animateFilter(div, filter_chosen_css_no_bold);
    }

    /**
     * animateFilter
     *
     * @param {Object} div - html frame div
     * @param {Object} css_dict
     * @returns {undefined}
     */
    function animateFilter(div, css_dict){

        var duration = 1;
        var containerWidth = $("#container").width();
        var factor = maxWidth - containerWidth;

        div.animate(css_dict, {
            easing: "linear",
            duration: duration
        });
    }

    /**
     * Resize
     *
     * @returns {undefined}
     */
    function resize() {
        var position_dict = position_calculator();

        moveArrow(chosenFilter);

        $("#scenes_holder").css({
            "width": position_dict['canvas_width']+"px",
            'height': position_dict['canvas_height'] +'px' // hack, dont understand
        });
    }

    /**
     * Change css of a filter to filter_chosen_css
     *
     * @param {number} chosenFilter
     * @returns {undefined}
     */
    function set_filter_css(chosenFilter) {
        $(".filter div").css(filter_normal_css);
        $(".filter:eq("+chosenFilter+") div").css(filter_chosen_css);
    }

    /**
     * change css of arrow to point to the chosenFilter
     *
     * @param chosenFilter
     * @returns {undefined}
     */
    function moveArrow(chosenFilter) {
        var div = $(".filter:eq("+chosenFilter+")");
        var scrollLeft = document.getElementById('customizer_container').scrollLeft;
        $("#arrow").css("margin-left",
            (div.offset().left + scrollLeft + ((filter_icon_chosen_width - $("#arrow").width()) / 2))+"px");
    }

    /**
     * Hack to ensure correct behaviour when resize
     * since the layout is weird just by calling resize
     *
     * @returns {undefined}
     */
    function draw_scene() {
        scenes_controller.render();
        resize();
        scenes_controller.render();
    }
    this.draw_scene = draw_scene;

    /**
     * Enclosing all the logic for selecting/changing a frame
     *
     * @param {number} frame_id - integer
     * @returns {undefined}
     */
    function select_frame(frame_id){
        frame.forEach(function(each_f_css_id){
            window.unselect_frame_css(each_f_css_id);
        });
        window.select_frame_css(frame[frame_id]);
        chosenFrame = frame_id;
    }

    /**
     * these are the css which can only be init
     * after finish loading of thumnbals.
     *
     * @returns {undefined}
     */
    this.init_css = function (){

        set_width_r_column(filter[chosenFilter]);
        set_filter_css(chosenFilter);
        add_select_model_border($("#icons"+chosenModel+"left"));
        add_select_model_border($("#icons"+chosenTarget+"right"));

        $(get_preview_class("left")).css("background-image", "url('"+that.model().thumbnail+"')");
        $(get_preview_class("right")).css("background-image", "url('"+that.target().thumbnail+"')");
        var scroll_position = 8*Math.floor(chosenModel/8)*43; // when refresh, scroll bar is at the level of the selected model
        $("#scroll-left").scrollTop(scroll_position).perfectScrollbar('update');

        draw_scene();
        this.init_upload_form();
    };

    this.check_for_login_download = function (){
        check_for_login_func('download');
    }

    this.check_for_login_upload = function(){
        check_for_login_func('upload');
    };

    /**
     * check localStorage whether upload/download is true
     * if upload/download is true means that user wanted to
     * upload/download, but user is not login/register, thus
     * when user returns to this page (after successfully
     * login/register, we will do a automatix upload/download.
     *
     * @param para
     * @returns {undefined}
     */
    function check_for_login_func(para) {
        var localStorage_para;
        var func;

        if (para === 'upload') {
            localStorage_para = localStorage.upload;
            func = that.init_upload_progress;
        } else if (para === 'download') {
            localStorage_para = localStorage.download;
            func = that.download_to_local;
        } else {
            console.error("unknown para", para);
        }
        if (localStorage_para == 'true') {
            if (is_login){
                var refreshIntervalId = setInterval(function(){
                    // download if specific scene has mesh
                    // it's possible that user upload another model
                    // if user change the filter in the beginning
                    // need to check
                    if (scenes_controller.has_mesh(that.publish())) {
                        localStorage_para = false;
                        localStorage.upload = false;
                        localStorage.download = false;
                        func();
                        clearInterval(refreshIntervalId);
                    }
                }, 250);
            } else {
                // if user return to the page without login
                // stop trying to upload/download
                localStorage_para = false;
                localStorage.upload = false;
                localStorage.download = false;
            }
        }
    }

    /**
     * add data to model and target array
     *
     * @param {string} kind - 'left'|'right' add to model|target array
     * @param {Object} data - 'left'|'right' data are mmf_object|Object
     * @returns {undefined}
     */
    this.addData = function(kind, data) {
        if (kind === 'left') {
            model.push(data);
            drawTable(kind, data);
        } else if (kind === 'right') {
            target.push(data); // data here is a instance of mmf_object
            drawTable(kind, data);
        } else if (kind === 'filter') {
            filter.push(data);
        } else {
            console.error('unknown kind parameter ', kind);
        }
    };


    /**
     * create html elements for added data
     *
     * @param {string} kind - 'left'|'right' add to model|target array
     * @param {Object} data - 'left'|'right' data are mmf_object|Object
     * @returns {undefined}
     */
    function drawTable(kind, data) {

        $("#scroll-left").perfectScrollbar('update');
        $("#scroll-right").perfectScrollbar('update');

        var thumbnail_index = get_thumbnail_index(kind);

        var float;
        if (thumbnail_index%2 === 0) {
            float = 'left';
        } else {
            float = 'right';
        }

        var model_thumbnail_div;
        if (kind === 'left') {
            model_thumbnail_div = document.getElementById( "c_thumbnail_template_left" ).text;
            model_thumbnail_div = model_thumbnail_div.replace('$i', thumbnail_index).replace('$i', thumbnail_index)
                                .replace('$thumbnail', data.thumbnail);
        } else {
            model_thumbnail_div = document.getElementById( "c_thumbnail_template_right" ).text;
            model_thumbnail_div = model_thumbnail_div.replace('$i', thumbnail_index)
                                .replace('$thumbnail', data.thumbnail);
        }

        $("#inner-"+kind).prepend(model_thumbnail_div);

        var preview_icon = $("#icons"+thumbnail_index+kind);


        preview_icon.mouseenter(function(){
            $(get_preview_class(kind)).css("background-image", $(this).children().css("background-image"));
        });

        preview_icon.mouseleave(function(){
            if (kind === 'left'){
                $(get_preview_class(kind)).css("background-image", "url("+that.model().thumbnail+")");
            } else { //kind === right
                $(get_preview_class(kind)).css("background-image", "url("+that.target().thumbnail+")");
            }
        });

        preview_icon.click(function(){
            if (kind === 'left'){
                if (thumbnail_index === chosenModel) {
                    return;
                }
                $("#inner-left div div div").css("border", "none"); // clear all border
                chosenModel = thumbnail_index;
                add_select_model_border($(this)); // position is important
                scenes_controller.update_meshes('left');
            } else { // kind === right
                if (thumbnail_index === chosenTarget) {
                    return;
                }
                $("#inner-right div div div").css("border", "none"); // clear all border
                chosenTarget = thumbnail_index;
                add_select_model_border($(this)); // position is important
                scenes_controller.update_meshes('right');
            }
            _update_url();
        });

        if (kind === 'left') {
            quantity_l_column += 1;
        } else {
            quantity_r_column += 1;
        }
        function get_thumbnail_index(kind) {
            if (kind === 'left') {
                return quantity_l_column;
            } else if (kind === 'right') {
                return quantity_r_column;
            } else {
                console.error('unknown kind parameter');
            }
        }
    }

    /**
     * Get query string for preview HTML element
     *
     * @param {string} kind - 'left'|'right'
     * @returns {undefined}
     */
    function get_preview_class(kind) {
        if (kind === 'left') {
            return ".view:eq(1)";
        } else {
            return ".view:eq(0)";
        }
    }

    function add_select_model_border(html_element) {
        html_element.children().children().css({
            "border": "4px solid #25b9a1", "-webkit-border-radius": "5px",
            "-moz-border-radius": "5px", "border-radius": "5px"
        });
    }

    this.model = function(){
        return model[chosenModel];
    };
    this.target = function(){
        return target[chosenTarget];
    };
    this.filter = function(){
        return filter[chosenFilter];
    };
    this.publish = function(){
        return chosenFrame;
    };
    this.frame = function(){
        return frame;
    };
    this.width_l_column = function(){
        return width_l_column;
    };
    this.width_r_column = function(){
        return width_r_column;
    };

    /**
     * Sets width of the right column to 0 if not morphing,
     * to 201 if morphing
     * @function
     * @private
     * @param {number} current_filter The chosen filter
     */
    function set_width_r_column(current_filter) {
        if(!(['morphing', 'morphing_and_minecraft'].includes(current_filter))){
            width_r_column = 0;
            $("#customizer_right").css({"width": width_r_column+"px","display": "none"});

        }else{
            width_r_column = 201;
            $("#customizer_right").css({"width": width_r_column+"px","display": "initial"});
        }
    }

    /**
     * Sets downloading progress bar of chosenModel to 100%
     * and of others models to 0%
     * @function
     * @return {number} The chosen model
     */
    this.init_download_progress = function () {

        var all_Bars = document.getElementsByClassName('myBar');
        for (var i = 0; i < all_Bars.length; i++) {
            if (i !== chosenModel) {
                all_Bars[i].style.height = '0%';
            }
        }

        var elem = document.getElementById("myBar" + chosenModel);
        elem.style.height = '100%';

        // init left info text
        var l_info_text = $('#l_info_text');
        l_info_text.text("Downloading 0%");

        return chosenModel;
    };

    /**
     * set_download_progress
     *
     * @param {number} requestedModel - chosenModel at the begining of ajax
     * @param {number} progress_value - persentage download progress
     * @returns {undefined}
     */
    this.set_download_progress = function (requestedModel, progress_value) {

        if (requestedModel === chosenModel) {
            var elem = document.getElementById("myBar" + chosenModel);
            var set_height = (1 - progress_value) * 100;
            var last_height = parseInt(elem.style.height);
            if (set_height < last_height) {
                elem.style.height = set_height +'%';
            }

            var l_info_text = $('#l_info_text');
            l_info_text.text("Downloading " + Math.floor(progress_value*100) +"%");
        }
    };

    this.done_download_progress = function () {

        // better use jquery
        var all_Bars = document.getElementsByClassName('myBar');
        var all_Bars_length = all_Bars.length;
        for (var i = 0; i < all_Bars_length; i++) {
            all_Bars[i].style.height = '0%';
        }

        var l_info_text = $('#l_info_text');
        l_info_text.text("Downloading Complete");

        setTimeout(function (){
            if (l_info_text.text() === "Downloading Complete")
                l_info_text.text("Select");
        }, 1500);
    };

    /**
     * To download object in selected scene as .stl
     * @function
     * @see mmf_object#download_stl
     */
    this.download_to_local = function () {
        if (is_login) {
            var save_to_local = true;
            that.model().download_stl(
                scenes_controller.get_scene(that.publish()),
                save_to_local
            );
        } else {
            localStorage.download = true;
            $('#loginscreen h3').text('Please login before downloading');
        }
    };

    /**
     * Initializing values for upload_form
     * @function
     */
    this.init_upload_form = function(){

        $("#upload_text h3").text("Edit object informations");
        $("#upload_in_progress p").text(" ");
        $('#upload_progress').css('width', 0+'%');

        var extra_description = ' Check it out ' + window.location.href;
        var upload_info = this.model().get_upload_info(extra_description);
        var model_name = upload_info.name;
        var model_description = upload_info.description;
        var model_tags = 'filter'; // that.filter();

        $("#upload_form input[name=\"name\"]").attr('value', model_name);
        $("#upload_form input[name=\"description\"]").attr('value', model_description);
        $("#upload_form input[name=\"tags\"]").attr('value', model_tags);

        var $button = $("#upload_form input[type=\"button\"]");
        $button.css("width", 26+"%");
        $button.css('opacity', 1.0);
        $button.removeClass("close-reveal-modal");//remove add foundation close function
        $button.attr("value", "CONFIRM");
        $button.attr("id", "upload_done"); // style to overwrite close-reveal-style


        $("#upload_form input[type=\"text\"]").removeAttr('disabled');
    };

    /**
     * If the user is logged in, starts the upload process
     * with values of the upload form
     * @function
     */
    this.init_upload_progress = function () {

        if (!is_login) { // not login
            localStorage.upload = true;
            $('#loginscreen h3').text('Please, login before publishing');
        } else{


            var save_to_local = false;
            var blob = that.model().download_stl(
                scenes_controller.get_scene(that.publish()),
                save_to_local
            );

            that.init_upload_form();

            // open form
            $('#upload_form').foundation('reveal', 'open');

            var $button = $("#upload_form input[type=\"button\"]");
            /* removes the click link to 'view on MMF'  */
            $button.off('click');
            $button.click( function(){
                            that.model().upload_file(
                                blob,
                                that.set_upload_progress,
                                that.done_upload_progress,
                                $('#upload_form input[name=\"name\"]').val(),
                                $('#upload_form input[name=\"description\"]').val(),
                                $('#upload_form input[name=\"tags\"]').val(),
                                $button.css('opacity', 0.5)
                            );
                }
            );
        }

    };

    /**
     * Called during upload progress to set progress bar value and text.
     * @function
     * @param {string|number} value - The title of the book.
     */
    this.set_upload_progress = function (value) {
        $("#upload_form input[type=\"button\"]").off('click'); // remove click while uploading
        if(typeof(value) === 'number'){
            if(value != NaN && value != Infinity){
                var elem = document.getElementById("upload_progress");
                elem.style.width = value*100 + '%';
            }
        }else if(typeof(value) === 'string'){
            $("#upload_in_progress p").text(value);
        }else{
            console.error('Wrong type of input value');
        }
    };

    /**
     * When the upload is done, changes displayed text,
     * disables the upload form inputs and add 'View on MMF' link.
     * @function
     * @param {string} url - url of the uploaded object on MMF.
     */
    this.done_upload_progress = function (url) {
        $("#upload_text h3").text("Upload complete !");
        $("#upload_form input[type=\"text\"]").attr('disabled', 'disabled');

        var $button = $("#upload_form input[type=\"button\"]");
        $button.attr("value", "View object on MyMiniFactory");
        $button.css('opacity', 1.0);
        $button.css("width", 100+"%");
        $button.click( function () {
            window.open(url, '_blank');
        });

    };

    /**
     * Put loading text to frame
     * This will actually remove the inner div of frame
     *
     * @returns {undefined}
     */
    this.put_loading_text = function (i) {
        $(".frame:eq(" + i + ")").html("Loading...");
    };

    /**
     * remove loading text from frame
     * hack from add back the inner div to frame
     *
     * @param {number} i - index indicates frame
     * @returns {undefined}
     */
    this.remove_loading_text = function(i){
        $(".frame:eq(" + i + ")").html("<div></div>");
    };

    function _get_data() {
        return {
            frame: chosenFrame,
            model: window.model_bi_dict[chosenModel],
            target: window.target_bi_dict[chosenTarget],
            filter: window.filter_bi_dict[chosenFilter]
        }
    }

    function _update_url() {
        var url = [location.protocol, '//', location.host, location.pathname].join('');
        var data = _get_data();
        var update_url = url + '?' + $.param(data);
        window.history.pushState(data, "", update_url);

        // change the upload form referer value
        $("input[name=_target_path]").val(update_url);
    }

};

/**
 * Read css from DOM and calculate the correct layout
 * This function should never change any states.
 *
 * @returns {Object} used_value - used for setting css
 */
window.position_calculator = function () {

    var used_value = {};

    var windowWidth = $("#customizer_container").width();
    var containerWidth = $("#container").width();
    used_value['containerWidth'] = containerWidth;
    used_value['windowWidth'] = windowWidth;

    var width_middle_column = (containerWidth - (controller.width_l_column() + controller.width_r_column()))-28; // 28 is hack
    var margin = 20;
    var canvas_width = width_middle_column - margin*2; // 40 is the margin of #scene_holder

    var renderer_width = 0;
    var renderer_height = 0;
    var column, fix;

    // used for scenes_holder
    used_value['canvas_width'] = canvas_width;
    // used_value['canvas_height'] = canvas_height;

    if (canvas_width > 645){
        renderer_height = 550;
        renderer_width = 1200;
        column = 4;
        fix = 5;
    } else if (canvas_width > 350){
        renderer_height = 700;
        renderer_width = 730;
        column = 3;
        fix = 3;
    } else if (canvas_width > 250){
        renderer_height = 750;
        renderer_width = 450;
        column = 2;
        fix = 0;
    } else {
        // console.error('in very small canvas_width'); // since the minwidth for container this nerver happen
    }

    var scene_width = (canvas_width / column) - (margin / 2) - fix;

    used_value['renderer_height'] = renderer_height;
    used_value['renderer_width'] = renderer_width;
    used_value['scene_width'] = scene_width;

    var this_scene_top = renderer_height - scene_width; //
    var scene_counter = 0;
    var margin_counter = 0;
    var display = 'initial';
    var this_scene_left = 0;

    var doc = document.documentElement;

    var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

    var screen_left = $(".screen").position().left + controller.width_l_column() + 20 + 10; // hardcoded
    var screen_position_top = $(".screen").position().top + top;

    for (var i = 0; i < GLOBAL.number_of_scene; i++) {
        if (controller.filter() === 'lowpoly') {
            if (i > 3) {
                display = 'none';
            }
        }

        if (this_scene_left > canvas_width){

            scene_counter++;
            this_scene_left = 0;
            this_scene_top -= scene_width + margin;
        }

        var frame_top = screen_position_top + 70 + (scene_width * scene_counter) + margin*scene_counter - top;
        var frame_left = screen_left + this_scene_left;

        used_value['scene' + i + 'left'] = this_scene_left;
        used_value['scene' + i + 'top'] = this_scene_top;
        used_value['frame' + i + 'top'] = frame_top;
        used_value['frame' + i + 'left'] = frame_left;
        used_value['frame' + i + 'display'] = display;

        this_scene_left += scene_width + margin;
    }

    used_value['canvas_height'] = renderer_height;

    return used_value;
};

// window.load_page = function (url){
//     var frame = getParameterByName("frame", url);
//     var model = getParameterByName("chosenModel", url);
//     var target = getParameterByName("chosenTarget", url);
//     var array = controller.getFilterArray();
//     console.log('array: '+array);
//     var filter = array.indexOf(getParameterByName("filter", url));
//     console.log(frame, model, target, filter);
//     if ((frame !== undefined) &&(model !== undefined )&&(target!== undefined )&&(filter!== undefined)) {
//         window.controller = new App(frame,model,target,filter);
//         // location.reload();
//     }
// };


}());
