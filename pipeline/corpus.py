import json
import os
from typing import Annotated, Optional

import urllib3
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
import typer

app = typer.Typer()

load_dotenv()
crt_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../certs/ca/ca.crt")
)
if os.getenv("ENABLE_SSL") == "true":
    client = Elasticsearch(
        hosts=os.getenv("ELASTIC_HOST"),
        basic_auth=(os.getenv("ELASTIC_USER"), os.getenv("ELASTIC_PASSWORD")),
        ca_certs=crt_path,
        verify_certs=True,
    )
else:
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    client = Elasticsearch(
        hosts=os.getenv("ELASTIC_HOST"),
        basic_auth=(os.getenv("ELASTIC_USER"), os.getenv("ELASTIC_PASSWORD")),
        verify_certs=False,
    )


@app.command()
def create_corpus(
    index: str,
    corpus_name: str,
    details_file: Annotated[
        Optional[str],
        typer.Option(
            help="A file containing details about the corpus. The file should be in JSON format. For the schema, see the README.",
        ),
    ],
):
    """Creates a corpus in the ElasticSearch database."""
    client.options(ignore_status=400).indices.create(
        index=index
    )  # create the index if it doesn't exist
    data = {
        "corpus_name": corpus_name,
    }
    if details_file:
        if not os.path.exists(details_file):
            raise FileNotFoundError(f"File {details_file} not found")
        file = open(details_file, "r")
        dictionairy = json.load(file)
        data = {**data, **dictionairy}

    api_response = client.index(index=index, document=data)
    print(f'Created corpus {corpus_name} with id {api_response["_id"]}')


@app.command()
def list_corpuses(index: str):
    """Lists all the corpuses and their ID"""
    api_response = client.search(index=index)
    for hit in api_response["hits"]["hits"]:
        print(f'{hit["_id"]}: {hit["_source"]["corpus_name"]}')
