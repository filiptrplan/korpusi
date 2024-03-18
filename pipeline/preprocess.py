import os

import ffmpeg
import typer
from tqdm import tqdm

from helpers import check_audio_extension_allowed

app = typer.Typer()


@app.command()
def preprocess(in_dir: str, out_dir: str):
    """Shortens all the audio files to below 10 minutes and reduces the sampling rate to 8kHz."""
    if not os.path.isdir(in_dir):
        raise typer.BadParameter(f"{in_dir} is not a directory")
    if not os.path.isdir(out_dir):
        os.mkdir(out_dir)
    if in_dir == out_dir:
        raise typer.BadParameter(
            "Input and output directories cannot be the same, because the "
            "input files will be overwritten"
        )

    audio_files = [
        file for file in os.listdir(in_dir) if check_audio_extension_allowed(file)
    ]
    filter_dirs = [file for file in audio_files if not os.path.isdir(file)]

    for file in tqdm(filter_dirs):
        in_file = os.path.join(in_dir, file)
        out_file = os.path.join(out_dir, file)
        preprocess_file(in_file, out_file)


def preprocess_file(in_file, out_file):
    input = ffmpeg.input(in_file)
    audio_cut = input.audio.filter("atrim", duration=600)
    file_without_extension = os.path.splitext(out_file)[0]

    # Set the sample rate to 16000 if the file is vocals or accompaniment because PESTO requires 16kHz sample rate
    sample_rate = (
        16000
        if file_without_extension.endswith(".vocals")
        or file_without_extension.endswith(".accompaniment")
        else 8000
    )

    audio_resampled = audio_cut.output(
        file_without_extension + ".mp3",
        ar=sample_rate,
        loglevel="error",
        acodec="libmp3lame",
    )
    ffmpeg.run(audio_resampled, overwrite_output=True)
