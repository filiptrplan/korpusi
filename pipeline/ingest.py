"""
This file is the main entry point for the program.
"""
import os
import typer

def main(path: str):
    """Ingester main function. It processes the files and spits out the results in JSON."""
    # Check if path exists and is a file
    if not os.path.isfile(path):
        raise typer.BadParameter(f"File does not exist: {path}")


if __name__ == '__main__':
    typer.run(main)
