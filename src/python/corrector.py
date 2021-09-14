import sys
import time
import string
import random
import json
import os
import subprocess
import pathlib

def get_dummy_result():
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(255))
 
def get_dummy_status(): 
    return "success" if random.randint(0, 1) else "fail"

def gcc_compile(assignment_file):
    path, filename = os.path.split(os.path.abspath(assignment_file))
    # replace extension with .out to filename
    filename = pathlib.Path(filename).with_suffix('.out')
    gcc_compile = subprocess.run([
        "gcc",
        assignment_file,
        "-Wno-format",
        "-Wno-implicit-int",
        "-Wno-implicit-function-declaration",
        f"-I{os.environ['ROBERTS_LIB']}/include",
        "-lm",
        f"{os.environ['ROBERTS_LIB']}/lib/roberts.lib",
        "-o",
        f"{path}/{filename}"
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return gcc_compile.stdout.decode('utf-8')
 

def run():
    if 'ROBERTS_LIB' not in os.environ: 
        raise Exception('Roberts library is not defined')

    try:
        assignment_file = sys.argv[1] 
        configuration_file = sys.argv[2]  
    except:
        assignment_file = "Unable to load configuraton file"
        configuration_file = "Unable to load configuraton file" 

    time.sleep(5)
 
    response = {
        'result': "GCC Compile: " + gccCompile(assignment_file),
        'status': get_dummy_status(),
        'debug': 'Configuration: ' + configuration_file
    }
    
    print(json.dumps(response))
    sys.stdout.flush()


if __name__ == '__main__':
    run()
