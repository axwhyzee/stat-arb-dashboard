import datetime
import time


MSG_TYPE_MAPPING = {
    1: '+',
    2: '-',
    3: '.'
}


def epoch_to_datetime(epoch: int):
    '''
    Convert unix timestamp to dd-mm-YYYY HH-MM format

    :param int epoch: Unix timestamp
    :return: Datestring in dd-mm-YYYY HH-MM format
    :rtype: str
    '''
    return datetime.datetime.fromtimestamp(epoch).strftime('%d-%m-%Y %H:%M')


def log(msg, msg_type):
    '''
    Log a message

    :param str msg: Message to be logged
    :param int msg_type: Type of message, i.e., 1: Success, 2: Error, 3: Info
    '''
    print(f'[{MSG_TYPE_MAPPING[msg_type]}] [{epoch_to_datetime(time.time())}] {msg}')