export interface SongResult extends Record<string, any> {
  metadata: {
    title: string;
    author: string;
    composer: string;
  };
}
