import os
import subprocess as sp
import requests

base_url = 'http://127.0.0.1:8099/'
n_id = '1'

def get_config():
    global base_url, n_id
    config = {}
    try:
        file_path = "~/.dc_config"
        if os.path.exists(file_path):
            config_file = open(file_path)
            config_file_str = config_file.read()
            array1 = config_file_str.split('\n')
            for row1 in array1:
                if row1:
                    array2 = row1.split('=')
                    if array2[0] == 'n_id':
                        n_id = array2[1]
                        break
        url = base_url + 'config/' + n_id
        req = requests.get(url)
        config = req.json()
    except Exception as e:
        print("Fail to get config: ")
        print(e)
    return config

def server_post(table, data):
    global base_url
    api = base_url + 'save/' + table
    try:
        print(api)
        print(data)
        req = requests.post(api,data = data)
        print(str(req))
    except Exception as e:
        print("Fail to send server_post: " + table)
        print(e)
    return

def server_alert(msg):
    global base_url, n_id
    api = base_url + 'alert'
    try:
        data = {
            "n_id": n_id,
            "text": msg
        }
        print(api)
        print(data)
        req = requests.post(api, data = data)
        print(str(req))
    except Exception as e:
        print("Fail to send server_alert: " + msg)
        print(e)
    return

def get_output(cmd):
    LOTUS_PATH = '~/lotus/.lotus'
    LOTUS_MINER_PATH = '~/lotus/.lotus_miner'
    FULLNODE_API_INFO = ''
    miner_sh_path = '~/miner.sh'
    if os.path.isfile(miner_sh_path):
        f = open(miner_sh_path)
        for x in f:
            if x.startswith('export FULLNODE_API_INFO='):
                FULLNODE_API_INFO = x.replace('export FULLNODE_API_INFO=', '').strip()
                break
        f.close()
    my_env = {'LOTUS_PATH': LOTUS_PATH, 'LOTUS_MINER_PATH': LOTUS_MINER_PATH}
    if FULLNODE_API_INFO.strip():
        my_env['FULLNODE_API_INFO'] = FULLNODE_API_INFO
    print(my_env)
    proc = sp.Popen(cmd, shell=True, stdout=sp.PIPE, env=my_env)
    outs = proc.communicate(timeout=10)[0].decode("utf-8")
    return outs
