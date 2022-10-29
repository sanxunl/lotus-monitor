from datetime import datetime, date, timedelta
import os
import subprocess as sp
import time
import sys
sys.path.append('../util')
from hutil import get_config, server_post, server_alert, get_output

n_id = '1'
is_node = False
is_miner = False
is_worker = False

def update_config():
    print('update_config')
    global n_id, is_node, is_miner, is_worker
    try:
        config = get_config()
        print(config)
        n_id = config['id']
        is_node = config['is_node'] == 1 and True or False
        is_miner = config['is_miner'] == 1 and True or False
        is_worker = config['is_worker'] == 1 and True or False
        start_task()
    except Exception as e:
        print("Fail to get config: ")
        print(e)
    return

def check_winning():
    global n_id
    out = sp.getoutput("cat ~/lotus/log/miner.log | grep 'completed mineOne' | wc -l")
    curr_time = datetime.now()
    start_time = ''
    if int(curr_time.strftime('%H')) < 8 or (int(curr_time.strftime('%H')) < 8 and  int(curr_time.strftime('%M')) < 30):
        start_time = (date.today() + timedelta(days=-1)).strftime('%Y-%m-%d 08:30:00')
    else:
        start_time = curr_time.strftime('%Y-%m-%d 08:30:00')
    data = {
        "n_id": n_id,
        "created_time": datetime.now(),
        "count_mineone": out.strip(),
        "start_time": start_time
    }
    server_post("l_m_winning", data)
    return

def check_mpool():
    global n_id
    out = get_output('lotus mpool pending --local | wc -l')
    data = {
        "n_id": n_id,
        "created_time": datetime.now(),
        "count_pending": out.strip()
    }
    server_post("l_n_mpool", data)
    return

def check_sync():
    global n_id
    maxDiff = 0
    is_done = 0
    try:
        out = get_output('lotus sync wait')
        if out.find('Done!') > 0:
            is_done = 1
        start_index = out.find('(diff:') + 7
        end_index = out.find(')', start_index)
        maxDiff = out[start_index: end_index]
    except Exception as e:
        is_done = 0
        out = get_output('lotus sync status')
        maxDiff = 0
        list1 = out.split('\n')
        for rowstr in list1:
            rowstr = rowstr.replace('\t', '')
            if rowstr.startswith('Height diff'):
                sub_list = rowstr.split(':')
                diff = int(sub_list[1])
                if diff > maxDiff:
                    maxDiff = diff
    data = {
        "n_id": n_id,
        "created_time": datetime.now(),
        "max_diff": maxDiff,
        "is_done": is_done 
    }
    server_post("l_n_sync", data)
    return

def check_hd():
    global n_id
    check_mount = "/workspace"
    out = sp.getoutput("df")
    list1 = out.split('\n')
    for rowstr in list1:
        sub_list = rowstr.split(' ')
        mounted = sub_list[len(sub_list)-1]
        if mounted.startswith(check_mount):
            new_sub_list = []
            for subrow in sub_list:
                if subrow:
                     new_sub_list.append(subrow)
            data = {
                "n_id": n_id,
                "created_time": datetime.now(),
                "size": new_sub_list[1],
                "used": new_sub_list[2],
                "avail": new_sub_list[3],
                "use_pct": new_sub_list[4],
                "mounted_on": new_sub_list[5],
            }
            server_post("l_c_hd", data)
            break
    return

def check_ram():
    global n_id
    out = sp.getoutput("free")
    list1 = out.split('\n')
    for rowstr in list1:
        sub_list = rowstr.split(' ')
        if sub_list[0] == 'Mem:':
            new_sub_list = []
            for subrow in sub_list:
                if subrow:
                     new_sub_list.append(subrow)
            data = {
                "n_id": n_id,
                "created_time": datetime.now(),
                "total": new_sub_list[1],
                "used": new_sub_list[2],
                "free": new_sub_list[3],
                "shared": new_sub_list[4],
                "cache": new_sub_list[5],
                "available": new_sub_list[6],
            }
            server_post("l_c_ram", data)
            break
    return

def check_cpu():
    global n_id
    out = sp.getoutput("top -bn 1 -i -c")
    list1 = out.split('\n')
    for rowstr in list1:
        if rowstr.startswith('%Cpu(s)'):
            rowstr = rowstr.replace('%Cpu(s):', '')
            sub_list = rowstr.split(',')
            data = {
                "n_id": n_id,
                "created_time": datetime.now(),
                "us": sub_list[0].replace('us','').strip(),
                "sy": sub_list[1].replace('sy','').strip(),
                "ni": sub_list[2].replace('ni','').strip(),
                "iid": sub_list[3].replace('id','').strip(),
                "wa": sub_list[4].replace('wa','').strip(),
                "hi": sub_list[5].replace('hi','').strip(),
                "si": sub_list[6].replace('si','').strip(),
                "st": sub_list[7].replace('st','').strip()
            }
            server_post("l_c_cpu", data)
            break
    return

