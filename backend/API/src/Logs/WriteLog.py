from flask import request
from src.Logs.GetLogger import get_request_logger
import time

logger = None

def write_log(log):
    global logger

    st = time.time()
    logger = get_request_logger(request.request_id)
    logger.info(log)
    et = time.time()