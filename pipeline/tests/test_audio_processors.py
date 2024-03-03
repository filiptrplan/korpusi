# pylint: disable=import-error, missing-function-docstring
from processors.audio_processors import AudioFileInfoProcessor, AudioBPMProcessor


def song():
    return "test.mp3"


class TestAudioProcessors:
    """Tests processors from audio_processors.py"""
    def test_audio_file_info_processor(self, snapshot):
        audio_file_info_processor = AudioFileInfoProcessor(song())
        assert audio_file_info_processor.process() == snapshot

    def test_audio_bpm_processor(self, snapshot):
        audio_bpm_processor = AudioBPMProcessor(song())
        assert audio_bpm_processor.process() == snapshot
