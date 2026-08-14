class CommunicationManager:

    def __init__(self):

        self.messages = []

    def send_message(
        self,
        sender,
        receiver,
        message
    ):

        communication = {

            "from": sender,

            "to": receiver,

            "message": message
        }

        self.messages.append(
            communication
        )

    def get_messages(self):

        return self.messages