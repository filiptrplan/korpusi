import os

import soundfile

from helpers import check_audio_extension_allowed
from processors.base_processor import BaseProcessor


class AudioProcessor(BaseProcessor):
    """
    Base class for all audio processors.
    All processors that process audio files should inherit from this class and implement the process method.
    """

    def __init__(
        self,
        song: str,
        algorithm_name: str = None,
        feature_name: str = None,
        mapping=None,
    ):
        """
        any song: The path to the song to process.
        str name: The name of the processor. This is the name of the field that the results will be stored in.
        """
        # Song is None when using it for mapping generation
        if song is not None:
            if not isinstance(song, str):
                raise ValueError("Song path must be a string")
            if not os.path.exists(song):
                raise ValueError("Song path does not exist")
            if not check_audio_extension_allowed(song):
                raise ValueError("Song must be an audio file")
        if feature_name is None:
            feature_name = self.__class__.__name__
        if algorithm_name is None:
            raise ValueError("Algorithm name must be specified.")
        self.algorithm_name = algorithm_name
        super().__init__(song, feature_name, mapping)

    def process(self):
        """The main function of the processor. It should spit out the results in dictionary format or a single value."""
        raise NotImplementedError("Subclasses must implement this method")

    def get_algorithm_name(self):
        """Returns the name of the algorithm used for the processor."""
        return self.algorithm_name


class AudioFileInfoProcessor(AudioProcessor):
    """Gets the file information of the song like the duration, sample rate, and bit rate."""

    def __init__(self, song: any):
        super().__init__(song, "file_info", "sample_rate")
        self.mapping = {
            "properties": {
                "sample_rate": {"type": "float"},
                "duration": {"type": "float"},
                "encoding_subtype": {"type": "keyword"},
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

    def __init__(self, song: any):
        super().__init__(song, "essentia_multifeature", "bpm")
        self.mapping = {
            "properties": {"bpm": {"type": "float"}, "beat_ticks": {"type": "float"}}
        }

    def process(self):
        import essentia.standard

        # let the loader resample here! if we include the original sample rate it ruins the accuracy
        # of the algorithm
        loader = essentia.standard.MonoLoader(filename=self.song)
        audio = loader()

        rhythm_extractor = essentia.standard.RhythmExtractor2013(method="multifeature")
        beats = rhythm_extractor(audio)

        bpm = round_floats(beats[0])
        beat_ticks = round_floats(beats[1].tolist())

        return {"bpm": bpm, "beat_ticks": beat_ticks}


class AudioPitchContourProcessor(AudioProcessor):
    """Gets the pitch contour of the song."""

    def __init__(self, song: any):
        super().__init__(song, "pesto", "pitch_contour")
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

    def __init__(self, song: any):
        super().__init__(song, "autochord", "chords")
        self.mapping = {
            "properties": {
                "chord_name": {"type": "keyword"},
                "chord_start": {"type": "float"},
                "chord_end": {"type": "float"},
            }
        }

    def process(self):
        import autochord

        output = autochord.recognize(self.song)
        chord_names = [x[2] for x in output]
        chord_starts = round_floats([x[0] for x in output])
        chord_ends = round_floats([x[1] for x in output])
        return {
            "chord_name": chord_names,
            "chord_start": chord_starts,
            "chord_end": chord_ends,
        }


class AudioRMSProcessor(AudioProcessor):
    def __init__(self, song: any):
        super().__init__(song, "rms", "loudness")
        self.mapping = {
            "properties": {
                "loudness_total": {"type": "float"},
                "loudness_vocals": {"type": "float"},
                "loudness_instrumental": {"type": "float"},
                "timestep_seconds": {"type": "float"},
            }
        }

    def rms(self, song):
        import essentia.standard as es

        sample_rate = get_sample_rate(song)
        frame_size = int(sample_rate / 16)
        hop_size = int(frame_size / 2)

        loader = es.MonoLoader(filename=song, sampleRate=sample_rate)
        audio = loader()

        rms = es.RMS()
        rms_values = []

        for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size):
            rms_values.append(rms(frame))

        rms_timestep_seconds = hop_size / sample_rate

        return (rms_values, rms_timestep_seconds)

    def process(self):
        file_extension = self.song.split(".")[-1]
        rest_of_path = self.song[: -len(file_extension) - 1]

        voice_path = rest_of_path + ".vocals.mp3"
        instrumental_path = rest_of_path + ".accompaniment.mp3"

        (rms_values_total, timestep) = self.rms(self.song)
        (rms_values_vocals, _) = self.rms(voice_path)
        (rms_values_instrumental, _) = self.rms(instrumental_path)

        return {
            "loudness_total": rms_values_total,
            "loudness_vocals": rms_values_vocals,
            "loudness_instrumental": rms_values_instrumental,
            "timestep_seconds": timestep,
        }


class AudioKeyExtractProcessor(AudioProcessor):
    def __init__(self, song: any):
        super().__init__(song, "essentia_key_extractor", "key")
        self.mapping = {
            "properties": {
                "key": {"type": "keyword"},
                "scale": {"type": "keyword"},
                "confidence": {"type": "float"},
            }
        }

    def process(self):
        import essentia.standard as es

        loader = es.MonoLoader(filename=self.song)
        audio = loader()
        key_extract = es.KeyExtractor()

        (key, scale, confidence) = key_extract(audio)

        return {"key": key, "scale": scale, "confidence": confidence}


def round_floats(o):
    if isinstance(o, float):
        return round(o, 2)
    if isinstance(o, dict):
        return {k: round_floats(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [round_floats(x) for x in o]
    return o


def get_sample_rate(song):
    import soundfile

    file = soundfile.SoundFile(song)
    return file.samplerate