def check_net():
    out = get_output('ping -c 4 alidns.com')
    if out.find('Name or service not known') > 0:
        server_alert("DNS无法解析，请及时排查！")
    else:
        out = out[out.find('ping statistics ---')+20:out.find('rtt min/avg/max/mdev')-1]
        list1 = out.split(',')
        for rowstr in list1:
            rowstr = rowstr.strip()
            if rowstr.endswith('packet loss'):
                value = rowstr.split('%')[0]
                if int(value) > 0:
                    server_alert("网络丢包" + value + "%，请及时排查！")
    return

def check_nvidia():
    global n_id
    out = sp.getoutput("nvidia-smi")
    if out.find("GeForce RTX") == -1:
        server_alert("显卡驱动故障，请及时排查！")
    else:
        list1 = out.split('\n')
        is_start = False
        new_list = []
        for rowstr in list1:
            if rowstr.startswith('|=============='):
                is_start = True
            elif is_start and rowstr.startswith('              '):
                break
            elif is_start and rowstr.startswith('| '):
                sub_list = rowstr.split(' ')
                new_sub_list = []
                for subrow in sub_list:
                    if subrow:
                        new_sub_list.append(subrow)
                new_list.append(new_sub_list)
        data = {
            "n_id": n_id,
            "created_time": datetime.now(),
        }
        if len(new_list) >= 3:
            data['fan1'] = new_list[1][1].replace('%', '')
            data['usage1'] = new_list[1][4].replace('W', '')
            data['cap1'] = new_list[1][6].replace('W', '')
            data['temp1'] = new_list[1][2].replace('C', '')
            data['memory1'] = new_list[1][10].replace('MiB', '')
            data['mem-usage1'] = new_list[1][8].replace('MiB', '')
            data['gpu-util1'] = new_list[1][12].replace('%', '')
        if len(new_list) >= 6:
            data['fan2'] = new_list[4][1].replace('%', '')
            data['usage2'] = new_list[4][4].replace('W', '')
            data['cap2'] = new_list[4][6].replace('W', '')
            data['temp2'] = new_list[4][2].replace('C', '')
            data['memory2'] = new_list[4][10].replace('MiB', '')
            data['mem-usage2'] = new_list[4][8].replace('MiB', '')
            data['gpu-util2'] = new_list[4][12].replace('%', '')
        server_post('l_c_gpu', data)
    return

def check_lotus_pid():
    out = sp.getoutput("echo $(pidof lotus)")
    if out.strip():
        print('check_lotus_pid true')
    else:
        server_alert("Lotus进程丢失，请及时排查！")
    return

def check_miner_pid():
    commd = "echo $(pidof lotus-miner)"
    out = sp.getoutput(commd)
    print(out)
    if out.strip():
        print('check_miner_pid true')
    else:
        time.sleep(5)
        print('check_miner_pid check 2')
        out = sp.getoutput(commd)
        print(out)
        if out.strip():
            print('check_miner_pid true')
        else:
            server_alert("Miner进程丢失，请及时排查！")
    return

def start_task():
    #--------- check_hd 硬盘 ---------#
    try:
        check_hd()
    except Exception as e:
        print("Fail to check_hd: ")
        print(e)
    #--------- check_ram 内存 ---------#
    try:
        check_ram()
    except Exception as e:
        print("Fail to check_ram: ")
        print(e)
    #--------- check_cpu CPU ---------#
    try:
        check_cpu()
    except Exception as e:
        print("Fail to check_cpu: ")
        print(e)
    #--------- check_net 网络 ---------#
    try:
        check_net()
    except Exception as e:
        print("Fail to check_net: ")
        print(e)
    #--------- node check_lotus_pid lotus进程 ---------#
    try:
        if is_node:
            print('check_lotus_pid')
            check_lotus_pid()
    except Exception as e:
        print("Fail to check_lotus_pid: ")
        print(e)
    #--------- node check_mpool 消息池 ---------#
    try:
        if is_node:
            print('check_mpool')
            check_mpool()
    except Exception as e:
        print("Fail to check_mpool: ")
        print(e)
    #--------- node check_sync 同步 ---------#
    try:
        if is_node:
            print('check_sync')
            check_sync()
    except Exception as e:
        print("Fail to check_sync: ")
        print(e)
    #--------- node check_miner_pid miner进程 ---------#
    try:
        if is_miner:
            print('check_miner_pid')
            check_miner_pid()
    except Exception as e:
        print("Fail to check_miner_pid: ")
        print(e)
    #--------- check_nvidia 检查显卡 ---------#
    try:
        if is_miner:
            print('check_nvidia')
            check_nvidia()
    except Exception as e:
        print("Fail to check_nvidia: ")
        print(e)
    #--------- miner check_winning 选举 ---------#
    try:
        if is_miner:
            print('check_winning')
            check_winning()
    except Exception as e:
        print("Fail to check_winning: ")
        print(e)
    return

def main():
    update_config()
    return

if __name__ == "__main__":
    main()