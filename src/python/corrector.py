import sys
import time
import string
import random
import json

def get_dummy_result():
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(255))

def get_dummy_status():
    return "success" if random.randint(0, 1) else "fail"

def run():
    try:
        assignment_file = sys.argv[1]
        configuration_file = sys.argv[2]
    except:
        assignment_file = "Unable to load assignment file"
        configuration_file = "Unable to load configuraton file"

    time.sleep(3)
    
    response = {
        'result': get_dummy_result(),
        'status': get_dummy_status()
    }
    
    print(json.dumps(response))
    sys.stdout.flush()


if __name__ == '__main__':
    run()
