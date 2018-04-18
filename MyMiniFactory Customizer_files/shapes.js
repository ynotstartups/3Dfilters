"use strict";

function ImplicitJSScript(func) {
    // this.matrix = matrix;
    this.func = func;
}

ImplicitJSScript.length3 = function (x, y, z) {return Math.sqrt(x*x + y*y + z*z);};

ImplicitJSScript.length2 = function (x, y) {return Math.sqrt(x*x + y*y);};

ImplicitJSScript.prototype.eval_implicit = function (x, y, z) {
    return this.func(x, y, z);
};

ImplicitJSScript.prototype.prepare_sdf = function(origin_shape) {

    var start = new Date();

    var mc_resolution_z = origin_shape.size_z;
    var mc_resolution_y = origin_shape.size_y;
    var mc_resolution_x = origin_shape.size_x;

    this.sdf = new Array(mc_resolution_z*mc_resolution_y*mc_resolution_x);
    var sdf = this.sdf;
    var number_of_scene = window.GLOBAL.number_of_scene;
    var mc_bbox_start = window.GLOBAL.mc_bbox_start;

    var result = window.cal_mc_increment_value(mc_resolution_x, mc_resolution_y, mc_resolution_z);

    var mc_grid_increment_x = result[0];
    var mc_grid_increment_y = result[1];
    var mc_grid_increment_z = result[2];

    var count = 0;
    for(var k=0, z=mc_bbox_start; k<mc_resolution_z; ++k, z+=mc_grid_increment_z) {
        for(var j=0, y=mc_bbox_start; j<mc_resolution_y; ++j, y+=mc_grid_increment_y) {
            for(var i=0, x=mc_bbox_start; i<mc_resolution_x; ++i, x+=mc_grid_increment_x) {
                sdf[count] = this.eval_implicit(x,y,z);
                count += 1;
            }
        }
    }

};

function ImplicitSdf_3d(size_x,
                        size_y,
                        size_z,
                        grid_size,
                        origin_x,
                        origin_y,
                        origin_z,
                        sdf)
{
    // this.matrix = matrix;
    this.size_x = size_x;
    this.size_y = size_y;
    this.size_z = size_z;
    this.grid_size = grid_size;
    this.origin_x = origin_x;
    this.origin_y = origin_y;
    this.origin_z = origin_z;

    this.end_x = this.origin_x + this.grid_size*this.size_x;
    this.end_y = this.origin_y + this.grid_size*this.size_y;
    this.end_z = this.origin_z + this.grid_size*this.size_z;

    const length = sdf.length;
    const factor = 8/(grid_size*(size_x + size_y + size_z));

    this.sdf = new Float32Array(length);
    for (let i=0;i<length;i++) {
        this.sdf[i] = factor * sdf[i];
    }

}

ImplicitSdf_3d.interpolate = function(x, start, end) {
    // intepolate to -1 to 1 based on start to end
    return (x + 1)*(end - start)/2 + start;
};

