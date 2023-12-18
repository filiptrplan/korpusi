export interface SongResult extends Record<string, any> {
  corpus_id: string;
  metadata: {
    title: string;
    lyricist: string;
    author: string;
    composer: string;
    movementName: string;
    copyright: string;
  };
  ambitus: {
    /**
     * Number of semitones between the highest and lowest note
     */
    ambitus_semitones: number;
    /**
     * Highest note in MIDI pitch value
     */
    max_note: number;
    /**
     * Lowest note in MIDI pitch value
     */
    min_note: number;
  };
  duration: {
    beats: number;
    measures: number;
  };
  contour: {
    /**
     * Indexes of the start of each measure
     */
    measure_starts: number[];
    /**
     * Relative pitches, only UP, DOWN, SAME, e.g. "U U U D S"
     */
    melodic_contour_string: string;
    /**
     * The pitch values are relative to the previous note.
     */
    melodic_contour_string_relative: string;
    /**
     * The pitch values are absolute and are MIDI pitch values.
     */
    melodic_contour_string_absolute: string;
  };
  key: {
    /**
     * The top alternative most likely keys
     */
    alternative_keys: string[];
    /**
     * Most likely key, e.g. "C#"
     */
    most_certain_key: string;
  };
  rhythm: {
    /**
     * Used for searching for songs with the same rhythm.
     * E.g. "1/1 1/2 1/2 1/1 1/4"
     */
    rhythm_string: string;
    /**
     * Indexes of the start of each measure
     */
    measure_starts: number[];
  };
  /**
   * Tempo in BPM
   */
  tempo: number;
  /**
   * Time signature, e.g. "4/4"
   */
  time_signature: string;
  /**
   * Original musicXML file
   */
  original_file: string;
}
