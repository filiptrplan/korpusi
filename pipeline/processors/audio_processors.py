import os
import wave

import soundfile

from processors.base_processor import BaseProcessor


class AudioProcessor(BaseProcessor):
    """
    Base class for all audio processors.
    All processors that process audio files should inherit from this class and implement the process method.
    """

    def __init__(self, song: any, name: str = None, mapping=None):
        """
        any song: The path to the song to process.
        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        if not isinstance(song, str):
            raise ValueError("Song path must be a string")
        if not os.path.exists(song):
            raise ValueError("Song path does not exist")
        if not song.endswith('.wav'):
            raise ValueError("Song must be a .wav file. Please re-encode any other formats to WAV.")
        if name is None:
            name = self.__class__.__name__
        super().__init__(song, name, mapping)


class AudioFileInfoProcessor(AudioProcessor):
    """Gets the file information of the song like the duration, sample rate, and bit rate."""

    def __init__(self, song: any, name='sample_rate'):
        super().__init__(song, name)
        self.mapping = {
            'properties': {
                'sample_rate': {
                    'type': 'float'
                },
                'duration': {
                    'type': 'float'
                },
                'bit_depth': {
                    'type': 'float'
                }
            }
        }

    def process(self):
        file = soundfile.SoundFile(self.song)
        print(file.subtype)
        return {
            'sample_rate': file.samplerate,
            'duration': file.frames / file.samplerate,
            'bit_depth': file.subtype[0]
        }


class AudioBPMProcessor(AudioProcessor):
    """Gets the BPM of the song."""

    def __init__(self, song: any, name='bpm'):
        super().__init__(song, name)
        self.mapping = {
            'properties': {
                'bpm': {
                    'type': 'float'
                },
                'beat_ticks': {
                    'type': 'float'
                }
            }
        }

