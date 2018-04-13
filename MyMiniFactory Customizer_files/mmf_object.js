"use strict";

/**
 * Represents an 3d objetcts.
 * @constructor
 * @param {number} object_id
 * @param {Object.<string, string>} data - MMF api response (dictionnary)
 */
function object_mmf(object_id, data) {

    ////////////// CONSTRUCTOR
    var sdf;
    var name;
    var description;
    var tags;
    var sdf_download_url;
    this.thumbnail;
    var filtered_obj = '';
    this.model;
    this.lowpoly_300_url;
    this.lowpoly_600_url;
    this.lowpoly_1k_url;
    var mmf_id = data.id;
    var that = this;
    var upload_info; // private member that holds upload info (it's a dict)

    var upload_id_url = 'https://www.myminifactory.com/api/v2/file?upload_id=';
    var upload_url = 'https://www.myminifactory.com/api/v2/object';
    var client_url = 'https://www.myminifactory.com/';
    var object_url = 'https://www.myminifactory.com/object/';
    var download_log_url = 'https://www.myminifactory.com/downloadfile/downloadlog/'+mmf_id;

    // if (accessToken === '') {
    // if (false) { // if user not logged in
    //     $.ajax({
    //         type: 'GET',
    //         url: "https://www.myminifactory.com/api/v2/objects/" + object_id,
    //         data: {'key': api_key},
    //         success: function(data, status) {
    //             process_get_response(data);
    //         },
    //         error: function(data, status) {
    //             console.error('error', data, status);
    //         }
    //     });
    // } else {
    //     console.error('hardcoded accessToken delete last line');
    //     $.ajax({
    //         type: 'GET',
    //         url: "https://www.myminifactory.com/api/v2/objects/" + object_id,
    //         beforeSend: function(request) {
    //             request.setRequestHeader('Authorization','Bearer ' + accessToken);
    //         },
    //         success: function(data, status) {
    //             process_get_response(data);
    //         },
    //         error: function(data, status) {
    //             console.error('error', data, status);
    //         }
    //     });
    // }
    process_get_response(data);


    ////////////// PRIVATE FUNCTION
    function process_get_response(data) { // static method
        name = data.name;
        description = data.description;
        tags = data.tags;
        var files = data.files;
        if(data.images[0] !== undefined) {
            that.thumbnail = data.images[0].original.url;
        } else {
            console.log(name);
            that.thumbnail = '';
        }
        // that.thumbnail = '/thumbnails/model01.png'
        var files_items_length = files.items.length;
        for (var i=0;i<files_items_length;i++) {
            var item = files.items[i];
            var filename = item.filename;
            var file_extension = filename.slice(filename.length - 3, filename.length);

            if (file_extension === 'sdf') {

                that.model = item.download_url;
                // got_sdf_link_cb();

            } else if (file_extension === 'obj') {
                if (filename.includes('-lowpoly-300.obj')) {
                    that.lowpoly_300_url = item.download_url;
                } else if (filename.includes('-lowpoly-600.obj')) {
                    that.lowpoly_600_url = item.download_url;
                } else if (filename.includes('-lowpoly-1k.obj')) {
                    that.lowpoly_1k_url = item.download_url;
                } else {
                    console.error('unknown obj files');
                }

            } else {
                // console.log(filename);
            }
        }
        upload_info = { /*'name': name,
                        'description': description,
                        'tags': tags,
                        'client_url': 'https://www.myminifactory.com',
                        'files': [
                            {
                              'filename': name + '.stl',
                              'size': 1 // not used by api ??
                            }]*/
                    };

    }

    // function download_file(download_url, s_callback) { // instance method
    //     console.error('download file');
    //     $.ajax({
    //         type: 'GET',
    //         url: download_url,
    //         progress: function(e) {
    //             console.error('???');
    //             //make sure we can compute the length
    //             if(e.lengthComputable) {
    //                 //calculate the percentage loaded
    //                 var pct = (e.loaded / e.total) * 100;

    //                 //log percentage loaded
    //                 console.log(pct);
    //             }
    //             //this usually happens when Content-Length isn't set
    //             else {
    //                 console.warn('Content Length not reported!');
    //             }
    //         },
    //         success: function(data, status) {
    //             s_callback(data);
    //         },
    //         error: function(data, status) {
    //             console.error('download_file error', data, status);
    //         }
    //     });

    // }

    /**
     * Get the filtered object name.
     * @function
     * @private
     * @return the object name + 'filtered' postfix.
     */
    function get_filtered_object_name() {
        if (name !== undefined) {
            return name + ' filtered';
        } else {
            console.error('name is undefined');
        }
    }

    this.get_objet_name = get_filtered_object_name;

    /**
     * Get the filtered object tags that is the filter.
     * @function
     * @private
     */
    function get_tags() {
        if (tags !== undefined) {
            if (!(tags.includes('filter'))){
                tags.push('filter');
            }

        } else {
            console.error('name is undefined');
        }
    }

    /**
     * Get the filtered object description. Makes sure at least
     * 'MyMiniFactory Filter App' is included in descriptions.
     * @function
     * @private
     * @return the description.
     */
    function get_description() {

        var filter_description = 'This file is generated by MyMiniFactory Filter App. ';
        if (description !== undefined) {
            if (typeof description !== 'string' ) {
                description += filter_description;
            }
            if (!(description.includes('MyMiniFactory Filter App'))){
                description += ' '+filter_description;
            }
        } else {
            console.error('name is undefined');
        }

        return description;
    }

    /**
     * Upload object on specific url.
     * @function
     * @private
     * @param {Blob} blob
     * @param {string} upload_id - id of uploaded object
     * @param {string} url - url of uploaded object
     * @param {callback} set_upload_cb - set_upload_progress callback
     * @param {callback} done_upload_cb - done_upload_progress callback
     */
    function upload_obj(blob, upload_id, url, set_upload_cb, done_upload_cb) {
        //sending blob, dont know how to use jquery
        var oReq = new XMLHttpRequest();
        oReq.open("POST",
            upload_id_url+upload_id,
            true);
        oReq.setRequestHeader('Authorization','Bearer ' + accessToken);
        oReq.onload = function (oEvent) {
            set_upload_cb('Done !');
            done_upload_cb(url);
        };
        oReq.upload.addEventListener("progress", function(evt) {
         if (evt.lengthComputable) {
             var percentComplete = evt.loaded / evt.total;
             percentComplete = 0.7*percentComplete + 0.3;// hard coded number
             set_upload_cb(percentComplete);
         }
        }, false);
        oReq.send(blob);

    }


    ////////////// GLOBAL FUNCTION
    this.download_stl = function(scene, save_to_local) {
        var stl_file = (new THREE.STLBinaryExporter).parse(scene);
        var file = new Blob([stl_file], {type: 'text/plain'});

        if (save_to_local) {
            saveAs(file, get_filtered_object_name() + '.stl');
            $.get(download_log_url, function () {console.log('logged')});
        } else {
            return file;
        }

    };

    this.get_upload_info = function(extra_description){
        return {
            "name": get_filtered_object_name(),
            "description": get_description() + extra_description,
            "client_url": client_url,
            "tags": get_tags(),
            "files": [
                {
                  "filename": get_filtered_object_name() + '.stl',
                  "size": 1 // not used by api ??
                }]
        };
    };

    function set_upload_info (name, description, tags){

        upload_info.name = name;
        upload_info.description = description;
        upload_info.tags = tags;
        upload_info.files = [ { 'filename': name + '.stl',
                              'size': 1 // not used by api ??
                            }];

    }

    /**
     * Upload object with info from uploaded form entries.
     * @function
     * @private
     * @param {Blob} blob
     * @param {callback} set_upload_cb - set_upload_progress callback
     * @param {callback} done_upload_cb - done_upload_progress callback
     * @param {string} name
     * @param {string} description
     * @param {string} tags
     */
    this.upload_file = function (blob, set_upload_cb, done_upload_cb, name, description, tags) {

        //function frame() {
            //if (width >= 100) {
                //done = true;
                //controller.done_upload_progress(url);
                //clearInterval(id);
            //} else {
                //width++;
                //set_upload_cb(width) ;
            //}
        //}

        set_upload_info(name, description, tags);

        console.log(JSON.stringify(upload_info));
        set_upload_cb('Upload starts ... (Step 1/2)');
        set_upload_cb(0.1);
        $.ajax({
             type:'POST',
             url: upload_url,
             beforeSend: function (request) {
                 request.setRequestHeader('Authorization','Bearer ' + accessToken);
             } ,
             error: function(data, status) {
                set_upload_cb('Upload error');
                 console.error('upload_file error', data, status);
             },
             success: function(data, status) {
                 // process data to get upload id
                 if (data.files.length !== 1) {
                     console.error('only support upload 1 file now');
                 }
                 set_upload_cb('Uploading file ... (Step 2/2)');
                 set_upload_cb(0.3);
                 var upload_object_url = object_url + data['id'];
                 upload_obj(blob, data.files[0].upload_id, upload_object_url, set_upload_cb, done_upload_cb);
             },
             data: JSON.stringify(upload_info)
         });

    };
}
