import json
import os
import hashlib
from typing_extensions import Annotated
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
import typer
from typer_config.decorators import use_yaml_config

app = typer.Typer()

load_dotenv()
crt_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../certs/ca/ca.crt")
)
client = Elasticsearch(
    hosts=os.getenv("ELASTIC_HOST"),
    basic_auth=(os.getenv("ELASTIC_USER"), os.getenv("ELASTIC_PASSWORD")),
    ca_certs=crt_path,
    verify_certs=True,
)


def calculate_hash(json_str: str):
    """Calculates the hash of the original file from the JSON string."""
    obj = json.loads(json_str)
    m = hashlib.sha256()
    orig_file = obj["original_file"]
    m.update(orig_file.encode("utf-8"))
    return m.hexdigest()


def index_document(json_str: str, index: str):
    """Indexes a single document in the ElasticSearch database."""
    try:
        json.loads(json_str)
    except json.JSONDecodeError as e:
        raise e
    client.index(index=index, document=json_str, id=calculate_hash(json_str))


@app.command()
@use_yaml_config()
def upload(
    index: str,
    json_file: Annotated[
        str,
        typer.Option(
            help="Path to the JSON file to upload. It should feature one JSON file for each line."
        ),
    ] = None,
    json_dir: Annotated[
        str,
        typer.Option(
            help="Path to the directory containing the JSON files to upload. Each file is its separate document"
        ),
    ] = None,
    mapping_file: Annotated[
        str,
        typer.Option(
            help="Path to the mapping file. If not specified, it will be inferred from the path of the input file."
        ),
    ] = None,
    delete_index: Annotated[
        bool, typer.Option(help="Whether to delete the index before uploading.")
    ] = False,
):
    """Uploads JSON files to the ElasticSearch database."""
    if json_file is not None and json_dir is not None:
        raise typer.BadParameter("Cannot specify both json_file and json_dir")
    if json_file is None and json_dir is None:
        raise typer.BadParameter("Must specify either json_file or json_dir")
    if mapping_file is None:
        if json_file is not None:
            mapping_file = os.path.join(os.path.dirname(json_file), "mapping.json")
            if os.path.exists(mapping_file) is False:
                raise typer.BadParameter(f"Mapping file {mapping_file} does not exist")
        else:
            mapping_file = os.path.join(os.path.dirname(json_dir), "mapping.json")
            if os.path.exists(mapping_file) is False:
                raise typer.BadParameter(f"Mapping file {mapping_file} does not exist")

    with open(mapping_file, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    if delete_index is True:
        client.options(ignore_status=404).indices.delete(index=index)
    client.options(ignore_status=400).indices.create(index=index)
    client.indices.put_mapping(
        index=index, properties=mapping["properties"]
    )  # this is so we don't ignore 400 errors on mapping syntax

    if json_file is not None:
        with open(json_file, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                try:
                    index_document(line, index)
                except json.JSONDecodeError:
                    print(f"Line {i} in {json_file} is not valid JSON. Skipping...")
                print(f"Indexed line {i} in {json_file}")

    if json_dir is not None:
        for file in os.listdir(json_dir):
            if file.endswith(".json"):
                with open(os.path.join(json_dir, file), "r", encoding="utf-8") as f:
                    try:
                        index_document(f, index)
                    except json.JSONDecodeError:
                        print(f"{json_file} is not valid JSON. Skipping...")
                    print(f"Indexed {json_file}")