ImplicitSdf_3d.prototype.eval_implicit = function (x, y, z) {

    x = ImplicitSdf_3d.interpolate(x, this.origin_x, this.end_x);
    y = ImplicitSdf_3d.interpolate(y, this.origin_y, this.end_y);
    z = ImplicitSdf_3d.interpolate(z, this.origin_z, this.end_z);

    if ((x < this.origin_x) || (x > this.end_x)) {
        return 10000;
    } else if ((y < this.origin_y) || (y > this.end_y)) {
        return 10000;
    } else if ((z < this.origin_z) || (z >  this.end_z)) {
        return 10000;
    } else {
    }

    var x_grid_coor =  Math.floor((x - this.origin_x)/this.grid_size);
    var y_grid_coor =  Math.floor((y - this.origin_y)/this.grid_size);
    var z_grid_coor =  Math.floor((z - this.origin_z)/this.grid_size);

    var x_grid_coor_plus_one =  x_grid_coor + 1;
    var y_grid_coor_plus_one =  y_grid_coor + 1;
    var z_grid_coor_plus_one =  z_grid_coor + 1;

    var x_grid_value_low = this.origin_x +  x_grid_coor * this.grid_size;
    var y_grid_value_low = this.origin_y + y_grid_coor * this.grid_size;
    var z_grid_value_low = this.origin_z + z_grid_coor * this.grid_size;

    // https://en.wikipedia.org/wiki/Trilinear_interpolation
    var x_d = (x - x_grid_value_low)/this.grid_size;
    var y_d = (y - y_grid_value_low)/this.grid_size;
    var z_d = (z - z_grid_value_low)/this.grid_size;

    var res_000 = this.sdf[x_grid_coor + y_grid_coor*this.size_x + z_grid_coor*this.size_x*this.size_y];
    var res_100 = this.sdf[x_grid_coor_plus_one + y_grid_coor*this.size_x + z_grid_coor*this.size_x*this.size_y];
    var res_010 = this.sdf[x_grid_coor + y_grid_coor_plus_one*this.size_x + z_grid_coor*this.size_x*this.size_y];
    var res_110 = this.sdf[x_grid_coor_plus_one + y_grid_coor_plus_one*this.size_x + z_grid_coor*this.size_x*this.size_y];
    var res_001 = this.sdf[x_grid_coor + y_grid_coor*this.size_x + z_grid_coor_plus_one*this.size_x*this.size_y];
    var res_101 = this.sdf[x_grid_coor_plus_one + y_grid_coor*this.size_x + z_grid_coor_plus_one*this.size_x*this.size_y];
    var res_011 = this.sdf[x_grid_coor + y_grid_coor_plus_one*this.size_x + z_grid_coor_plus_one*this.size_x*this.size_y];
    var res_111 = this.sdf[x_grid_coor_plus_one + y_grid_coor_plus_one*this.size_x + z_grid_coor_plus_one*this.size_x*this.size_y];

    var c_00 = res_000*(1 - x_d) + res_100*x_d;
    var c_01 = res_001*(1 - x_d) + res_101*x_d;
    var c_10 = res_010*(1 - x_d) + res_110*x_d;
    var c_11 = res_011*(1 - x_d) + res_111*x_d;

    var c_0 = c_00*(1 - y_d) + c_10*y_d;
    var c_1 = c_01*(1 - y_d) + c_11*y_d;

    var res = c_0*(1 - z_d) + c_1*(z_d);


    if (isNaN(res)) { // is this still possible
        // console.error('res is nan ' + res);
        res = 10000;
    }

    return res;
};

ImplicitSdf_3d.prototype.get_mc_resolution = function () {
    return [this.size_x, this.size_y, this.size_z];
};


ImplicitSdf_3d.make_mp5_from_sdf = function(sdf_string) {
    console.time("parsing time");
    var lines = sdf_string.split('\n');
    sdf_string = "";

    var grid_list = lines[0].split(' ');
    var size_x = parseInt(grid_list[0]);
    var size_y = parseInt(grid_list[1]);
    var size_z = parseInt(grid_list[2]);

    var origin_list = lines[1].split(' ');
    var origin_x = parseFloat(origin_list[0]);
    var origin_y = parseFloat(origin_list[1]);
    var origin_z = parseFloat(origin_list[2]);

    var grid_size = parseFloat(lines[2]);

    var sdf = new Float32Array(lines.length - 1 - 3);;
    //the value start at line 3,  -1 since there is a extra line in sdf file
    for(var i = 3;i < lines.length - 1;i++){
        // sdf.push(parseFloat(lines[i])*factor);
        sdf[i - 3] = parseFloat(lines[i]);
    }
    console.timeEnd("parsing time");

    return new ImplicitSdf_3d(size_x,size_y,size_z,
                        grid_size,
                        origin_x,origin_y,origin_z,sdf);
};

