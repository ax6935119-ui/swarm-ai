class GlobalContext:

    def __init__(self):

        self.shared_data = {}

    def update_context(

        self,

        agent_name,

        data
    ):

        self.shared_data[
            agent_name
        ] = data

    def get_context(self):

        return self.shared_data

    def get_agent_data(

        self,

        agent_name
    ):

        return self.shared_data.get(
            agent_name,
            {}
        )