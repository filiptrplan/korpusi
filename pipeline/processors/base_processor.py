class BaseProcessor:
    """
    Base class for all processors.
    All processors should inherit from this class and implement the process method.
    """

    def __init__(self, song: any, feature_name: str, mapping=None):
        """
        any song: The song to process.
        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        self.song = song
        self.feature_name = feature_name
        self.mapping = mapping

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format."""
        raise NotImplementedError

    def get_feature_name(self):
        """Returns the name of the processor."""
        return self.feature_name

    def get_mapping(self):
        """Returns the mapping of the processor."""
        if self.mapping is None:
            raise ValueError("Mapping not set")
        return self.mapping
