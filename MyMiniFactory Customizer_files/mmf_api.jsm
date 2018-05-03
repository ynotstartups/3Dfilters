// js module for using MyMiniFactory API for searching

var access_token = "7faa7126-d67c-4930-931b-2b6f40bf7827";
const api_base_url = "https://www.myminifactory.com/api/v2/";

/**
 * raw result get from calling MMF search
 * return object with only single file
 *
 */
function filter_search_result(q_result) {
    console.log(q_result);
    const res = JSON.parse(q_result);
    const filter_res = [];
    res.items.forEach(function (item) {
        const files = item.files;
        if (files.total_count === 1) {
            filter_res.push(files.items[0]);
        }
    console.log(filter_res);
    });
    return q_result;
}

/**
 * search for scan the world return filtered result
 * @param query string
 * @return array with name picture and file download link
 *
 */
export function search(query, cb) {
    // hardcoded scan the world category
    const url = api_base_url + "search?cat=112&q=" + query;

    var Req = new XMLHttpRequest();
    Req.onload = res => cb(filter_search_result(res.target.response));
    Req.open("GET", url);
    Req.setRequestHeader('Authorization','Bearer ' + access_token);
    Req.send();
}

/**
 * get the filtered object name.
 * @param file_id number
 * @return mesh blob
 *
 * search for scan the world
 * filter object with single file
 */
export function download(file_id) {
}

// return inherit mmf_object
