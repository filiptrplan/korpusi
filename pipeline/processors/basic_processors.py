from music21 import stream, tempo, note, interval, metadata, key
from processors.musicxml_processor import MusicXMLProcessor


class KeyProcessor(MusicXMLProcessor):
    """Get the key signature of the song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="key"):
        super().__init__(song, feature_name)
        self.mapping = {
            "properties": {
                "most_certain_key": {
                    "type": "keyword",
                    "fields": {"text": {"type": "text"}},
                },
                "alternate_keys": {
                    "type": "keyword",
                    "fields": {"text": {"type": "text"}},
                },
            }
        }

    def process(self) -> dict[str, list[str] | str]:
        song_key: key.Key = self.song.analyze("key")
        return {
            "most_certain_key": song_key.tonicPitchNameWithCase,
            "alternate_keys": [
                x.tonicPitchNameWithCase for x in song_key.alternateInterpretations[0:4]
            ],
            # get the first 4 alternate keys
        }


class TimeSignatureProcessor(MusicXMLProcessor):
    """Get all time signatures in the song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="time_signature"):
        super().__init__(song, feature_name)
        self.mapping = {"type": "keyword", "fields": {"text": {"type": "text"}}}

    def process(self) -> list[str]:
        time_signatures = set()

        # Iterate through all parts and measures to find time signatures
        for part in self.song.parts:
            measures = part.getElementsByClass(stream.Measure)
            for measure in measures:
                if measure.timeSignature is not None:
                    time_signatures.add(str(measure.timeSignature.ratioString))

        # Convert set to sorted list for consistent ordering
        return sorted(list(time_signatures))


class TempoProcessor(MusicXMLProcessor):
    """Get the tempo of the song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="tempo"):
        super().__init__(song, feature_name)
        self.mapping = {"type": "long"}

    def process(self) -> str:
        tempo_marks = []
        for sub_stream in self.song.recurse(streamsOnly=True, includeSelf=True):
            found = sub_stream.getElementsByClass(tempo.MetronomeMark)
            for x in found:
                tempo_marks.append(x)

        if len(tempo_marks) == 0:
            tempo_str = None
        elif tempo_marks[0].number is not None:
            tempo_str = str(tempo_marks[0].number)
        else:
            tempo_str = None
        return tempo_str


class AmbitusProcessor(MusicXMLProcessor):
    """Gets the 'ambitus' of a song. This is the range of the song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="ambitus"):
        super().__init__(song, feature_name)
        self.mapping = {
            "properties": {
                "min_note": {
                    "type": "long",
                },
                "max_note": {
                    "type": "long",
                },
                "ambitus_semitones": {"type": "long"},
            }
        }

    def process(self):
        notes = self.song.flatten().getElementsByClass(note.Note)
        min_note = note.Note(
            "C8"
        )  # je tole v redu? Ponavadi gre od 0 do 8 po oktavah navzgor
        max_note = note.Note("A0")
        for n in notes:
            max_note = max(n, max_note)
            min_note = min(n, min_note)

        my_interval = interval.Interval(noteStart=min_note, noteEnd=max_note)

        result = {
            "min_note": min_note.pitch.midi,
            "max_note": max_note.pitch.midi,
            "ambitus_semitones": my_interval.semitones,
        }

        return result


class MetadataProcessor(MusicXMLProcessor):
    """Gets the metadata of a song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="metadata"):
        super().__init__(song, feature_name)
        self.mapping = {
            "type": "object",
        }

    def process(self):
        my_metadata = self.song.getElementsByClass(metadata.Metadata)[0]
        my_metadata_tuples = my_metadata.all()
        my_metadata_dict = {}
        for t in my_metadata_tuples:
            my_metadata_dict[t[0]] = t[1]
        my_metadata_dict.pop("filePath")
        my_metadata_dict.pop("fileFormat")
        my_metadata_dict.pop("software")
        return my_metadata_dict


class DurationProcessor(MusicXMLProcessor):
    """Gets the duration of a song."""

    song: stream.Stream

    def __init__(self, song: stream.Stream, feature_name="duration"):
        super().__init__(song, feature_name)
        self.mapping = {
            "properties": {
                "measures": {"type": "long"},
                "beats": {"type": "long"},
            }
        }

    def process(self):
        beats = self.song.duration.quarterLength
        measures = 0
        for x in self.song.flatten():
            if x.measureNumber is not None and x.measureNumber > measures:
                measures = x.measureNumber
        return {"measures": measures, "beats": beats}
