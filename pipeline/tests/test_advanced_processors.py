import os

import music21
from processors.contour_processor import (
    ContourProcessor,
    RhythmProcessor,
    NGramRhythmProcessor,
    NGramPitchProcessor,
)


def song():
    """
    Returns a music21 stream object of the test song.
    """
    base_path = os.path.dirname(__file__)
    path = os.path.join(base_path, "test.musicxml")

    return music21.converter.parse(path)


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

    def test_rhythm_ngram_processor(self, snapshot):
        rhythm_ngram_processor = NGramRhythmProcessor(song())
        result = rhythm_ngram_processor.process()
        assert result == snapshot

    def test_pitch_ngram_processor(self, snapshot):
        pitch_ngram_processor = NGramPitchProcessor(song())
        result = pitch_ngram_processor.process()
        assert result == snapshot
