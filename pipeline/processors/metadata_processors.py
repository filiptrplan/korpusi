import csv
import os.path


class CSVMetadataProcessor:
    csv_content = []
    csv_header = []

    def __init__(self, csv_file_path: str):
        """
        @param csv_file_path: This should be the path of the CSV file containing the metadata. The first row should be the
        header specifying different columns. This class will match the `filename` column and then output the other columns
        as metadata. Call the `process` function to get the metadata for a specific file.
        """
        with open(csv_file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.csv_content.append(row)
            self.csv_header = reader.fieldnames
            if "filename" not in self.csv_header:
                raise ValueError("CSV file must have a column named 'filename'")

    def get_mapping(self):
        properties_dict = {
            "filename": {"enabled": False},
        }

        for column in self.csv_header:
            if column != "filename":
                properties_dict[column] = {
                    "type": "keyword",
                    "fields": {"text": {"type": "text"}},
                }

        return {"properties": properties_dict}

    def process(self, file_path: str):
        """
        Returns the metadata for the file.
        """
        filename = os.path.basename(file_path)
        for row in self.csv_content:
            if row["filename"] == filename:
                return row
        return {}
