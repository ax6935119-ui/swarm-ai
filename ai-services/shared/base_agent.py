from abc import ABC, abstractmethod


class BaseAgent(ABC):

    def __init__(self, name):

        self.name = name

        self.status = "IDLE"

        self.confidence = 0.0

    def set_status(self, status):

        self.status = status

    def get_status(self):

        return self.status

    def set_confidence(self, confidence):

        self.confidence = confidence

    def get_confidence(self):

        return self.confidence

    @abstractmethod
    def analyze(self, data, global_context):
        pass

    @abstractmethod
    def decide(self, analysis):
        pass

    @abstractmethod
    def respond(self, decision):
        pass