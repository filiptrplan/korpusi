from processors.musicxml_processor import MusicXMLProcessor

class KeySignatureProcessor(MusicXMLProcessor):
    """Get the key signature of the song."""
    def __init__(self, song, name='key_signature'):
        super().__init__(song, name)

    def process(self):
        return 'C Major'
