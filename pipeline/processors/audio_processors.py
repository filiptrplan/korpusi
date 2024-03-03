import os
import essentia
import essentia.standard

import soundfile

from processors.base_processor import BaseProcessor


class AudioProcessor(BaseProcessor):
    """
    Base class for all audio processors.
    All processors that process audio files should inherit from this class and implement the process method.
    """

    def __init__(self, song: str, name: str = None, mapping=None):
        """
        any song: The path to the song to process.
        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        if not isinstance(song, str):
            raise ValueError("Song path must be a string")
        if not os.path.exists(song):
            raise ValueError("Song path does not exist")
        if not song.endswith('.wav') and not song.endswith('.flac') and not song.endswith('.ogg') and not song.endswith(
                '.mp3'):
            raise ValueError("Song must be an audio file")
        if name is None:
            name = self.__class__.__name__
        super().__init__(song, name, mapping)

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format or a single value."""
        raise NotImplementedError("Subclasses must implement this method")


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
                'encoding_subtype': {
                    'type': 'float'
                }
            }
        }

    def process(self):
        file = soundfile.SoundFile(self.song)
        return {
            'sample_rate': file.samplerate,
            'duration': file.frames / file.samplerate,
            'encoding_subtype': file.subtype
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

    def process(self):
        loader = essentia.standard.MonoLoader(filename=self.song)
        audio = loader()

        rhythm_extractor = essentia.standard.RhythmExtractor2013(method="multifeature")
        beats = rhythm_extractor(audio)

        return {
            'bpm': beats[0],
            'beat_ticks': beats[1].tolist()
        }


class AudioPitchContourProcessor(AudioProcessor):
    """Gets the pitch contour of the song."""

    def __init__(self, song: any, name='pitch_contour'):
        super().__init__(song, name)
        self.mapping = {
            'properties': {
                'pitch_contour_hz_voice': {
                    'type': 'float'
                },
                'pitch_contour_hz_instrumental': {
                    'type': 'float'
                },
                'time_step_ms': {
                    'type': 'float'
                }
            }
        }

    def process(self):
        if not os.path.exists(self.song + '.voice'):
            raise ValueError(
                f"{self.song}.voice does not exist. Please run the voice extraction first. Refer to extract_voice.md for more information."
            )
        # loader = essentia.standard.MonoLoader(filename=self.song + '.voice')
        # audio = loader()
