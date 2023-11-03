import music21

class Processor:
    """
    Base class for all processors. 
    All processors should inherit from this class and implement the process method.
    """
    def __init__(self, song: music21.stream.Stream, name: str):
        """    
        music21.stream.Stream song: The song to process. This should be output from music21.converter.parse.

        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        self.song = song
        self.name = name


    def process(self):
        """The main function of the processor. It should spit out the results in JSON."""
        raise NotImplementedError
    
    
    def get_results(self):
        """Returns the results of the process function in JSON."""
        raise NotImplementedError


    def get_name(self):
        """Returns the name of the processor."""
        return self.name
