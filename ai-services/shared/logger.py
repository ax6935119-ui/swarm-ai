import logging


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


system_logger = logging.getLogger("system_logger")

agent_logger = logging.getLogger("agent_logger")

error_logger = logging.getLogger("error_logger")


system_handler = logging.FileHandler("logs/system.log")

agent_handler = logging.FileHandler("logs/agent.log")

error_handler = logging.FileHandler("logs/errors.log")


system_logger.addHandler(system_handler)

agent_logger.addHandler(agent_handler)

error_logger.addHandler(error_handler)