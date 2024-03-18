import os

import soundfile

from helpers import check_audio_extension_allowed
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
        if not check_audio_extension_allowed(song):
            raise ValueError("Song must be an audio file")
        if name is None:
            name = self.__class__.__name__
        super().__init__(song, name, mapping)

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format or a single value."""
        raise NotImplementedError("Subclasses must implement this method")


class AudioFileInfoProcessor(AudioProcessor):
    """Gets the file information of the song like the duration, sample rate, and bit rate."""

    def __init__(self, song: any, name="sample_rate"):
        super().__init__(song, name)
        self.mapping = {
            "properties": {
                "sample_rate": {"type": "float"},
                "duration": {"type": "float"},
                "encoding_subtype": {"type": "float"},
            }
        }

    def process(self):
        file = soundfile.SoundFile(self.song)
        return {
            "sample_rate": file.samplerate,
            "duration": file.frames / file.samplerate,
            "encoding_subtype": file.subtype,
        }


class AudioBPMProcessor(AudioProcessor):
    """Gets the BPM of the song."""

    def __init__(self, song: any, name="bpm"):
        super().__init__(song, name)
        self.mapping = {
            "properties": {"bpm": {"type": "float"}, "beat_ticks": {"type": "float"}}
        }

    def process(self):
        import essentia.standard

        loader = essentia.standard.MonoLoader(filename=self.song)
        audio = loader()

        rhythm_extractor = essentia.standard.RhythmExtractor2013(method="multifeature")
        beats = rhythm_extractor(audio)

        bpm = round_floats(beats[0])
        beat_ticks = round_floats(beats[1].tolist())

        return {"bpm": bpm, "beat_ticks": beat_ticks}


class AudioPitchContourProcessor(AudioProcessor):
    """Gets the pitch contour of the song."""

    def __init__(self, song: any, name="pitch_contour"):
        super().__init__(song, name)
        self.mapping = {
            "properties": {
                "pitch_contour_hz_voice": {"type": "float"},
                "pitch_contour_hz_instrumental": {"type": "float"},
                "time_step_ms": {"type": "float"},
            }
        }

    def process(self):
        import torchaudio
        import torch
        from pesto import predict

        file_extension = self.song.split(".")[-1]
        rest_of_path = self.song[: -len(file_extension) - 1]
        step_size = 10.0

        voice_path = rest_of_path + ".vocals.mp3"
        instrumental_path = rest_of_path + ".accompaniment.mp3"
        if not os.path.exists(voice_path):
            raise ValueError(
                f"{voice_path} does not exist. Please run the voice extraction first. Refer to extract_voice.md for more information."
            )

        if not os.path.exists(instrumental_path):
            raise ValueError(
                f"{instrumental_path} does not exist. Please run the voice extraction first. Refer to extract_voice.md for more information."
            )

        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

        x, sr = torchaudio.load(voice_path)
        x = x.mean(dim=0)  # PESTO takes mono audio as input
        x = x.to(device)

        timesteps, predictions_voice, confidence, activations = predict(
            x, sr, step_size
        )

        x, sr = torchaudio.load(instrumental_path)
        x = x.mean(dim=0)
        x = x.to(device)
        timesteps, predictions_instrumental, confidence, activations = predict(
            x, sr, step_size
        )

        return {
            "pitch_contour_hz_voice": round_floats(predictions_voice.tolist()),
            "pitch_contour_hz_instrumental": round_floats(
                predictions_instrumental.tolist()
            ),
            "time_step_ms": step_size,
        }


class AudioChordProcessor(AudioProcessor):
    """Gets the chord progression of the song."""

    def __init__(self, song: any, name="chords"):
        super().__init__(song, name)
        self.mapping = {
            "properties": {
                "chord_name": {"type": "string"},
                "chord_start": {"type": "float"},
                "chord_end": {"type": "float"},
            }
        }

    def process(self):
        import autochord

        output = autochord.recognize(self.song)
        chord_names = [x[0] for x in output]
        chord_starts = round_floats([x[1] for x in output])
        chord_ends = round_floats([x[2] for x in output])
        return {
            "chord_name": chord_names,
            "chord_start": chord_starts,
            "chord_end": chord_ends,
        }


def round_floats(o):
    if isinstance(o, float):
        return round(o, 2)
    if isinstance(o, dict):
        return {k: round_floats(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [round_floats(x) for x in o]
    return o
