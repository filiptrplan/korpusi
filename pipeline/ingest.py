"""
This file is the main entry point for the program.
"""
import json
import os
from typing_extensions import Annotated
import typer
import music21
from processors import test_processor

music_xml_processors = [
    # Add musicXML processors here
    test_processor.KeySignatureProcessor,
]

def main(in_file: str, out_file: Annotated[str, typer.Argument()] = None, pretty: bool = False):
    """Ingester main function. It processes the files and spits out the results in JSON."""
    # Check if in_file exists and is a file
    if not os.path.isfile(in_file):
        raise typer.BadParameter(f"File does not exist: {in_file}")

    results = process_musicxml(in_file, music_xml_processors)
    if pretty:
        results = json.dumps(json.loads(results), indent=4)
    if out_file is None:
        print(results)
    else:
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(results)
        print(f"Results written to {out_file}")

def process_musicxml(path: str, processors: list):
    """Processes a single MusicXML file and spits out the results in JSON."""
    music21_song = music21.converter.parse(path)
    results = {}
    for processor in processors:
        processor_instance = processor(music21_song)
        results[processor_instance.get_name()] = processor_instance.process()

    results['filename'] = os.path.basename(path)
    with open(path, 'r', encoding='utf-8') as f:
        results['original_file'] = f.read()

    return json.dumps(results)


if __name__ == '__main__':
    typer.run(main)
