#!/usr/bin/env python3
import numpy as np
import os

CONFIG = {}
CONFIG['sdf_padding'] = 2 # if it is only one there will be holes in boundary
CONFIG['desire_resolution'] = 50

def read_obj(filename):
    
    minx = 999999;
    maxx = -9999999;
    miny = 999999;
    maxy = -999999;
    minz = 9999999;
    maxz = -999999;
    vertices = []
    faces = []

    material = None
    for line in open(filename, "r"):
        if line.startswith('#'): continue
        values = line.split()
        if not values: continue
        if values[0] == 'v':
            v = list(map(float, values[1:4]))
            x = v[0];
            y = v[1];
            z = v[2];
            if x > maxx:
                maxx = x
            if x < minx:
                minx = x
            if y > maxy:
                maxy = y
            if y < miny:
                miny = y
            if z > maxz:
                maxz = z
            if z < minz:
                minz = z

            vertices.append(v)
        elif values[0] == 'vn': 
            continue
        elif values[0] == 'vt': 
            continue
        elif values[0] in ('usemtl', 'usemat'):
            continue
        elif values[0] == 'mtllib': 
            continue
        elif values[0] == 'f':
            face = []
            for v in values[1:]:
                w = v.split('/')
                face.append(int(w[0]))
            faces.append(face)
        
    
#     print(minx, maxx, miny, maxy, minz, maxz)
    range_x = maxx - minx
    range_y = maxy-miny
    range_z = maxz-minz
    
    step = np.cbrt(range_x*range_y*range_z)/52
    
    x_v = int(range_x/step) + 2*CONFIG['sdf_padding']
    y_v = int(range_y/step) + 2*CONFIG['sdf_padding']
    z_v = int(range_z/step) + 2*CONFIG['sdf_padding']
    
    print(x_v, y_v, z_v, x_v*y_v*z_v*4*2/(1024*1024), 'mb')

    
#     min_range = min(min(maxx - minx, maxy-miny), maxz-minz)
#     step = (min_range) / (CONFIG['desire_resolution'] - CONFIG['sdf_padding'])
#     print(padding)

    return vertices, faces, step

def run_sdfgen(filename, dx):
    command = "./bin/SDFGen {} {} {}".format(filename, dx, CONFIG['sdf_padding']);
    os.system(command)
    print(command)
    print('generated sdf for {}'.format(filename))

def stl_to_obj(filename):
    obj_name = filename[:-4] + '_clean.obj'
    clean_obj = Path(obj_name)
    if not clean_obj.is_file():
        print("obj for {} not exists".format(filename))
        command = "meshlabserver -i {} -o {}".format(filename, obj_name)
        os.system(command)
        
        if not clean_obj.is_file():
            print("Error generating {}".format(clean_obj))
    else:
        print("{} exists".format(obj_name))
        

def write_obj(vertices, faces, output_filename):
    file = ''
    for vertice in vertices:
        file += 'v {} {} {}\n'.format(*vertice)
    for face in faces:
        file += 'f {} {} {}\n'.format(*face)

    with open(output_filename, "w") as text_file:
        text_file.write(file)

import os
from pathlib import Path
from os import listdir
from os.path import isfile, join
count = 0
mypath = '.'
onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
# onlyfiles = ['acrolith-of-apollo-at-the-national-museum.obj']
for filename in onlyfiles:
    if filename[-4:] == '.stl':
        stl_to_obj(filename)

onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
for filename in onlyfiles:
    if filename[-4:] == '.obj':    
        count += 1
        sdf_filename = '{}.sdf'.format(filename[:-4])


        clean_obj = Path(sdf_filename)
        if not clean_obj.is_file():
            vertices, faces, step = read_obj(filename)
            print('dx will be', step)
            run_sdfgen(filename, step)
            print('sdf size {} MB'.format(float(os.stat(sdf_filename).st_size)/(1024*1024)))
            with open(sdf_filename, 'r') as f:
                first_line = f.readline()
            print(first_line)
        else:
            print("{} exsits".format(sdf_filename))
