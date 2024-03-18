import os

import soundfile

supported_xml_extensions = [".xml", ".musicxml"]
supported_audio_extensions = [".wav", ".flac", ".ogg", ".mp3"]


def filter_files(files):
    filter_extensions = [file for file in files if check_file_extension_allowed(file)]
    filter_splits = [file for file in filter_extensions if is_split_file(file)]
    filter_dirs = [file for file in filter_splits if not os.path.isdir(file)]
    return filter_dirs


def is_split_file(file: str):
    splits = file.split(".")
    if len(splits) < 2:
        return False
    return splits[-2] == "accompaniment" or splits[-2] == "vocals"


def check_file_length(path: str):
    """Returns true if the file is shorter than 10 minutes."""
    file = soundfile.SoundFile(path)
    return file.frames / file.samplerate <= 600


def check_file_extension_allowed(path: str):
    return check_xml_extension_allowed(path) or check_audio_extension_allowed(path)


def check_xml_extension_allowed(path: str):
    for ext in supported_xml_extensions:
        if path.endswith(ext):
            return True
    return False


def check_audio_extension_allowed(path: str):
    for ext in supported_audio_extensions:
        if path.endswith(ext):
            return True
    return False
