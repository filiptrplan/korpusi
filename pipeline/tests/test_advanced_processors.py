import music21
from processors.contour_processor import ContourProcessor, RhythmProcessor


def song():
    """
    Returns a music21 stream object of the test song.
    """
    return music21.converter.parse("tests/test.musicxml")


class TestAdvancedProcessors:
    """Tests processors from contour_processor.py"""

    def test_contour_processor(self, snapshot):
        contour_processor = ContourProcessor(song())
        result = contour_processor.process()
        assert result == snapshot

    def test_rhythm_processor(self, snapshot):
        rhythm_processor = RhythmProcessor(song())
        result = rhythm_processor.process()
        assert result == snapshot
