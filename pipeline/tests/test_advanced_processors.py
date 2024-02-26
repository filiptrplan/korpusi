# pylint: disable=import-error, missing-function-docstring
import music21
from processors.contour_processor import ContourProcessor, RhythmProcessor


def song():
    """
    Returns a music21 stream object of the test song.
    """
    return music21.converter.parse('tests/test.musicxml')


class TestAdvancedProcessors:
    """Tests processors from contour_processor.py"""

    def test_contour_processor(self):
        contour_processor = ContourProcessor(song())
        result = contour_processor.process()

        assert result['melodic_contour_string_relative'].startswith("-3 3 -3 3 0 0")
        assert result['melodic_contour_string'].startswith("D U D U S")
        assert result['measure_starts'] == [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 29, 32, 34, 36, 38, 40,
                                            42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 65, 66]
        assert result['melodic_contour_string_absolute'].startswith("67 64 67 64 67 67 67 65 65")

    def test_rhythm_processor(self):
        rhythm_processor = RhythmProcessor(song())
        result = rhythm_processor.process()

        assert result['rhythm_string'].startswith("1/1 1/2 1/1 1/2 1/1 1/2 1/1 1/2 1/1 1/2 1/1 1/2 1/1 1/2")
        assert result['measure_starts'] == [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 29, 32, 34, 36, 38, 40,
                                            42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 65, 66]
