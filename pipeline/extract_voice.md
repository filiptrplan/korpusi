# What is this?
Due to clashing dependencies, we cannot use the same environment for our processors and voice extraction using [Spleeter](https://github.com/deezer/spleeter).

This document contains instructions on how to extract voice from a song using Spleeter and prepare the extracted voice for use in our processors.

# Installation
First we need to install `ffmpeg`. On Ubuntu, you can install it using the following command:
```bash
sudo apt install ffmpeg
```
Then we need to install `spleeter`. Here we also use [pipx](https://github.com/pypa/pipx?tab=readme-ov-file) to install `spleeter` in an isolated environment.
```bash
sudo apt update
sudo apt install pipx
pipx ensurepath
pipx install spleeter
```

# Usage
First navigate to the directory where the song is located. Then run the following command to extract the voice from the song:
```bash
spleeter separate -p spleeter:2stems *.mp3 -f {filename}.{instrument}.{codec} -o . --codec mp3
```
This will process all the `.mp3` files in the current directory and save the extracted voice in the same directory.