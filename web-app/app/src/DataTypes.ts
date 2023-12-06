export interface SongResult extends Record<string, any> {
  corpus_id: string;
  metadata: {
    title: string;
    author: string;
    composer: string;
    movementName: string;
    copyright: string;
  };
  ambitus: {
    ambitus_semitones: number;
    max_note: number;
    min_note: number;
  };
  contour: {
    measure_starts: number[];
    melodic_contour_string: string;
    melodic_contour_string_relative: string;
    melodic_contour_string_absolute: string;
  };
  key: {
    alternative_keys: string[];
    most_certain_key: string;
  };
  rhythm: {
    rhythm_string: string;
    measure_starts: number[];
  };
  tempo: number;
  time_signature: string;
}
