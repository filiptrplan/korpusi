# pylint: disable=import-error, missing-function-docstring
import music21

from processors.basic_processors import DurationProcessor, MetadataProcessor, AmbitusProcessor, TempoProcessor, \
    TimeSignatureProcessor, KeyProcessor


def song():
    return music21.converter.parse('tests/test.musicxml')


class TestBasicProcessors:
    """Tests processors from basic_processors.py"""
    def test_key_processor(self):
        key_processor = KeyProcessor(song())
        assert key_processor.process() == {
            "most_certain_key": "C",
            "alternate_keys": [
                "d",
                "c",
                "g",
                "G"
            ]
        }

    def test_time_signature_processor(self):
        time_signature_processor = TimeSignatureProcessor(song())
        assert time_signature_processor.process() == "3/8"

    def test_tempo_processor(self):
        tempo_processor = TempoProcessor(song())
        assert tempo_processor.process() == '120'

    def test_ambitus_processor(self):
        ambitus_processor = AmbitusProcessor(song())
        assert ambitus_processor.process() == {
            "min_note": 55,
            "max_note": 60,
            "ambitus_semitones": 5
        }

    def test_metadata_processor(self):
        metadata_processor = MetadataProcessor(song())
        assert metadata_processor.process() == {
            "composer": "Lovrenc Arni\u010d",
            "movementName": "test.musicxml",
            "title": "Mati"
        }

    def test_duration_processor(self):
        duration_processor = DurationProcessor(song())
        assert duration_processor.process() == {
            "measures": 33,
            "beats": 49.5
        }
