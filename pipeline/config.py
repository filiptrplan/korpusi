# These must be before the imports
supported_xml_extensions = [".xml", ".musicxml"]
supported_audio_extensions = [".wav", ".flac", ".ogg", ".mp3"]

from processors import basic_processors, contour_processor, audio_processors  # noqa: E402

music_xml_processors = [
    # Add musicXML processors here
    basic_processors.KeyProcessor,
    basic_processors.TimeSignatureProcessor,
    basic_processors.TempoProcessor,
    basic_processors.AmbitusProcessor,
    basic_processors.MetadataProcessor,
    basic_processors.DurationProcessor,
    contour_processor.ContourProcessor,
    contour_processor.RhythmProcessor,
]

audio_processors = [
    # Add audio processors here
    audio_processors.AudioFileInfoProcessor,
    audio_processors.AudioBPMProcessor,
    audio_processors.AudioPitchContourProcessor,
    audio_processors.AudioChordProcessor,
]
