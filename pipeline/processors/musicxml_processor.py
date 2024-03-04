import music21
from processors.base_processor import BaseProcessor


class MusicXMLProcessor(BaseProcessor):
    """
    Base class for all musicXML processors.
    All processors that process musicXML files should inherit from this class and implement the process method.
    """

    def __init__(self, song: music21.stream.Stream, name: str = None, mapping=None):
        """
        music21.stream.Stream song: The song to process. This should be output from music21.converter.parse.

        The name of the processor is automatically set to the name of the class. It should be hard-coded in the class to
        something meaningful to better identify the results.
        """
        if name is None:
            name = self.__class__.__name__
        super().__init__(song, name, mapping)

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format or a single value."""
        raise NotImplementedError

    def get_name(self):
        """Returns the name of the processor."""
        return self.name
