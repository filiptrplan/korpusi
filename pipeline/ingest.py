"""
This file is the main entry point for the program.
"""

import json
import os
from typing import Type

from tqdm import tqdm
from typing_extensions import Annotated
import typer
import music21
from typer_config.decorators import use_yaml_config

import generate_mapping
import preprocess
import processors.musicxml_processor
import processors.audio_processors
from helpers import (
    check_xml_extension_allowed,
    check_audio_extension_allowed,
    check_file_length,
    filter_files,
)
from config import music_xml_processors, audio_processors
import upload
import corpus
from processors.metadata_processors import CSVMetadataProcessor

app = typer.Typer()
app.registered_commands = (
    upload.app.registered_commands
    + corpus.app.registered_commands
    + preprocess.app.registered_commands
    + generate_mapping.app.registered_commands
)


# see also config.py for configuration


@app.command()
@use_yaml_config()
def process(
    corpus_id: Annotated[
        str, typer.Option(help="Id of the corpus which the file belongs to.")
    ],
    in_file: Annotated[str, typer.Option(help="Path to the file to process")] = None,
    out_file: str = None,
    in_dir: Annotated[
        str, typer.Option(help="Path to the directory to process")
    ] = None,
    out_dir: str = None,
    pretty: Annotated[
        bool, typer.Option(help="Whether to enable pretty printing")
    ] = False,
    include_original: Annotated[
        bool,
        typer.Option(
            help="Whether to include the original musicXML file in the JSON output"
        ),
    ] = True,
    print_output: bool = False,
    single_output: Annotated[
        bool,
        typer.Option(
            help="If all the files should be outputed as one newline delimited JSON"
        ),
    ] = False,
    csv_path: Annotated[
        str,
        typer.Option(help="Path to the CSV file containing the metadata for the files"),
    ] = None,
):
    """Processes MusicXMLs and outputs the results in JSON."""
    if in_file is not None and in_dir is not None:
        raise typer.BadParameter("Cannot specify both in_file and in_dir")
    if in_file is None and in_dir is None:
        raise typer.BadParameter("Must specify either in_file or in_dir")
    if out_file is not None and out_dir is not None:
        raise typer.BadParameter("Cannot specify both out_file and out_dir")

    # pretty printing is not supported for single output
    pretty = pretty and not single_output

    if in_file is not None:
        results = process_file(in_file, pretty, include_original, corpus_id, csv_path)
        if print_output is True:
            print(results)
        else:
            if out_file is None:
                out_file = os.path.splitext(in_file)[0] + ".json"
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(results)

    if in_dir is not None:
        if out_dir is None:
            out_dir = in_dir

        # remove old results.json
        if single_output is True and os.path.isfile(
            os.path.join(out_dir, "results.json")
        ):
            os.remove(os.path.join(out_dir, "results.json"))

        # process all files in the directory
        files = sorted(os.listdir(in_dir))
        filtered_files = filter_files(files)

        with tqdm(total=len(filtered_files)) as pbar:
            for file in filtered_files:
                in_file = os.path.join(in_dir, file)
                results = process_file(
                    in_file, pretty, include_original, corpus_id, csv_path
                )
                pbar.update(1)
                if print_output is True:
                    print(results)
                else:
                    if single_output is True:
                        out_file = os.path.join(out_dir, "results.json")
                        with open(out_file, "a", encoding="utf-8") as f:
                            f.write(results + "\n")
                    else:
                        out_file = os.path.join(
                            out_dir, os.path.splitext(file)[0] + ".json"
                        )
                        with open(out_file, "w", encoding="utf-8") as f:
                            f.write(results)


def process_file(
    in_file: str,
    pretty: bool,
    include_original: bool,
    corpus_id: str,
    csv_path: str = None,
):
    """Processes a single file and writes the results in JSON."""
    if not os.path.isfile(in_file):
        raise typer.BadParameter(f"File does not exist: {in_file}")

    if check_xml_extension_allowed(in_file):
        results = process_musicxml(in_file, music_xml_processors)
    elif check_audio_extension_allowed(in_file):
        results = process_audio(in_file, audio_processors)
    else:
        raise typer.BadParameter(f"File type not supported: {in_file}")

    metadata = process_metadata(in_file, csv_path)
    if "metadata" not in results:
        results["metadata"] = {}
    # add metadata to the metadata field because other processors might have a field with the same name
    results["metadata"].update(metadata)

    results["corpus_id"] = corpus_id
    results["filename"] = os.path.basename(in_file)
    if include_original:
        # include original only if it's a musicXML file
        if in_file.endswith(".xml") or in_file.endswith(".musicxml"):
            with open(in_file, "r", encoding="utf-8") as f:
                results["original_file"] = f.read()
    if pretty:
        results = json.dumps(results, indent=4)
    else:
        results = json.dumps(results)
    return results


def process_audio(
    path: str, processor_list: list[Type[processors.audio_processors.AudioProcessor]]
) -> dict[str, dict[str, object]]:
    """Processes a single audio file and spits out the results in dictionary form."""
    results = {}
    if not check_file_length(path):
        raise typer.BadParameter(
            f"{path} is too long. Must be less than 10 minutes. Refer to the preprocess "
            f"command to preprocess the files."
        )

    for processor in processor_list:
        processor_instance = processor(path)
        if processor_instance.get_feature_name() not in results:
            results[processor_instance.get_feature_name()] = {}
        results[processor_instance.get_feature_name()][
            processor_instance.get_algorithm_name()
        ] = processor_instance.process()

    return results


def process_musicxml(
    path: str,
    processor_list: list[Type[processors.musicxml_processor.MusicXMLProcessor]],
) -> dict[str, object]:
    """Processes a single MusicXML file and spits out the results in dictionary form."""
    music21_song = music21.converter.parse(path)
    results = {}
    for processor in processor_list:
        processor_instance = processor(music21_song)
        results[processor_instance.get_feature_name()] = processor_instance.process()

    return results


def process_metadata(path: str, csv_path):
    """Uses special metadata processors to process the metadata of the file."""
    metadata = {}
    if csv_path is not None:
        if not os.path.isfile(csv_path):
            raise typer.BadParameter(f"CSV file does not exist: {csv_path}")
        csv_processor = CSVMetadataProcessor(csv_path)
        metadata = csv_processor.process(path)

    return metadata


if __name__ == "__main__":
    app()
