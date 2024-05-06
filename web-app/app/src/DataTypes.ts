export interface SongResult extends Record<string, unknown> {
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

/**
 * K - union type of string that are already known algorithms
 * T - type of the data point
 */
type AudioFeature<K extends string, T> = Record<K, T>;

export interface AudioResult extends Record<string, unknown> {
  corpus_id: string;
  filename: string;
  file_hash_sha256: string;
  sample_rate: AudioFeature<
    "file_info",
    {
      sample_rate: number;
      duration: number;
      /**
       * Format like MP3 or WAV
       */
      encoding_subtype: string;
    }
  >;
  bpm: AudioFeature<
    "essentia_multifeature",
    {
      bpm: number;
      /**
       * Detected beat timestamps in seconds
       */
      beat_ticks: number[];
    }
  >;
  pitch_contour: AudioFeature<
    "pesto",
    {
      /**
       * The pitch of the voice stem in HZ, starts at 0 seconds and steps in `time_step_ms` milliseconds
       */
      pitch_contour_hz_voice: number[];
      /**
       * Same as `pitch_contour_hz_voice` but for instrumentals
       */
      pitch_contour_hz_instrumental: number[];
      /**
       * Time step between data points in milliseconds
       */
      time_step_ms: number;
    }
  >;
  chords: AudioFeature<
    "autochord",
    {
      /**
       * Start of chords in seconds
       */
      chord_start: number[];
      chord_end: number[];
      chord_name: string[];
    }
  >;
  metadata: {
    title: string;
    filename: string;
    URL: string;
  }
}
