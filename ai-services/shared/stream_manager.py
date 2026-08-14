class StreamManager:

    def __init__(self):

        self.logs = []

    async def send_log(
        self,
        websocket,
        message
    ):

        log = {
            "type": "agent_log",
            "message": message
        }

        self.logs.append(log)

        await websocket.send_json(log)