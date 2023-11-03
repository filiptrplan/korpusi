"""
This file is the main entry point for the program.
"""
import json
import os
from typing_extensions import Annotated
import typer
import music21
import sys
from processors import basic_processors, contour_processor

music_xml_processors = [
    # Add musicXML processors here
    basic_processors.KeySignatureProcessor,
    basic_processors.TimeSignatureProcessor,
    basic_processors.TempoProcessor,
    basic_processors.AmbitusProcessor,
    basic_processors.MetadataProcessor,
    contour_processor.ContourProcessor,
]

def main(in_file: str, out_file: Annotated[str, typer.Argument()] = None, pretty: bool = False, include_original: bool = True):
    """Ingester main function. It processes the files and spits out the results in JSON."""
    # Check if in_file exists and is a file
    if not os.path.isfile(in_file):
        raise typer.BadParameter(f"File does not exist: {in_file}")

    results = process_musicxml(in_file, music_xml_processors)
    if include_original:
        results['filename'] = os.path.basename(in_file)
        with open(in_file, 'r', encoding='utf-8') as f:
            results['original_file'] = f.read()
    if pretty:
        results = json.dumps(results, indent=4)
    else:
        results = json.dumps(results)
    if out_file is None:
        print(results)
    else:
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(results)
        print(f"Results written to {out_file}")

def process_musicxml(path: str, processors: list):
    """Processes a single MusicXML file and spits out the results in dictionary form."""
    music21_song = music21.converter.parse(path)
    results = {}
    for processor in processors:
        processor_instance = processor(music21_song)
        results[processor_instance.get_name()] = processor_instance.process()

    return results


if __name__ == '__main__':
    typer.run(main)
