class BaseProcessor:
    """
    Base class for all processors. 
    All processors should inherit from this class and implement the process method.
    """
    def __init__(self, song: any, name: str):
        """    
        any song: The song to process. 
        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        self.song = song
        self.name = name

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format."""
        raise NotImplementedError

    def get_name(self):
        """Returns the name of the processor."""
        return self.name
