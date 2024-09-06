"""
This file is the main entry point for the program.
"""

import hashlib
import json
import os
from typing import Type, List

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
    out_file: str = None,
    out_dir: str = None,
    in_dir: Annotated[
        str, typer.Option(help="Path to the directory to process")
    ] = None,
    include_original: Annotated[
        bool,
        typer.Option(
            help="Whether to include the original musicXML file in the JSON output"
        ),
    ] = True,
    print_output: bool = False,
    csv_path: Annotated[
        str,
        typer.Option(help="Path to the CSV file containing the metadata for the files"),
    ] = None,
    overwrite_features: Annotated[
        List[str],
        typer.Option(
            help="By default, the program checks whether the output file already exists and writes only "
            "non-existing features. You can specify all the features you want processed again or just write"
            "'all' to overwrite them all"
        ),
    ] = None,
):
    """Processes MusicXMLs and outputs the results in JSON."""
    if in_dir is None:
        raise typer.BadParameter("Must specify in_dir")
    if out_dir is None:
        out_dir = in_dir
    if out_file is None:
        out_file = os.path.join(out_dir, "results.json")

    # remove old results.json
    existing_out_file = out_file
    if os.path.exists(out_file):
        # if we overwrite all, just delete the file
        if "all" in overwrite_features:
            os.remove(out_file)
        else:
            existing_out_file = out_file + ".backup.json"
            with open(out_file, "r") as file1, open(existing_out_file, "w") as file2:
                file2.write(file1.read())
            os.remove(out_file)

    # process all files in the directory
    files = sorted(os.listdir(in_dir))
    filtered_files = filter_files(files)

    with tqdm(total=len(filtered_files)) as pbar:
        existing_json = None
        existing_json = read_existing_output_file(existing_out_file)
        for file in filtered_files:
            in_file = os.path.join(in_dir, file)
            results = process_file(
                in_file,
                print_output,
                include_original,
                corpus_id,
                existing_json,
                csv_path,
                overwrite_features,
            )

            pbar.update(1)
            if print_output is True:
                print(results)
            else:
                with open(out_file, "a", encoding="utf-8") as f:
                    f.write(results + "\n")


def read_existing_output_file(output_file: str):
    """Reads the existing output file and outputs a dictionary with the file hashes as keys and the pre-existing
    data as values"""
    results = {}
    if not os.path.exists(output_file):
        return None
    with open(output_file, "r", encoding="utf-8") as file:
        for line in file:
            try:
                row = json.loads(line)
                if "file_hash_sha256" not in row:
                    raise ValueError(
                        "File hash not in existing JSON. Can't match with files"
                    )
                results[row["file_hash_sha256"]] = row
            except json.JSONDecodeError:
                print(
                    "Invalid JSON on existing output file. Ignoring... Recommended to rename the existing file"
                )

    return results


def process_file(
    in_file: str,
    pretty: bool,
    include_original: bool,
    corpus_id: str,
    existing_json: dict,
    csv_path: str = None,
    overwrite_features=None,
):
    """Processes a single file and writes the results in JSON."""
    if overwrite_features is None:
        overwrite_features = []

    should_merge_existing = (
        existing_json is not None and "all" not in overwrite_features
    )

    if not os.path.isfile(in_file):
        raise typer.BadParameter(f"File does not exist: {in_file}")

    results = {}
    metadata = process_metadata(in_file, csv_path)

    if "metadata" not in results:
        results["metadata"] = {}

    # add metadata to the metadata field because other processors might have a field with the same name
    results["metadata"].update(metadata)

    results["corpus_id"] = corpus_id
    results["filename"] = os.path.basename(in_file)

    # calculate file hash
    with open(in_file, "rb") as file_to_hash:
        data = file_to_hash.read()
        m = hashlib.sha256()
        m.update(data)
        results["file_hash_sha256"] = m.hexdigest()

    filtered_musicxml_processors = music_xml_processors
    filtered_audio_processors = audio_processors

    # don't process features that won't be overwritten
    if should_merge_existing:
        # merge results
        if results["file_hash_sha256"] not in existing_json:
            print(
                "New file: "
                + results["file_hash_sha256"]
                + ", not merging with existing"
            )
        else:
            existing = existing_json[results["file_hash_sha256"]]
            results.update(existing)
            # always overwrite the corpus_id
            results["corpus_id"] = corpus_id
            if "metadata" in overwrite_features:
                results["metadata"] = metadata
            # filter only if we have a match
            filtered_audio_processors = [
                proc
                for proc in audio_processors
                if (proc(in_file).get_feature_name()) in overwrite_features
            ]
            filtered_musicxml_processors = [
                proc
                for proc in music_xml_processors
                if (proc(in_file).get_feature_name()) in overwrite_features
            ]

    if check_xml_extension_allowed(in_file):
        results.update(process_musicxml(in_file, filtered_musicxml_processors))
    elif check_audio_extension_allowed(in_file):
        results.update(process_audio(in_file, filtered_audio_processors))
    else:
        raise typer.BadParameter(f"File type not supported: {in_file}")

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
