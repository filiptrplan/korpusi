import os

from processors.audio_processors import (
    AudioFileInfoProcessor,
    AudioBPMProcessor,
    AudioPitchContourProcessor,
    AudioChordProcessor,
    AudioRMSProcessor,
)


def song():
    base_path = os.path.dirname(__file__)
    return os.path.join(base_path, "test.mp3")


class TestAudioProcessors:
    """Tests processors from audio_processors.py"""

    def test_audio_file_info_processor(self, snapshot):
        audio_file_info_processor = AudioFileInfoProcessor(song())
        assert audio_file_info_processor.process() == snapshot

    def test_audio_bpm_processor(self, snapshot):
        audio_bpm_processor = AudioBPMProcessor(song())
        assert audio_bpm_processor.process() == snapshot

    def test_audio_contour_processor(self, snapshot):
        audio_contour_processor = AudioPitchContourProcessor(song())
        assert audio_contour_processor.process() == snapshot

    def test_audio_chord_processor(self, snapshot):
        audio_chord_processor = AudioChordProcessor(song())
        assert audio_chord_processor.process() == snapshot

    def test_audio_rms_processor(self, snapshot):
        audio_chord_processor = AudioRMSProcessor(song())
        assert audio_chord_processor.process() == snapshot
