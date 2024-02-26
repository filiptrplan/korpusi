"""
This file is the main entry point for the program.
"""
import json
import os
from typing_extensions import Annotated
import typer
import music21
from typer_config.decorators import use_yaml_config
from processors import basic_processors, contour_processor
import upload
import corpus

app = typer.Typer()
app.registered_commands = upload.app.registered_commands + corpus.app.registered_commands

music_xml_processors = [
    # Add musicXML processors here
    basic_processors.KeyProcessor,
    basic_processors.TimeSignatureProcessor,
    basic_processors.TempoProcessor,
    basic_processors.AmbitusProcessor,
    basic_processors.MetadataProcessor,
    basic_processors.DurationProcessor,
    contour_processor.ContourProcessor,
    contour_processor.RhythmProcessor
]


@app.command()
@use_yaml_config()
def process(
        corpus_id: Annotated[str, typer.Option(help='Id of the corpus which the file belongs to.')],
        in_file: Annotated[str, typer.Option(
            help='Path to the file to process')] = None,
        out_file: str = None,
        mapping_file: str = None,
        in_dir: Annotated[str, typer.Option(
            help='Path to the directory to process')] = None,
        out_dir: str = None,
        pretty: bool = False,
        include_original: Annotated[bool, typer.Option(
            help='Whether to include the original musicXML file in the JSON output')] = True,
        print_output: bool = False,
        single_output: Annotated[bool, typer.Option(
            help='If all the files should be outputed as one newline delimited JSON')] = False,
):
    """Processes MusicXMLs and outputs the results in JSON."""
    if in_file is not None and in_dir is not None:
        raise typer.BadParameter("Cannot specify both in_file and in_dir")
    if in_file is None and in_dir is None:
        raise typer.BadParameter("Must specify either in_file or in_dir")

    # pretty printing is not supported for single output
    pretty = pretty and not single_output

    if in_file is not None:
        results = process_file(in_file, pretty, include_original, corpus_id)
        if print_output is True:
            print(results)
        else:
            if out_file is None:
                out_file = os.path.splitext(in_file)[0] + '.json'
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(results)

    if in_dir is not None:
        if out_dir is None:
            out_dir = in_dir

        # remove old results.json
        if single_output is True and os.path.isfile(os.path.join(out_dir, 'results.json')):
            os.remove(os.path.join(out_dir, 'results.json'))

        # process all files in the directory
        files = sorted(os.listdir(in_dir))
        for file in files:
            if file.endswith(".xml") or file.endswith(".musicxml"):
                in_file = os.path.join(in_dir, file)
                results = process_file(in_file, pretty, include_original, corpus_id)
                if print_output is True:
                    print(results)
                else:
                    if single_output is True:
                        out_file = os.path.join(out_dir, 'results.json')
                        with open(out_file, 'a', encoding='utf-8') as f:
                            f.write(results + '\n')
                    else:
                        out_file = os.path.join(
                            out_dir, os.path.splitext(file)[0] + '.json')
                        with open(out_file, 'w', encoding='utf-8') as f:
                            f.write(results)
                    print(f"Processed {in_file}")

    if mapping_file is None:
        if out_dir is None:
            if out_file is None:
                mapping_file = os.path.join(
                    os.path.dirname(in_file), 'mapping.json')
            else:
                mapping_file = os.path.join(
                    os.path.dirname(out_file), 'mapping.json')
        else:
            mapping_file = os.path.join(out_dir, 'mapping.json')
        with open(mapping_file, 'w', encoding='utf-8') as f:
            mapping = {'properties': {
                'filename': {'enabled': False},
                'original_file': {'enabled': False},
                'corpus_id': {'type': 'keyword'}
            }}
            for processor in music_xml_processors:
                processor_instance = processor(None)
                mapping['properties'][processor_instance.get_name(
                )] = processor_instance.get_mapping()
            f.write(json.dumps(mapping, indent=4))


def process_file(in_file: str, pretty: bool, include_original: bool, corpus_id: str):
    """Processes a single file and writes the results in JSON."""
    if not os.path.isfile(in_file):
        raise typer.BadParameter(f"File does not exist: {in_file}")

    results = process_musicxml(in_file, music_xml_processors)
    results['corpus_id'] = corpus_id
    if include_original:
        results['filename'] = os.path.basename(in_file)
        with open(in_file, 'r', encoding='utf-8') as f:
            results['original_file'] = f.read()
    if pretty:
        results = json.dumps(results, indent=4)
    else:
        results = json.dumps(results)
    return results


def process_musicxml(path: str, processors: list):
    """Processes a single MusicXML file and spits out the results in dictionary form."""
    music21_song = music21.converter.parse(path)
    results = {}
    for processor in processors:
        processor_instance = processor(music21_song)
        results[processor_instance.get_name()] = processor_instance.process()

    return results


if __name__ == '__main__':
    app()
