from music21 import stream, tempo, note, interval, metadata
from processors.musicxml_processor import MusicXMLProcessor

class KeySignatureProcessor(MusicXMLProcessor):
    """Get the key signature of the song."""
    song: stream.Stream
    def __init__(self, song: stream.Stream, name='key_signature'):
        super().__init__(song, name)
        self.mapping = {
            'type': 'keyword'
        }

    def process(self) -> str:
        first_measure: stream.Measure = self.song.parts[0].getElementsByClass(stream.Measure)[0]
        key_signature = str(first_measure.keySignature.asKey().tonicPitchNameWithCase) # lowercase = minor, uppercase = major
        return key_signature

class TimeSignatureProcessor(MusicXMLProcessor):
    """Get the time signature of the song."""
    song: stream.Stream
    def __init__(self, song: stream.Stream, name='time_signature'):
        super().__init__(song, name)
        self.mapping = {
            'type': 'keyword',
            'fields': {
                'text': { 'type': 'text'}
            }
        }

    def process(self) -> str:
        first_measure: stream.Measure = self.song.parts[0].getElementsByClass(stream.Measure)[0]
        time_signature = str(first_measure.timeSignature.ratioString)
        return time_signature

class TempoProcessor(MusicXMLProcessor):
    """Get the tempo of the song."""
    song: stream.Stream
    def __init__(self, song: stream.Stream, name='tempo'):
        super().__init__(song, name)
        self.mapping = {
            'type': 'long'
        }

    def process(self) -> str:
        tempo_marks = []
        for sub_stream in self.song.recurse(streamsOnly=True, includeSelf=True):
            found = sub_stream.getElementsByClass(tempo.MetronomeMark)
            for x in found:
                tempo_marks.append(x)

        if len(tempo_marks) == 0:
            tempo_str = None
        else:
            tempo_str = str(tempo_marks[0].number)
        return tempo_str
   
class AmbitusProcessor(MusicXMLProcessor):
    """Gets the 'ambitus' of a song. This is the range of the song."""
    song: stream.Stream
    def __init__(self, song: stream.Stream, name='ambitus'):
        super().__init__(song, name)
        self.mapping = {
            'properties': {
                'min_note': { 
                    'type': 'keyword',           
                    'fields': {
                        'text': { 'type': 'text'}
                    } 
                },
                'max_note': { 
                    'type': 'keyword',           
                    'fields': {
                        'text': { 'type': 'text'}
                    } 
                },
                'ambitus_semitones': { 'type': 'long' }
            }
        }

    def process(self):
        notes = self.song.flatten().getElementsByClass(note.Note)
        min_note = note.Note('C8') # je tole v redu? Ponavadi gre od 0 do 8 po oktavah navzgor
        max_note = note.Note('A0')
        for n in notes:
            if n > max_note:
                max_note = n
            if n < min_note:
                min_note = n

        my_interval = interval.Interval(noteStart=min_note, noteEnd=max_note)

        result = {
            'min_note': str(min_note.nameWithOctave),
            'max_note': str(max_note.nameWithOctave),
            'ambitus_semitones': my_interval.semitones
        }

        return result

class MetadataProcessor(MusicXMLProcessor):
    """Gets the metadata of a song."""
    song: stream.Stream
    def __init__(self, song: stream.Stream, name='metadata'):
        super().__init__(song, name)
        self.mapping = {
            'type': 'object',
        }

    def process(self):
        my_metadata = self.song.getElementsByClass(metadata.Metadata)[0]
        my_metadata_tuples = my_metadata.all()
        my_metadata_dict = {}
        for t in my_metadata_tuples:
            my_metadata_dict[t[0]] = t[1]
        my_metadata_dict.pop('filePath')
        my_metadata_dict.pop('fileFormat')
        my_metadata_dict.pop('software')
        return my_metadata_dict
        