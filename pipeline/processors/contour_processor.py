import music21

from processors.musicxml_processor import MusicXMLProcessor


class ContourProcessor(MusicXMLProcessor):
    """Gets the contour of the song. It describes the shape of the melody(when notes ascend or descend)."""

    song: music21.stream.Stream

    def __init__(self, song: music21.stream.Stream, feature_name="contour"):
        super().__init__(song, feature_name)
        self.mapping = {
            "properties": {
                "melodic_contour_string_relative": {"type": "text"},
                "melodic_contour_string": {"type": "text"},
                "measure_starts": {"type": "long"},
                "melodic_contour_string_absolute": {"type": "text"},
            }
        }

    def process(self):
        pitch_values = []
        # this is done because you can't set a measure number to a note and a note in a chord doesn't have one
        measure_numbers = []
        beats = []
        for x in self.song.parts[0].flatten():
            if len(measure_numbers) != 0:
                if (
                    measure_numbers[len(measure_numbers) - 1] == x.measureNumber
                    and beats[len(beats) - 1] == x.beat
                ):
                    continue  # prevents adding two notes that are played at the same time
            if isinstance(x, music21.note.Note):
                pitch_values.append(x)
                measure_numbers.append(x.measureNumber)
                beats.append(x.beat)
            elif isinstance(x, music21.chord.Chord):
                note = x.sortAscending()[len(x) - 1]
                measure_numbers.append(x.measureNumber)
                pitch_values.append(note)
                beats.append(x.beat)
        melodic_contour = []
        melodic_contour_string = ""
        for i in range(len(pitch_values) - 1):
            pitch_interval = music21.interval.Interval(
                pitch_values[i], pitch_values[i + 1]
            )
            semi = pitch_interval.semitones
            melodic_contour.append(semi)

        melodic_contour_string_absolute = " ".join(
            [str(x.pitch.midi) for x in pitch_values]
        )

        melodic_contour_string = ""
        for x in melodic_contour:
            if x > 0:
                melodic_contour_string += "U"
            elif x < 0:
                melodic_contour_string += "D"
            else:
                melodic_contour_string += "S"
            melodic_contour_string += (
                " "  # this is here so we can better search for the contour
            )

        measure_starts = [
            i
            for i in range(len(pitch_values))
            if measure_numbers[i] != measure_numbers[i - 1]
        ]

        return {
            "melodic_contour_string_relative": " ".join(
                [str(x) for x in melodic_contour]
            ),
            "melodic_contour_string": melodic_contour_string,
            "melodic_contour_string_absolute": melodic_contour_string_absolute,
            "measure_starts": measure_starts,
        }


class RhythmProcessor(MusicXMLProcessor):
    """Gets the rhythm of the song. It describes the duration of the notes."""

    song: music21.stream.Stream

    def __init__(self, song: music21.stream.Stream, feature_name="rhythm"):
        super().__init__(song, feature_name)
        self.mapping = {
            "properties": {
                "measure_starts": {"type": "long"},
                "rhythm_string": {"type": "text"},
            }
        }

    def process(self):
        rhythm_numeric = []
        # this is done because you can't set a measure number to a note and a note in a chord doesn't have one
        measure_numbers = []
        beats = []
        for x in self.song.parts[0].flatten():
            if len(measure_numbers) != 0:
                if (
                    measure_numbers[len(measure_numbers) - 1] == x.measureNumber
                    and beats[len(beats) - 1] == x.beat
                ):
                    continue  # prevents adding two notes that are played at the same time

            note = x
            if not isinstance(
                x, (music21.note.Note, music21.note.Rest, music21.chord.Chord)
            ):
                continue

            # notes in chords lose their measure number so we save it here
            measure_number = x.measureNumber
            if isinstance(x, music21.chord.Chord):
                note = x.sortAscending()[len(x) - 1]

            beats.append(note.beat)
            measure_numbers.append(measure_number)
            fraction = note.duration.quarterLength.as_integer_ratio()
            rhythm_numeric.append(f"{fraction[0]}/{fraction[1]}")

        rhythm_string = " ".join([str(x) for x in rhythm_numeric])
        return {
            "rhythm_string": rhythm_string,
            "measure_starts": [
                i
                for i in range(len(rhythm_numeric))
                if measure_numbers[i] != measure_numbers[i - 1]
            ],
        }
