import logging
import os

def get_request_logger(request_id):
    log_directory = "./logs"
    log_filename = f"{log_directory}/{request_id}.log"

    # Ensure that the logs directory exists
    os.makedirs(log_directory, exist_ok=True)

    logger = logging.getLogger(request_id)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        # Create a file handler for each request
        file_handler = logging.FileHandler(log_filename)
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
        logger.addHandler(file_handler)

    return logger
