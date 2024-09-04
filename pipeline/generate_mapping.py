import json
from typing import Annotated
import typer
from typer_config import use_yaml_config

from config import music_xml_processors, audio_processors

app = typer.Typer()


@app.command()
@use_yaml_config()
def generate_mapping(
    out_file: str,
    processor_type: Annotated[
        str,
        typer.Argument(
            help="Type of the mapping to generate. Can be 'audio' or 'musicxml'"
        ),
    ],
):
    """Generates a mapping file for the ElasticSearch database."""
    processors = []
    if processor_type == "audio":
        processors = audio_processors
    elif processor_type == "musicxml":
        processors = music_xml_processors
    else:
        raise typer.BadParameter("Invalid type. Must be 'audio' or 'musicxml'")

    with open(out_file, "w", encoding="utf-8") as f:
        mapping = {
            "properties": {
                "filename": {"enabled": False},
                "original_file": {"enabled": False},
                "corpus_id": {"type": "keyword"},
                "file_hash_sha256": {"enabled": False},
            }
        }
        for processor in processors:
            processor_instance = processor(None)
            if processor_instance.get_feature_name() not in mapping["properties"]:
                mapping["properties"][processor_instance.get_feature_name()] = {
                    "properties": {}
                }
            mapping["properties"][processor_instance.get_feature_name()]["properties"][
                processor_instance.get_algorithm_name()
            ] = processor_instance.get_mapping()
        f.write(json.dumps(mapping, indent=4))

    print(f"Mapping file generated at {out_file}")
