import uuid
import time

from shared.global_context import GlobalContext

from shared.communication_manager import CommunicationManager

from shared.memory_manager import MemoryManager

from shared.logger import (
    system_logger,
    agent_logger,
    error_logger
)


class SwarmOrchestrator:

    def __init__(self, agents):

        self.global_context = GlobalContext()
        self.memory_manager = MemoryManager()
        self.communication_manager = (
            CommunicationManager()
        )

        self.agents = agents

    def process_event(self, event):

        event_id = str(uuid.uuid4())

        start_time = time.time()

        system_logger.info(
            f"Event {event_id} received by orchestrator"
        )

        responses = {}

        event_timeline = []

        for agent in self.agents:

            try:

                agent_logger.info(
                    f"{agent.name} started analysis"
                )

                event_timeline.append(
                    f"{agent.name} started analysis"
                )

                analysis = agent.analyze(
                    event,
                 {
                    "global_context":
                    self.global_context,

                    "communication_manager":
                    self.communication_manager,

                    "memory_manager":
                    self.memory_manager
                 }
                )

                decision = agent.decide(
                    analysis
                )

                response = agent.respond(
                    decision
                )

                agent_logger.info(
                    f"{agent.name} decision: {decision}"
                )

                event_timeline.append(
                    f"{agent.name} completed response"
                )

                responses[agent.name] = response

                self.global_context.update_context(
                    agent.name,
                    response
                )

            except Exception as e:

                error_logger.error(
                    f"{agent.name} failed: {str(e)}"
                )

                event_timeline.append(
                    f"{agent.name} failed"
                )

        total_execution_time = round(
            time.time() - start_time,
            3
        )

        system_logger.info(
            f"Event {event_id} processing completed"
        )

        final_response = {

            "event_id": event_id,

            "system_status": "ACTIVE",

            "total_execution_time":
            f"{total_execution_time}s",

            "disaster_event": event,

            "agent_responses": responses,

            "event_timeline": event_timeline,

            "agent_communications":
            self.communication_manager.get_messages(),

            "global_context":
            self.global_context.get_context()
        }
        self.memory_manager.store_event(
             event
        )
        return final_response