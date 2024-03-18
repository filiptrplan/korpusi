import os

from processors.metadata_processors import CSVMetadataProcessor

csv_file_name = "test.csv"
audio_file_name = "test.mp3"
csv_file_path = os.path.join(os.path.dirname(__file__), csv_file_name)


class TestMetadataProcessors:
    def test_csv_metadata_processor(self):
        csv_metadata_processor = CSVMetadataProcessor(csv_file_path)
        assert csv_metadata_processor.process(audio_file_name) == {
            "filename": "test.mp3",
            "url": "test_url_123",
        }

    def test_empty_csv_metadata_processor(self):
        csv_metadata_processor = CSVMetadataProcessor(csv_file_path)
        assert csv_metadata_processor.process("doesntexist.mp3") == {}
